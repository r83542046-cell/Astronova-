import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Gemini client if key is present (never fail startup if absent)
const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
const ai = geminiKey
  ? new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface NasaCachedItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  dateCreated: string;
  center: string;
  sourceUrl: string;
  topic: string;
}

const nasaCache = new Map<string, { expiresAt: number; items: NasaCachedItem[]; solarFlares: unknown[] }>();

const VERIFIED_NASA_FALLBACK: Record<string, NasaCachedItem[]> = {
  station: [
    {
      id: 'iss068e041521',
      title: 'International Space Station Above Earth Horizon',
      description:
        'Orbiting roughly 408 km above Earth at 28,000 km/h, the International Space Station uses large solar arrays to generate electricity and test closed-loop life support systems.',
      imageUrl: 'https://images-assets.nasa.gov/image/iss068e041521/iss068e041521~medium.jpg',
      dateCreated: '2023-02-14',
      center: 'JSC',
      sourceUrl: 'https://www.nasa.gov/international-space-station/',
      topic: 'station',
    },
  ],
  mars: [
    {
      id: 'PIA24428',
      title: 'Perseverance Rover Inside Jezero Crater, Mars',
      description:
        'NASA’s Perseverance rover explores Jezero Crater—an ancient lakebed where water flowed billions of years ago—searching for mineral clues and testing oxygen production on Mars.',
      imageUrl: 'https://images-assets.nasa.gov/image/PIA24428/PIA24428~medium.jpg',
      dateCreated: '2021-03-04',
      center: 'JPL',
      sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
      topic: 'mars',
    },
  ],
  moon: [
    {
      id: 'artemis-moon-south-pole',
      title: 'Lunar South Pole & Permanently Shadowed Craters',
      description:
        'Near the Moon’s South Pole, sunlight hits crater rims while deep crater floors stay in permanent shadow—trapping ancient water ice that future Artemis astronauts can study.',
      imageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001980/GSFC_20171208_Archive_e001980~medium.jpg',
      dateCreated: '2019-07-16',
      center: 'GSFC',
      sourceUrl: 'https://science.nasa.gov/moon/',
      topic: 'moon',
    },
  ],
  solar: [
    {
      id: 'GSFC_20171208_Archive_e000790',
      title: 'Solar Dynamics Observatory: Active Solar Flare Region',
      description:
        'NASA’s Solar Dynamics Observatory watches magnetic eruptions and Coronal Mass Ejections (CMEs) on the Sun so spacecraft crews can shield sensitive electronics during solar storms.',
      imageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000790/GSFC_20171208_Archive_e000790~medium.jpg',
      dateCreated: '2017-09-06',
      center: 'GSFC',
      sourceUrl: 'https://science.nasa.gov/sun/',
      topic: 'solar',
    },
  ],
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    promise.then(
      (val) => {
        clearTimeout(id);
        resolve(val);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      }
    );
  });
}

