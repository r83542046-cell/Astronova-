import { AstronautAvatar } from '../types/game';
import avatarNova from '../assets/images/avatar_nova_1794674550049.jpg';
import avatarOrion from '../assets/images/avatar_orion_1794674552870.jpg';
import avatarVega from '../assets/images/avatar_vega_1794674550932.jpg';
import avatarAtlas from '../assets/images/avatar_atlas_1794674553630.jpg';

export const ASTRONAUT_AVATARS: AstronautAvatar[] = [
  {
    id: 'nova',
    name: 'Cadet Nova',
    specialty: 'Flight Navigation',
    accentColor: '#22D3EE',
    imageUrl: avatarNova,
  },
  {
    id: 'orion',
    name: 'Cadet Orion',
    specialty: 'Orbital Systems',
    accentColor: '#F59E0B',
    imageUrl: avatarOrion,
  },
  {
    id: 'vega',
    name: 'Cadet Vega',
    specialty: 'Space Science',
    accentColor: '#8B5CF6',
    imageUrl: avatarVega,
  },
  {
    id: 'atlas',
    name: 'Cadet Atlas',
    specialty: 'Robotics Control',
    accentColor: '#3B82F6',
    imageUrl: avatarAtlas,
  },
];

export interface PlanetaryBody {
  id: 'earth' | 'moon' | 'mars';
  name: string;
  gravityMs2: number;
  relativeGravity: number; // Earth = 1.0
  diameterKm: number;
  dayLengthHours: number;
  avgTempC: string;
  atmosphere: string;
  distanceFromSunMillionKm: number;
  color: string;
  funFact: string;
  sourceLabel: string;
  sourceUrl: string;
}

// Verified data from NASA Planetary Fact Sheet & NASA Solar System Exploration
export const PLANETARY_BODIES: PlanetaryBody[] = [
  {
    id: 'earth',
    name: 'Earth',
    gravityMs2: 9.81,
    relativeGravity: 1.0,
    diameterKm: 12742,
    dayLengthHours: 23.9,
    avgTempC: '15 °C',
    atmosphere: '78% Nitrogen, 21% Oxygen',
    distanceFromSunMillionKm: 149.6,
    color: '#3B82F6',
    funFact: 'Earth is the only known world with liquid surface water and a breathable oxygen-rich atmosphere.',
    sourceLabel: 'NASA Science · Earth Facts',
    sourceUrl: 'https://science.nasa.gov/earth/facts/',
  },
  {
    id: 'moon',
    name: 'The Moon',
    gravityMs2: 1.62,
    relativeGravity: 0.165,
    diameterKm: 3474,
    dayLengthHours: 708.7,
    avgTempC: '-20 °C (range -130 to 120 °C)',
    atmosphere: 'Extremely thin exosphere (no breathable air)',
    distanceFromSunMillionKm: 149.6,
    color: '#CBD5E1',
    funFact: 'Because Moon gravity is only about one-sixth of Earth gravity, an astronaut can jump much higher in a spacesuit!',
    sourceLabel: 'NASA Science · Moon Facts',
    sourceUrl: 'https://science.nasa.gov/moon/facts/',
  },
  {
    id: 'mars',
    name: 'Mars',
    gravityMs2: 3.72,
    relativeGravity: 0.379,
    diameterKm: 6779,
    dayLengthHours: 24.6,
    avgTempC: '-65 °C',
    atmosphere: '95% Carbon Dioxide (very thin)',
    distanceFromSunMillionKm: 227.9,
    color: '#F97316',
    funFact: 'A day on Mars (called a "sol") is 24 hours and 37 minutes—almost the same length as a day on Earth!',
    sourceLabel: 'NASA Science · Mars Facts',
    sourceUrl: 'https://science.nasa.gov/mars/facts/',
  },
];

