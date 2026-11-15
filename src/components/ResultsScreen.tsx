import { Award, CheckCircle2, Compass, Download, Globe2 } from 'lucide-react';
import { GameScreen, TraineeProfile } from '../types/game';
import { ASTRONAUT_AVATARS } from '../data/nasaScienceData';
import { SCIENTIFIC_INVESTIGATIONS } from '../data/openWorldMissions';
import { calculatePerformance, calculateLevelFromXp } from '../utils/storage';
import { soundEngine } from '../utils/sound';

interface ResultsScreenProps {
  profile: TraineeProfile;
  onNavigate: (screen: GameScreen) => void;
}

export function ResultsScreen({ profile, onNavigate }: ResultsScreenProps) {
  const perf = calculatePerformance(profile);
  const rank = calculateLevelFromXp(profile.openWorld?.xp || 0);
  const solvedCount = profile.openWorld?.solvedInvestigations?.length || 0;
  const avatar = ASTRONAUT_AVATARS.find((a) => a.id === profile.avatarId) || ASTRONAUT_AVATARS[0];

  const categories = [
    { label: 'Navigation', score: perf.navigationScore, color: '#22D3EE' },
    { label: 'Robotic Arm', score: perf.roboticArmScore, color: '#3B82F6' },
    { label: 'Decision-Making', score: perf.decisionMakingScore, color: '#F59E0B' },
    { label: 'Space Science', score: perf.scientificKnowledgeScore, color: '#8B5CF6' },
  ];

  // SVG 4-axis Radar Chart geometry
  const cx = 130;
  const cy = 130;
  const maxR = 86;
  const axesAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const polygonPoints = categories
    .map((c, idx) => {
      const r = (Math.max(8, c.score) / 100) * maxR;
      const x = cx + Math.cos(axesAngles[idx]) * r;
      const y = cy + Math.sin(axesAngles[idx]) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const downloadCertificatePng = () => {
    soundEngine.playSuccess();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep Obsidian Certificate Canvas
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, 1200, 800);

    // Outer & Inner Borders
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 1128, 728);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(52, 52, 1096, 696);

    // Header Title
    ctx.fillStyle = '#22D3EE';
    ctx.font = '700 22px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JUNIOR ASTRONAUT ACADEMY', 600, 130);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 48px "Chakra Petch", sans-serif';
    ctx.fillText('OFFICIAL ASTRONAUT CERTIFICATE', 600, 195);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('This certifies that', 600, 275);

    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 54px "Chakra Petch", sans-serif';
    ctx.fillText(profile.name, 600, 350);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `has achieved the rank of ${perf.rankTitle} with a total score of ${perf.totalScore}/400`,
      600,
      420
    );
    ctx.fillText(
      `and ${perf.averageAccuracy}% overall mission accuracy across Space Exploration Training.`,
      600,
      460
    );

    // 4 Score Pillars
    const cols = [240, 480, 720, 960];
    categories.forEach((cat, i) => {
      ctx.fillStyle = '#0C1222';
      ctx.fillRect(cols[i] - 95, 520, 190, 96);
      ctx.strokeStyle = cat.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(cols[i] - 95, 520, 190, 96);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(cat.label, cols[i], 555);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 30px "JetBrains Mono", monospace';
      ctx.fillText(`${cat.score}/100`, cols[i], 596);
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(`Issued ${new Date().toLocaleDateString()} · Verified NASA Science Curriculum`, 600, 700);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Astronaut-Certificate-${profile.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Top Evaluation Overview */}
      <section className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={avatar.imageUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-16 w-16 shrink-0 rounded-xl border-2 border-cyan-400 bg-slate-900 object-cover"
            />
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                Astronaut Performance Report
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {profile.name} · {perf.rankTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-300">{perf.encouragement}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 font-mono tabular-nums sm:grid-cols-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <div>
              <div className="font-sans text-xs text-slate-400">Total Score</div>
              <div className="mt-0.5 text-2xl font-bold text-cyan-300">{perf.totalScore}/400</div>
            </div>
            <div>
              <div className="font-sans text-xs text-slate-400">Accuracy</div>
              <div className="mt-0.5 text-2xl font-bold text-white">{perf.averageAccuracy}%</div>
            </div>
            <div>
              <div className="font-sans text-xs text-slate-400">3D Mysteries</div>
              <div className="mt-0.5 text-2xl font-bold text-amber-300">
                {solvedCount}/{SCIENTIFIC_INVESTIGATIONS.length}
              </div>
            </div>
            <div>
              <div className="font-sans text-xs text-slate-400">Space XP</div>
              <div className="mt-0.5 text-2xl font-bold text-emerald-400">
                Lv.{rank.level} · {profile.openWorld?.xp || 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radar Chart + Breakdown + Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SVG Radar Calibration Chart */}
        <section className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0C1222] p-6">
          <h2 className="self-start font-display text-lg font-bold text-white">
            Skill Calibration Radar
          </h2>
          <svg
            width="260"
            height="260"
            viewBox="0 0 260 260"
            aria-label="Astronaut skill radar chart"
            className="mt-2"
          >
            {[0.25, 0.5, 0.75, 1].map((scale) => {
              const pts = axesAngles
                .map((ang) => {
                  const x = cx + Math.cos(ang) * maxR * scale;
                  const y = cy + Math.sin(ang) * maxR * scale;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={scale}
                  points={pts}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })}
            {axesAngles.map((ang, i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + Math.cos(ang) * maxR}
                y2={cy + Math.sin(ang) * maxR}
                stroke="#334155"
                strokeWidth="1"
              />
            ))}
            <polygon
              points={polygonPoints}
              fill="rgba(34, 211, 238, 0.22)"
              stroke="#22D3EE"
              strokeWidth="2.5"
            />
            {categories.map((cat, idx) => {
              const labelR = maxR + 22;
              const lx = cx + Math.cos(axesAngles[idx]) * labelR;
              const ly = cy + Math.sin(axesAngles[idx]) * labelR;
              return (
                <text
                  key={cat.label}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#CBD5E1"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {cat.label}
                </text>
              );
            })}
          </svg>
        </section>

        {/* Detailed Metrics & Recommendations */}
        <section className="lg:col-span-7 flex flex-col justify-between space-y-6 rounded-2xl border border-slate-800 bg-[#0C1222] p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Performance Breakdown</h2>
            <div className="mt-4 space-y-3.5">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-200">{cat.label}</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {cat.score} / 100
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="font-display text-base font-bold text-white">
              Suggestions for Improvement
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-300">
              {perf.recommendations.map((rec) => (
                <li key={rec} className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Mission Status Hairline-Divided Matrix */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1222]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-white">Mission Completion Status</h2>
          <button
            type="button"
            onClick={() => onNavigate('WORLD_EXPLORE')}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 whitespace-nowrap"
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>
              3D Field Operations ({solvedCount}/{SCIENTIFIC_INVESTIGATIONS.length} Solved ·{' '}
              {(profile.openWorld?.difficultyTier || 'cadet').toUpperCase()} Tier)
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-800/80 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
          {[
            { name: 'Mission 1: Navigation', data: profile.missions.navigation, screen: 'MISSION_NAVIGATION' as GameScreen },
            { name: 'Mission 2: Robotic Arm', data: profile.missions.roboticArm, screen: 'MISSION_ROBOTIC_ARM' as GameScreen },
            { name: 'Mission 3: Emergency', data: profile.missions.emergency, screen: 'MISSION_EMERGENCY' as GameScreen },
            { name: 'Mission 4: Flight Exam', data: profile.missions.evaluation, screen: 'MISSION_EVALUATION' as GameScreen },
          ].map((m) => (
            <div key={m.name} className="flex flex-col justify-between bg-[#080D1A]/60 p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{m.name}</span>
                  {m.data.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="font-mono text-[11px] text-slate-500">Pending</span>
                  )}
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-cyan-300 tabular-nums">
                  {m.data.score}/100
                </div>
                <p className="mt-1 text-xs text-slate-400">{m.data.bestDetails}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(m.screen)}
                className="mt-4 self-start font-mono text-xs font-semibold text-cyan-300 hover:underline"
              >
                {m.data.completed ? 'Replay Mission' : 'Launch Mission'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Astronaut Graduation Certificate */}
      <section
        className={`rounded-2xl border p-6 text-center sm:p-8 ${
          perf.allMissionsComplete
            ? 'border-cyan-400/50 bg-gradient-to-b from-[#0E1832] to-[#080D1A]'
            : 'border-slate-800 bg-[#0C1222]'
        }`}
      >
        {perf.allMissionsComplete ? (
          <>
            <Award className="mx-auto h-10 w-10 text-amber-300" />
            <div className="mt-2 font-mono text-xs uppercase tracking-wider text-cyan-300">
              Junior Astronaut Academy · Official Graduation Award
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">
              Certificate of Space Training Completion
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
              Awarded to <strong className="text-cyan-300">{profile.name}</strong> for
              successfully completing all four astronaut training simulations and earning the rank
              of <strong className="text-white">{perf.rankTitle}</strong> ({perf.totalScore}/400).
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={downloadCertificatePng}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>Download Certificate (PNG)</span>
              </button>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-lg">
            <Award className="mx-auto h-10 w-10 text-slate-500" />
            <h2 className="mt-2 font-display text-xl font-bold text-white">
              Astronaut Certificate Locked ({perf.missionsCompletedCount}/4 Missions)
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Complete all 4 training missions to unlock and download your official Junior
              Astronaut Academy Certificate!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('DASHBOARD')}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap"
            >
              <span>Return to Training Hub</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