async function fetchWithTimeout(url: string, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Official NASA Open Data & Images Feed (Cached 15 min + Verified Fallback)
  app.get('/api/nasa/feed', async (req, res) => {
    const topicRaw = String(req.query.topic || 'station').toLowerCase();
    const topic = ['station', 'mars', 'moon', 'solar'].includes(topicRaw) ? topicRaw : 'station';
    const now = Date.now();
    const cached = nasaCache.get(topic);
    if (cached && cached.expiresAt > now) {
      return res.json({
        source: 'NASA Images & DONKI Cache',
        live: true,
        items: cached.items,
        solarFlares: cached.solarFlares,
      });
    }

    const queryMap: Record<string, string> = {
      station: 'international space station earth orbit',
      mars: 'perseverance jezero crater mars',
      moon: 'lunar south pole artemis moon crater',
      solar: 'solar flare coronal mass ejection sdo',
    };

    let items: NasaCachedItem[] = [];
    let solarFlares: unknown[] = [];
    let live = false;

    try {
      const imgUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(queryMap[topic])}&media_type=image&page_size=6`;
      const imgRes = await fetchWithTimeout(imgUrl, 4500);
      if (imgRes.ok) {
        const json = (await imgRes.json()) as {
          collection?: {
            items?: Array<{
              data?: Array<{
                nasa_id?: string;
                title?: string;
                description?: string;
                date_created?: string;
                center?: string;
              }>;
              links?: Array<{ href?: string; rel?: string }>;
            }>;
          };
        };
        const rawItems = json.collection?.items || [];
        items = rawItems
          .filter((it) => it.data?.[0] && it.links?.[0]?.href)
          .slice(0, 4)
          .map((it) => {
            const d = it.data![0];
            return {
              id: d.nasa_id || topic,
              title: d.title || 'NASA Mission Imagery',
              description: (d.description || '').replace(/<[^>]+>/g, '').slice(0, 260),
              imageUrl: it.links![0].href!,
              dateCreated: (d.date_created || '').slice(0, 10) || 'NASA Archive',
              center: d.center || 'NASA',
              sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id || '')}`,
              topic,
            };
          });
        if (items.length > 0) live = true;
      }
    } catch {
      // Fallback below
    }

    // Also pull recent NASA DONKI Solar Flare summary for solar/station context
    try {
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
      const donkiUrl = `https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=DEMO_KEY`;
      const donkiRes = await fetchWithTimeout(donkiUrl, 3500);
      if (donkiRes.ok) {
        const flares = (await donkiRes.json()) as Array<{
          flrID?: string;
          classType?: string;
          beginTime?: string;
          sourceLocation?: string;
        }>;
        if (Array.isArray(flares)) {
          solarFlares = flares.slice(-3).reverse().map((f) => ({
            id: f.flrID || 'FLR',
            classType: f.classType || 'M-Class',
            beginTime: f.beginTime || '',
            sourceLocation: f.sourceLocation || 'Solar Disk',
          }));
        }
      }
    } catch {
      solarFlares = [
        {
          id: 'NASA-SDO-REF',
          classType: 'M1.4 (Reference)',
          beginTime: 'Verified Baseline',
          sourceLocation: 'Active Solar Region',
        },
      ];
    }

    if (items.length === 0) {
      items = VERIFIED_NASA_FALLBACK[topic] || VERIFIED_NASA_FALLBACK.station;
    }

    nasaCache.set(topic, {
      expiresAt: now + 15 * 60 * 1000,
      items,
      solarFlares,
    });

    res.json({
      source: live ? 'Official NASA Images & DONKI API' : 'Verified NASA Educational Archive (Offline Fallback)',
      live,
      items,
      solarFlares,
    });
  });

  // 2. AI Mission Assistant (ARIA) powered by Gemini 4 Hydrogen with resilient fallback
  app.post('/api/ai/assistant', async (req, res) => {
    const {
      question = '',
      worldId = 'station',
      missionTitle = 'Open-World Space Exploration',
      missionProblem = '',
      collectedEvidence = [],
      hintTier = 1,
      wrongAttemptReason = '',
    } = req.body || {};

    if (!ai) {
      return res.json({
        mode: 'fallback',
        reply: buildLocalAssistantReply({
          question,
          worldId,
          missionTitle,
          missionProblem,
          collectedEvidence,
          hintTier,
          wrongAttemptReason,
        }),
        sourceNote: 'Verified NASA Science Curriculum (Local ARIA Engine)',
      });
    }

    try {
      const prompt = `
You are ARIA, the friendly AI Mission Assistant inside the "Junior Astronaut Academy" 3D space game for kids aged 8 to 15.

Current Context:
- 3D Location: ${worldId}
- Active Investigation: ${missionTitle}
- Problem Statement: ${missionProblem || 'Free exploration across the 3D environment'}
- Collected Scientific Evidence: ${Array.isArray(collectedEvidence) && collectedEvidence.length > 0 ? collectedEvidence.join(' | ') : 'None collected yet'}
- Requested Hint Level: ${hintTier} (1 = gentle clue, 2 = interpret evidence, 3 = clear concept walkthrough without sounding robotic)
- Wrong Attempt to Explain (if any): ${wrongAttemptReason || 'None'}
- Player Question: ${question || 'Can you help me with my current mission?'}

Rules:
1. Use simple, encouraging English suitable for ages 8–15. Keep your answer focused (3–5 short sentences).
2. Never invent scientific facts. Ground explanations in real NASA science (e.g., gravity, Mars dust/iron oxide, lunar South Pole ice, ISS solar arrays/coolant, solar flares/CMEs).
3. Clearly note what is part of the fictional training mission vs. real NASA science when relevant.
4. End with one short encouraging next step in the 3D world.
`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        8500
      );

      const reply = (response.text || '').trim();
      if (!reply) throw new Error('Empty Gemini response');

      return res.json({
        mode: 'gemini',
        reply,
        sourceNote: 'ARIA AI Assistant · Grounded in NASA Science',
      });
    } catch {
      return res.json({
        mode: 'fallback',
        reply: buildLocalAssistantReply({
          question,
          worldId,
          missionTitle,
          missionProblem,
          collectedEvidence,
          hintTier,
          wrongAttemptReason,
        }),
        sourceNote: 'Verified NASA Science Curriculum (Offline Backup)',
      });
    }
  });

  // 3. Adaptive AI Difficulty & Follow-Up Challenge Generator
  app.post('/api/ai/adaptive', async (req, res) => {
    const {
      missionId = '',
      missionTitle = '',
      wasCorrect = true,
      attemptsUsed = 1,
      hintsUsed = 0,
      currentTier = 'cadet',
      accuracyAvg = 80,
      chosenReasoning = '',
    } = req.body || {};

    const nextTier = computeAdaptiveTier(currentTier, wasCorrect, attemptsUsed, hintsUsed, accuracyAvg);

    if (!ai) {
      return res.json({
        mode: 'fallback',
        nextTier,
        ...buildLocalAdaptiveFollowUp(missionId, nextTier, wasCorrect, chosenReasoning),
      });
    }

    try {
      const prompt = `
You are the Adaptive AI Director of Junior Astronaut Academy (ages 8–15).
The player just completed a decision in "${missionTitle}" (missionId: ${missionId}).
- Decision Correct: ${wasCorrect}
- Attempts Used: ${attemptsUsed}
- Hints Used: ${hintsUsed}
- Assigned Next Difficulty Tier: ${nextTier} (cadet = foundational, specialist = analytical, commander = multi-factor NASA reasoning)
- Player's Chosen Answer: "${chosenReasoning}"

Return JSON with:
1. "evaluationFeedback": 2 short, encouraging sentences praising good scientific thinking or explaining what to watch next time.
2. "followUpQuestion": One realistic follow-up scientific challenge matched to the "${nextTier}" tier and connected to real NASA exploration.
3. "options": Exactly 3 concise answer choices.
4. "correctIndex": Integer 0, 1, or 2.
5. "explanation": Simple 2-sentence explanation citing real NASA science.
6. "nasaFactRef": Short verified NASA fact (1 sentence).
`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                evaluationFeedback: { type: Type.STRING },
                followUpQuestion: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                nasaFactRef: { type: Type.STRING },
              },
            },
          },
        }),
        8500
      );

      const parsed = JSON.parse((response.text || '{}').trim());
      if (
        !parsed.followUpQuestion ||
        !Array.isArray(parsed.options) ||
        parsed.options.length < 3 ||
        typeof parsed.correctIndex !== 'number'
      ) {
        throw new Error('Malformed JSON schema');
      }

      return res.json({
        mode: 'gemini',
        nextTier,
        evaluationFeedback: parsed.evaluationFeedback,
        followUpQuestion: parsed.followUpQuestion,
        options: parsed.options.slice(0, 3),
        correctIndex: Math.max(0, Math.min(2, parsed.correctIndex)),
        explanation: parsed.explanation,
        nasaFactRef: parsed.nasaFactRef,
      });
    } catch {
      return res.json({
        mode: 'fallback',
        nextTier,
        ...buildLocalAdaptiveFollowUp(missionId, nextTier, wasCorrect, chosenReasoning),
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Junior Astronaut Academy server listening on port ${PORT}`);
  });
}

function computeAdaptiveTier(
  currentTier: string,
  wasCorrect: boolean,
  attemptsUsed: number,
  hintsUsed: number,
  accuracyAvg: number
): 'cadet' | 'specialist' | 'commander' {
  if (wasCorrect && attemptsUsed === 1 && hintsUsed === 0 && accuracyAvg >= 78) {
    if (currentTier === 'cadet') return 'specialist';
    return 'commander';
  }
  if (!wasCorrect || attemptsUsed >= 3 || hintsUsed >= 2) {
    if (currentTier === 'commander') return 'specialist';
    return 'cadet';
  }
  return (currentTier === 'specialist' || currentTier === 'commander' ? currentTier : 'cadet') as
    | 'cadet'
    | 'specialist'
    | 'commander';
}

function buildLocalAssistantReply(params: {
  question: string;
  worldId: string;
  missionTitle: string;
  missionProblem: string;
  collectedEvidence: string[];
  hintTier: number;
  wrongAttemptReason: string;
}): string {
  const q = params.question.toLowerCase();
  if (params.wrongAttemptReason) {
    return `Good try! Notice what your sensors showed: ${params.wrongAttemptReason}. Look closely at the measurements you collected (${params.collectedEvidence.length} logs) and match the fix to the exact cause rather than guessing.`;
  }
  if (q.includes('gravity') || q.includes('jump') || q.includes('weight')) {
    return `In real NASA data, Earth gravity is 9.81 m/s², Mars is 3.72 m/s² (about 38%), and the Moon is only 1.62 m/s² (about 1/6th). That is why your astronaut jumps much higher on the Moon than on Mars! Walk around and test Spacebar in each 3D world to feel the difference.`;
  }
  if (q.includes('solar') || q.includes('storm') || q.includes('radiation')) {
    return `A solar storm happens when the Sun releases high-energy particles in a Coronal Mass Ejection (CME). On the real International Space Station, crews move to thicker shielded modules and protect sensitive electronics until the particle spike passes.`;
  }
  if (q.includes('mars') || q.includes('dust') || q.includes('ice')) {
    return `Mars is red because its dust is rich in iron oxide (rust), and its thin atmosphere is 95% carbon dioxide. NASA rovers like Perseverance look for ancient lakebed minerals and subsurface water ice to learn if Mars once supported life.`;
  }
  if (q.includes('moon') || q.includes('lunar') || q.includes('crater')) {
    return `At the Moon's South Pole, deep craters never receive direct sunlight, keeping temperatures below -160 °C and trapping ancient water ice. Walk toward the glowing beacons in the 3D world to scan temperature and hydrogen readings!`;
  }

  if (params.hintTier >= 3) {
    return `Mission Breakdown for ${params.missionTitle}: You have collected ${params.collectedEvidence.length} sensor readings. Compare every reading to normal safe limits—pick the action that directly solves the root physical cause shown in your data logs.`;
  }
  if (params.hintTier === 2) {
    return `Data Clue: Check the numbers in your ${params.collectedEvidence.length} collected evidence logs. Which instrument changed at the exact moment the problem started? Use that clue to rule out unsafe options.`;
  }
  return `ARIA Tip: Explore the ${params.worldId} area using WASD and watch for glowing cyan sensor beacons. Press [E] near equipment to collect scientific measurements before opening the Analysis Console!`;
}

function buildLocalAdaptiveFollowUp(
  missionId: string,
  nextTier: 'cadet' | 'specialist' | 'commander',
  wasCorrect: boolean,
  chosenReasoning: string
) {
  const feedback = wasCorrect
    ? `Sharp scientific reasoning! Adjusting your next challenge to ${nextTier.toUpperCase()} level based on your clean analysis.`
    : `You worked through "${chosenReasoning}" and discovered what the telemetry really meant. Let's reinforce that concept with a ${nextTier.toUpperCase()}-tier check!`;

  const banks: Record<
    string,
    {
      followUpQuestion: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      nasaFactRef: string;
    }
  > = {
    'station-coolant': {
      followUpQuestion:
        nextTier === 'commander'
          ? 'Why does the real International Space Station use ammonia coolant loops connected to radiator panels outside the hull?'
          : 'In the vacuum of space, why cannot a space station cool down simply by opening a window to cool air?',
      options: [
        'Space is a vacuum with no air to carry heat away, so radiators must emit heat as infrared light',
        'Opening a window would let cosmic wind freeze the batteries instantly',
        'Space stations generate zero heat inside',
      ],
      correctIndex: 0,
      explanation:
        'Without air molecules for convection, spacecraft only lose excess heat through thermal radiation from outward-facing radiator panels.',
      nasaFactRef: 'NASA’s ISS uses Dual External Thermal Control ammonia loops and giant white radiator wings.',
    },
    'satellite-drift': {
      followUpQuestion:
        'When a deep-space probe rotates slightly off course, how does NASA verify its exact pointing angle in space?',
      options: [
        'By using a Star Tracker camera that matches star patterns against an onboard sky map',
        'By listening for echoes bouncing off nearby asteroids',
        'By dropping a compass needle toward the Moon',
      ],
      correctIndex: 0,
      explanation:
        'Star trackers photograph surrounding stars and match them to a celestial catalog to measure spacecraft orientation within fractions of a degree.',
      nasaFactRef: 'NASA spacecraft including Voyager, Webb, and ISS rely on star trackers for attitude control.',
    },
    'solar-storm': {
      followUpQuestion:
        'Which NASA space mission monitors coronal mass ejections (CMEs) and solar flares so astronauts get early storm warnings?',
      options: [
        'Solar Dynamics Observatory (SDO) and SOHO spacecraft',
        'The Mars Perseverance wheel microphone',
        'The Hubble underwater buoyancy pool',
      ],
      correctIndex: 0,
      explanation:
        'NASA’s Solar Dynamics Observatory watches the Sun continuously in ultraviolet light to detect eruptions before energetic particles reach Earth.',
      nasaFactRef: 'Real CME particles take 1 to 3 days to reach Earth, giving Mission Control warning time.',
    },
    'mars-lakebed': {
      followUpQuestion:
        'Why do NASA scientists send rovers like Perseverance specifically to ancient river deltas such as Jezero Crater?',
      options: [
        'Flowing water concentrates clay minerals and can preserve microscopic signs of ancient environments',
        'River deltas on Mars still have deep liquid oceans today',
        'The rocks there are softer so rovers never need batteries',
      ],
      correctIndex: 0,
      explanation:
        'Clay and carbonate minerals formed in ancient liquid water preserve chemical clues about Mars’s wetter past.',
      nasaFactRef: 'NASA’s Perseverance landed in Jezero Crater in February 2021 to core-sample ancient delta rocks.',
    },
    'lunar-ice': {
      followUpQuestion:
        'Why can water ice survive inside deep craters at the Moon’s South Pole even though sunlit lunar ground reaches +120 °C?',
      options: [
        'The Moon’s tiny 1.5° axial tilt keeps deep crater floors in permanent shadow below -160 °C',
        'Astronauts buried giant refrigerators there in 1969',
        'The Moon is covered by thick rain clouds at the poles',
      ],
      correctIndex: 0,
      explanation:
        'Because the Moon barely tilts on its axis, sunlight skims across the poles and never reaches the bottoms of deep polar craters.',
      nasaFactRef: 'NASA’s Lunar Reconnaissance Orbiter confirmed water ice deposits in permanently shadowed South Pole craters.',
    },
  };

  const entry = banks[missionId] || banks['station-coolant'];
  return {
    evaluationFeedback: feedback,
    ...entry,
  };
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