export interface ScienceLesson {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  nasaFact: string;
  sourceName: string;
  sourceUrl: string;
  interactiveType: 'gravity' | 'worlds' | 'environment' | 'station' | 'astronauts' | 'robotics';
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export const SCIENCE_LESSONS: ScienceLesson[] = [
  {
    id: 'gravity',
    title: 'Gravity & Weight in Space',
    summary:
      'Gravity is the invisible pull that keeps planets orbiting the Sun and keeps our feet on the ground. Your mass never changes, but your weight changes depending on how strong a world’s gravity is!',
    keyPoints: [
      'Earth gravity pulls at 9.81 m/s².',
      'The Moon has about 1/6th of Earth’s gravity (1.62 m/s²).',
      'Mars has about 38% of Earth’s gravity (3.72 m/s²).',
      'Astronauts on the Space Station feel weightless because they are in continuous free-fall around Earth.',
    ],
    nasaFact: 'If you weigh 40 kg on Earth, the scale would read about 6.6 kg on the Moon and 15.2 kg on Mars!',
    sourceName: 'NASA Solar System Exploration',
    sourceUrl: 'https://science.nasa.gov/solar-system/',
    interactiveType: 'gravity',
    quiz: [
      {
        question: 'If an astronaut travels from Earth to the Moon, what changes?',
        options: [
          'Their weight becomes smaller, while their mass stays the same',
          'Both their mass and height disappear completely',
          'Their weight becomes six times heavier',
        ],
        correctIndex: 0,
        explanation: 'Mass is how much matter is inside you, so it stays the same. Weight depends on gravity, which is 6 times weaker on the Moon.',
      },
      {
        question: 'Why do astronauts float inside the International Space Station?',
        options: [
          'There is zero gravity anywhere above the clouds',
          'The station and astronauts are falling around Earth together in orbit',
          'Magnetic boots push them off the floor',
        ],
        correctIndex: 1,
        explanation: 'Earth still has about 90% of its gravity at ISS altitude! Astronauts float because their spacecraft orbits at ~28,000 km/h in continuous free-fall.',
      },
    ],
  },
  {
    id: 'worlds',
    title: 'Earth, Moon & Mars',
    summary:
      'Comparing our home planet Earth with the Moon and Mars helps NASA engineers design rockets, spacesuits, and future habitats.',
    keyPoints: [
      'Earth has liquid oceans and an oxygen-rich atmosphere that protects life.',
      'The Moon has no weather or wind because it has almost no atmosphere.',
      'Mars has red iron-oxide dust, polar ice caps, and a thin carbon dioxide atmosphere.',
    ],
    nasaFact: 'Olympus Mons on Mars is the tallest volcano in the solar system—nearly three times taller than Mount Everest!',
    sourceName: 'NASA Mars & Moon Exploration',
    sourceUrl: 'https://science.nasa.gov/mars/',
    interactiveType: 'worlds',
    quiz: [
      {
        question: 'Which world has a day length closest to Earth’s 24-hour day?',
        options: ['The Moon (about 29 Earth days)', 'Mars (24 hours, 37 minutes)', 'Mercury (58 Earth days)'],
        correctIndex: 1,
        explanation: 'A Martian day (a sol) is 24.6 hours—only 37 minutes longer than an Earth day!',
      },
      {
        question: 'Why are astronaut footprints on the Moon still there decades later?',
        options: [
          'Astronauts glued them to the ground',
          'The Moon has no wind or rain to erase them',
          'Moon rocks are made of wet cement',
        ],
        correctIndex: 1,
        explanation: 'With virtually no atmosphere, there is no wind or liquid water erosion on the Moon.',
      },
    ],
  },
  {
    id: 'environment',
    title: 'Space Environments',
    summary:
      'Outer space is a near-vacuum with no breathable air, extreme temperatures, and invisible solar radiation. Spacesuits act like personal spacecraft!',
    keyPoints: [
      'Sound cannot travel in empty space because there are no air molecules to carry sound waves.',
      'Temperatures in orbit swing from +120 °C in direct sunlight to -150 °C in Earth’s shadow.',
      'Spacesuits supply oxygen, water cooling, pressure, and radio communication.',
    ],
    nasaFact: 'A NASA Extravehicular Mobility Unit (spacesuit) has over 14 layers of protective fabric to guard against micrometeoroids and heat!',
    sourceName: 'NASA Science · Space Environments',
    sourceUrl: 'https://science.nasa.gov/',
    interactiveType: 'environment',
    quiz: [
      {
        question: 'How do astronauts talk to each other during a spacewalk outside the station?',
        options: [
          'They shout very loudly through their visors',
          'They use radio waves built into their helmet headsets',
          'They tap Morse code on every solar panel',
        ],
        correctIndex: 1,
        explanation: 'Sound waves need air to travel, but radio waves travel easily through the vacuum of space!',
      },
    ],
  },
  {
    id: 'station',
    title: 'The International Space Station',
    summary:
      'The International Space Station (ISS) is a giant science laboratory orbiting about 408 km above Earth where astronauts live and run experiments.',
    keyPoints: [
      'Orbits Earth at roughly 28,000 km/h (17,500 mph).',
      'Completes one full trip around Earth every 90 minutes—seeing 16 sunrises and sunsets each day!',
      'Solar arrays capture sunlight to power computers, life support, and science racks.',
    ],
    nasaFact: 'Astronauts exercise about 2 hours every day on the ISS using special resistance machines to keep their bones and muscles strong in microgravity.',
    sourceName: 'NASA International Space Station',
    sourceUrl: 'https://www.nasa.gov/international-space-station/',
    interactiveType: 'station',
    quiz: [
      {
        question: 'About how many sunrises does an astronaut see every 24 hours on the Space Station?',
        options: ['1 sunrise', '16 sunrises', '60 sunrises'],
        correctIndex: 1,
        explanation: 'Because the ISS orbits Earth every ~90 minutes, crews witness about 16 sunrises and sunsets every day!',
      },
    ],
  },
  {
    id: 'astronauts',
    title: 'Astronauts & Their Responsibilities',
    summary:
      'Every space mission relies on teamwork. Each crew member has trained for years in science, piloting, robotics, and emergency safety.',
    keyPoints: [
      'Commander: Leads the crew and oversees vehicle safety and major flight maneuvers.',
      'Flight Engineer: Monitors power, life support, air quality, and propulsion systems.',
      'Robotics & Payload Specialist: Operates robotic arms and runs biology, physics, and Earth-observation experiments.',
    ],
    nasaFact: 'Astronauts train underwater in NASA’s Neutral Buoyancy Laboratory (a huge 6.2-million-gallon pool) to practice spacewalks safely!',
    sourceName: 'NASA Astronauts',
    sourceUrl: 'https://www.nasa.gov/humans-in-space/astronauts/',
    interactiveType: 'astronauts',
    quiz: [
      {
        question: 'Why do NASA astronauts practice spacewalks inside a giant swimming pool?',
        options: [
          'To learn how to swim on Mars',
          'Floating underwater helps mimic weightlessness while practicing tool repairs',
          'To wash the outside of their helmets',
        ],
        correctIndex: 1,
        explanation: 'Neutral buoyancy in water lets astronauts practice moving large equipment and tools as if they were floating in orbit.',
      },
    ],
  },
  {
    id: 'robotics',
    title: 'Spacecraft & Robotic Technology',
    summary:
      'Robotic arms and rovers act as astronauts’ helpers in places too dangerous, heavy, or far away for humans to reach easily.',
    keyPoints: [
      'Canadarm2 is a 17-meter robotic arm on the ISS that catches visiting cargo spacecraft and moves heavy modules.',
      'Planetary rovers like Curiosity and Perseverance use robotic arms with drills and cameras to study Mars rocks.',
      'Robotic arms use shoulder, elbow, and wrist joints just like a human arm!',
    ],
    nasaFact: 'Canadarm2 can move cargo weighing over 100,000 kilograms in orbit with millimeter precision!',
    sourceName: 'NASA Robotics & Rovers',
    sourceUrl: 'https://science.nasa.gov/mars/rovers/',
    interactiveType: 'robotics',
    quiz: [
      {
        question: 'What does the Canadarm2 robotic arm do aboard the International Space Station?',
        options: [
          'Cooks meals for the crew',
          'Catches cargo spacecraft, moves heavy parts, and assists spacewalking astronauts',
          'Drives on the Moon',
        ],
        correctIndex: 1,
        explanation: 'Canadarm2 is the station’s 17-meter robotic workhorse used for grappling visiting vehicles and relocating equipment.',
      },
    ],
  },
];

export interface EmergencyScenario {
  id: string;
  title: string;
  system: string;
  severity: 'Caution' | 'Warning';
  briefing: string;
  telemetry: { label: string; value: string; status: 'normal' | 'alert' }[];
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const EMERGENCY_SCENARIOS: EmergencyScenario[] = [
  {
    id: 'comms-drift',
    title: 'Earth Radio Signal Lost',
    system: 'Communications Array',
    severity: 'Warning',
    briefing:
      'Your spacecraft’s live voice link with Mission Control suddenly turns to static. Looking at the telemetry panel, the High-Gain Antenna angle is pointed 38 degrees off target because your ship rotated earlier.',
    telemetry: [
      { label: 'Signal Strength', value: '4 %', status: 'alert' },
      { label: 'Antenna Offset', value: '38.0° OFF', status: 'alert' },
      { label: 'Cabin Air & Power', value: '100 % NOMINAL', status: 'normal' },
    ],
    options: [
      {
        id: 'repoint',
        label: 'Use the star tracker data to re-aim the High-Gain Antenna toward Earth',
        isCorrect: true,
        explanation:
          'Great thinking! Space antennas must point accurately toward Earth or a relay satellite. Re-aligning the dish restores clear radio communication immediately.',
      },
      {
        id: 'turn-off-lights',
        label: 'Turn off all cabin lights and wait silently for 2 hours',
        isCorrect: false,
        explanation:
          'Turning off cabin lights saves tiny amounts of power, but it does not fix an antenna pointing 38 degrees away from Earth.',
      },
      {
        id: 'boost-engine',
        label: 'Fire the main rocket engine at full speed without checking direction',
        isCorrect: false,
        explanation:
          'Firing the main engine blindly wastes fuel and changes your orbit dangerously. Always check why a signal dropped first!',
      },
    ],
  },
  {
    id: 'debris-path',
    title: 'Orbital Debris Crossing Ahead',
    system: 'Orbital Radar',
    severity: 'Warning',
    briefing:
      'Ground radar warns that a small piece of old satellite debris will cross within 400 meters of your spacecraft’s flight path in 12 minutes. Your thrusters have plenty of fuel.',
    telemetry: [
      { label: 'Closest Approach', value: '0.4 km (Unsafe)', status: 'alert' },
      { label: 'Time to Crossing', value: '12 min 00 s', status: 'alert' },
      { label: 'Thruster Fuel', value: '88 % READY', status: 'normal' },
    ],
    options: [
      {
        id: 'ignore',
        label: 'Stay on the exact same path and hope the debris misses',
        isCorrect: false,
        explanation:
          'Even tiny debris travels at over 28,000 km/h in orbit! NASA never gambles with close approaches—crews always perform a safe avoidance maneuver when needed.',
      },
      {
        id: 'avoidance-burn',
        label: 'Perform a short, calculated thruster burn to shift safely to a higher orbit lane',
        isCorrect: true,
        explanation:
          'Spot on! Real spacecraft and the ISS perform small "Debris Avoidance Maneuvers" using short thruster burns well ahead of time to keep a safe distance.',
      },
      {
        id: 'open-hatch',
        label: 'Suit up and try to catch the flying debris by hand',
        isCorrect: false,
        explanation:
          'Space debris moves faster than a bullet (around 8 km per second). Trying to catch it would be impossible and unsafe!',
      },
    ],
  },
  {
    id: 'solar-power',
    title: 'Solar Array Power Drop',
    system: 'Electrical Power',
    severity: 'Caution',
    briefing:
      'One solar wing’s rotation motor paused while in Earth’s shadow, so your station is only making 55% of its normal electricity. Battery reserves are slowly draining.',
    telemetry: [
      { label: 'Solar Generation', value: '55 % LOW', status: 'alert' },
      { label: 'Battery Reserve', value: '62 % DRAINING', status: 'alert' },
      { label: 'Life Support Draw', value: '35 % ESSENTIAL', status: 'normal' },
    ],
    options: [
      {
        id: 'power-save',
        label: 'Switch non-essential experiments to standby and switch the solar wing to its backup motor',
        isCorrect: true,
        explanation:
          'Excellent engineering! Reducing non-essential power protects vital life support while the backup motor rotates the solar panels back toward sunlight.',
      },
      {
        id: 'shut-life-support',
        label: 'Turn off the oxygen and air circulation fans first',
        isCorrect: false,
        explanation:
          'Life support is the top priority! Never shut down vital air systems when non-essential science heaters or screens can be paused instead.',
      },
      {
        id: 'unplug-batteries',
        label: 'Disconnect all station batteries completely',
        isCorrect: false,
        explanation:
          'Disconnecting batteries would leave the station dark every time it passes into Earth’s night side!',
      },
    ],
  },
  {
    id: 'co2-scrubber',
    title: 'Carbon Dioxide Level Rising',
    system: 'Life Support (ECLSS)',
    severity: 'Warning',
    briefing:
      'When astronauts breathe out, they release carbon dioxide (CO₂). A sensor shows CO₂ levels slowly climbing in the Lab Module because Air Scrubber Filter #1 is clogged.',
    telemetry: [
      { label: 'Cabin CO₂ Level', value: 'HIGH · +0.6 %', status: 'alert' },
      { label: 'Scrubber Filter #1', value: 'SATURATED', status: 'alert' },
      { label: 'Spare Canisters', value: '4 AVAILABLE', status: 'normal' },
    ],
    options: [
      {
        id: 'silence-alarm',
        label: 'Mute the warning chime so the crew can keep working quietly',
        isCorrect: false,
        explanation:
          'Muting an alarm does not remove carbon dioxide from the cabin air! Astronauts always find and fix the root cause.',
      },
      {
        id: 'open-window',
        label: 'Open an outside hatch to let fresh air blow in from space',
        isCorrect: false,
        explanation:
          'Outer space is a vacuum with no air! Opening a hatch without spacesuits would let all the cabin air escape.',
      },
      {
        id: 'swap-canister',
        label: 'Replace the clogged scrubber filter with a fresh spare canister and check airflow',
        isCorrect: true,
        explanation:
          'Correct! Space stations use replaceable chemical scrubbers (like lithium hydroxide or zeolite beds) to pull CO₂ out of the air and keep astronauts healthy.',
      },
    ],
  },
  {
    id: 'thruster-valve',
    title: 'Docking Thruster Pressure Alert',
    system: 'Reaction Control',
    severity: 'Caution',
    briefing:
      'As you approach the Space Station for docking, Thruster Valve B shows an unusual pressure spike. Fortunately, spacecraft are built with redundant (backup) systems.',
    telemetry: [
      { label: 'Thruster Manifold A', value: '100 % NOMINAL', status: 'normal' },
      { label: 'Thruster Valve B', value: 'PRESSURE SPIKE', status: 'alert' },
      { label: 'Distance to Station', value: '180 m HOLD', status: 'normal' },
    ],
    options: [
      {
        id: 'switch-manifold',
        label: 'Pause approach at 180 m, isolate Valve B, and switch to healthy Manifold A',
        isCorrect: true,
        explanation:
          'Brilliant commander decision! NASA designs spacecraft with redundant backup loops. Pausing safely and switching to Manifold A prevents a rough docking.',
      },
      {
        id: 'speed-up',
        label: 'Dock twice as fast before Valve B gets worse',
        isCorrect: false,
        explanation:
          'Rushing a docking maneuver with a faulty thruster could bump the Space Station. Holding position to verify backup thrusters is always safer.',
      },
      {
        id: 'disable-radar',
        label: 'Turn off the distance radar to simplify the screen',
        isCorrect: false,
        explanation:
          'Turning off distance sensors leaves the pilot blind during approach and does nothing to fix the valve.',
      },
    ],
  },
];

export interface EvaluationQuestion {
  id: string;
  category: 'navigation' | 'robotics' | 'emergency' | 'science';
  categoryLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const EVALUATION_QUESTIONS: EvaluationQuestion[] = [
  {
    id: 'eval-1',
    category: 'navigation',
    categoryLabel: 'Space Navigation',
    question:
      'Your spacecraft is at grid coordinate (2, 3) and the docking port is at (6, 3). Which direction must you fly to reach it?',
    options: ['4 units right (+X)', '4 units up (+Y)', '4 units left (-X)'],
    correctIndex: 0,
    explanation: 'The Y coordinate stays at 3, while X increases from 2 to 6 (+4 units to the right).',
  },
  {
    id: 'eval-2',
    category: 'robotics',
    categoryLabel: 'Robotic Arm Control',
    question:
      'Before closing the robotic claw around a tilted solar battery module, what should an astronaut operator check first?',
    options: [
      'Rotate the wrist joint to match the module’s angle and center over the handle',
      'Swing the arm at maximum speed so it bounces into place',
      'Turn off the station cameras',
    ],
    correctIndex: 0,
    explanation: 'Aligning wrist rotation and centering over the grapple pin prevents collisions and secures a clean grab.',
  },
  {
    id: 'eval-3',
    category: 'emergency',
    categoryLabel: 'Emergency Response',
    question:
      'If a spacecraft alarm sounds for high carbon dioxide while solar panels are fine, what is the best first step?',
    options: [
      'Read the life support telemetry to locate the clogged scrubber and swap in a fresh filter',
      'Ignore the alarm until landing',
      'Shut down the radio antenna',
    ],
    correctIndex: 0,
    explanation: 'Astronauts inspect telemetry first so they fix the exact system causing the warning without harming healthy systems.',
  },
  {
    id: 'eval-4',
    category: 'science',
    categoryLabel: 'Space Science',
    question:
      'Why do astronauts need pressurized spacesuits with oxygen tanks when working outside the Space Station?',
    options: [
      'Space is a near-vacuum with no breathable oxygen and extreme temperatures',
      'Spacesuits help them fly faster than rockets',
      'Space is filled with thick clouds of rain',
    ],
    correctIndex: 0,
    explanation: 'Without air pressure and oxygen, humans cannot survive outside a spacecraft. Spacesuits provide air, pressure, thermal protection, and comms.',
  },
  {
    id: 'eval-5',
    category: 'science',
    categoryLabel: 'Planetary Gravity',
    question:
      'On which of these three worlds would a dropped rock fall the slowest because gravity is weakest?',
    options: ['Earth (9.81 m/s²)', 'Mars (3.72 m/s²)', 'The Moon (1.62 m/s²)'],
    correctIndex: 2,
    explanation: 'The Moon’s surface gravity (1.62 m/s²) is the weakest of the three, so objects fall gently in slow motion compared to Earth!',
  },
];

export interface NasaLiveTelemetryFallback {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: string;
  isLive: boolean;
  sourceName: string;
}

export const VERIFIED_ISS_FALLBACK: NasaLiveTelemetryFallback = {
  latitude: 28.5729,
  longitude: -80.649,
  altitudeKm: 408.4,
  velocityKmh: 27580,
  visibility: 'daylight',
  isLive: false,
  sourceName: 'NASA ISS Orbital Reference (Verified Baseline)',
};
