import { InventoryItem, SpacecraftId, WorldId } from '../types/game';

export interface SpacecraftSpec {
  id: SpacecraftId;
  name: string;
  role: string;
  speedMultiplier: number;
  accentHex: string;
  primaryColor: number;
  accentColor: number;
  description: string;
}

export const SPACECRAFT_CATALOG: SpacecraftSpec[] = [
  {
    id: 'orion-explorer',
    name: 'Orion Explorer',
    role: 'All-Purpose Planetary Shuttle',
    speedMultiplier: 1.0,
    accentHex: '#38bdf8',
    primaryColor: 0xf8fafc,
    accentColor: 0x0284c7,
    description: 'Balanced NASA-inspired crew shuttle built for Moon landings, Mars orbit, and Earth Space Coast launches.',
  },
  {
    id: 'falcon-voyager',
    name: 'Falcon Voyager',
    role: 'High-Speed Deep-Space Scout',
    speedMultiplier: 1.25,
    accentHex: '#a78bfa',
    primaryColor: 0xe2e8f0,
    accentColor: 0x7c3aed,
    description: 'Sleek swept-wing scout craft with rapid ion thrusters tuned for cruising across Saturn’s rings and outer ice giants.',
  },
  {
    id: 'cloud-skimmer',
    name: 'Cassini Cloud-Skimmer',
    role: 'Gas Giant Atmospheric Probe Craft',
    speedMultiplier: 1.12,
    accentHex: '#fbbf24',
    primaryColor: 0xfef3c7,
    accentColor: 0xd97706,
    description: 'Gold-shielded atmospheric research vessel designed to ride turbulent winds inside Jupiter, Venus, Uranus, and Neptune.',
  },
];

export interface PlanetFacts {
  distanceFromSun: string;
  temperature: string;
  gravity: string;
  dayLength: string;
  moonsCount: string;
  surfaceType: string;
  funFacts: string[];
}

export interface WorldConfig {
  id: WorldId;
  name: string;
  subtitle: string;
  explorationMode: 'surface' | 'flight';
  unlockXp: number;
  badgeTitle: string;
  gravityMs2: number;
  jumpForce: number;
  gravityAccel: number;
  skyColorHex: number;
  fogColorHex: number;
  fogDensity: number;
  terrainPrimaryHex: string;
  terrainSecondaryHex: string;
  nasaTopic: 'station' | 'mars' | 'moon' | 'solar';
  atmosphereLabel: string;
  realScienceNote: string;
  sourceUrl: string;
  planetFacts: PlanetFacts;
}

export const WORLDS: Record<WorldId, WorldConfig> = {
  earth: {
    id: 'earth',
    name: 'Kennedy Space Center, Earth',
    subtitle: 'Home Planet & Biosphere · 1.00 AU',
    explorationMode: 'surface',
    unlockXp: 0,
    badgeTitle: 'Earth Guardian Badge',
    gravityMs2: 9.81,
    jumpForce: 5.8,
    gravityAccel: 14.8,
    skyColorHex: 0x38bdf8,
    fogColorHex: 0xbae6fd,
    fogDensity: 0.0011,
    terrainPrimaryHex: '#15803d',
    terrainSecondaryHex: '#166534',
    nasaTopic: 'station',
    atmosphereLabel: '1.01 bar N2/O2 · Breathable Skies',
    realScienceNote:
      'Earth has 9.81 m/s² gravity, oceans covering 71% of the planet, and a protective ozone + greenhouse atmosphere sustaining life.',
    sourceUrl: 'https://science.nasa.gov/earth/',
    planetFacts: {
      distanceFromSun: '150 million km (1.00 AU)',
      temperature: '15 °C average (-89 °C to 56 °C)',
      gravity: '9.81 m/s² (100% Earth baseline)',
      dayLength: '23 hours 56 minutes',
      moonsCount: '1 (The Moon)',
      surfaceType: 'Rocky continents, liquid water oceans & green biosphere',
      funFacts: [
        'Earth is the only known world with stable liquid water oceans on its surface.',
        'Our magnetic field deflects harmful solar wind particles.',
        'Green plants recycle moisture into clouds through transpiration.',
      ],
    },
  },
  moon: {
    id: 'moon',
    name: 'Shackleton Ridge, Moon',
    subtitle: 'Lunar South Pole · 384,400 km from Earth',
    explorationMode: 'surface',
    unlockXp: 0,
    badgeTitle: 'Artemis Lunar Explorer',
    gravityMs2: 1.62,
    jumpForce: 10.2,
    gravityAccel: 5.8,
    skyColorHex: 0x04060d,
    fogColorHex: 0x070a14,
    fogDensity: 0.0012,
    terrainPrimaryHex: '#64748B',
    terrainSecondaryHex: '#475569',
    nasaTopic: 'moon',
    atmosphereLabel: 'Vacuum Exosphere · 1/6th Gravity',
    realScienceNote:
      'Lunar gravity is 1.62 m/s² (1/6th of Earth). Deep South Pole craters stay permanently shadowed and trap ancient water ice.',
    sourceUrl: 'https://science.nasa.gov/moon/',
    planetFacts: {
      distanceFromSun: '150 million km (orbits Earth at 384,400 km)',
      temperature: '+120 °C in sunlight to -178 °C in polar shadows',
      gravity: '1.62 m/s² (1/6th of Earth — super high jumps!)',
      dayLength: '29.5 Earth days (solar day)',
      moonsCount: 'Earth’s natural satellite',
      surfaceType: 'Cratered gray silicate regolith & ancient lava plains',
      funFacts: [
        'Astronaut footprints on the Moon stay untouched for millions of years because there is no wind or rain.',
        'Shackleton Crater’s floor never sees sunlight and traps frozen water ice.',
        'A jump on Earth that goes 1 meter high reaches 6 meters on the Moon!',
      ],
    },
  },
  mars: {
    id: 'mars',
    name: 'Jezero Crater, Mars',
    subtitle: 'Ancient River Delta · 1.52 AU',
    explorationMode: 'surface',
    unlockXp: 0,
    badgeTitle: 'Mars Rover Geologist',
    gravityMs2: 3.72,
    jumpForce: 8.8,
    gravityAccel: 11.4,
    skyColorHex: 0x3b1f18,
    fogColorHex: 0x6b3220,
    fogDensity: 0.0032,
    terrainPrimaryHex: '#9A4426',
    terrainSecondaryHex: '#6F2F1B',
    nasaTopic: 'mars',
    atmosphereLabel: 'Thin CO2 · Iron-Oxide Dust',
    realScienceNote:
      'Mars gravity is 3.72 m/s² (38% of Earth), iron-oxide rust paints the sky butterscotch-red, and Jezero Crater once held an ancient lake.',
    sourceUrl: 'https://science.nasa.gov/mars/',
    planetFacts: {
      distanceFromSun: '228 million km (1.52 AU)',
      temperature: '-63 °C average (-140 °C to 20 °C)',
      gravity: '3.72 m/s² (38% of Earth)',
      dayLength: '24 hours 37 minutes (1 Sol)',
      moonsCount: '2 (Phobos & Deimos)',
      surfaceType: 'Red iron-oxide desert, giant volcanoes, craters & dry riverbeds',
      funFacts: [
        'Mars is home to Olympus Mons, the tallest volcano in the Solar System (3× Mount Everest).',
        'Sunsets on Mars look cool blue instead of red because fine dust scatters light differently!',
        'NASA rovers like Perseverance search Jezero Crater rocks for signs of ancient water.',
      ],
    },
  },
  station: {
    id: 'station',
    name: 'Orbital Research Station',
    subtitle: 'Low Earth Orbit · 408 km Altitude',
    explorationMode: 'surface',
    unlockXp: 0,
    badgeTitle: 'Orbital Systems Officer',
    gravityMs2: 1.8,
    jumpForce: 6.2,
    gravityAccel: 6.8,
    skyColorHex: 0x050914,
    fogColorHex: 0x050914,
    fogDensity: 0.0014,
    terrainPrimaryHex: '#1E293B',
    terrainSecondaryHex: '#334155',
    nasaTopic: 'station',
    atmosphereLabel: 'LEO Vacuum · Thermal Radiators',
    realScienceNote:
      'The real ISS orbits Earth every 90 minutes at ~28,000 km/h and uses external ammonia radiator wings to dump heat into space.',
    sourceUrl: 'https://www.nasa.gov/international-space-station/',
    planetFacts: {
      distanceFromSun: '150 million km (408 km above Earth)',
      temperature: '+121 °C sunlit side / -157 °C shadow side',
      gravity: 'Microgravity (~90% Earth gravity, astronauts float in freefall)',
      dayLength: '90-minute orbit (16 sunrises & sunsets every day!)',
      moonsCount: 'Orbits Earth with the Moon in view',
      surfaceType: 'Pressurized aluminum modules, cupola windows & solar arrays',
      funFacts: [
        'Astronauts aboard the ISS see a sunrise or sunset every 45 minutes!',
        'Spacecraft computers cool down using infrared radiator panels instead of fans.',
        'Large blue solar arrays convert sunlight into electricity for life support.',
      ],
    },
  },
  mercury: {
    id: 'mercury',
    name: 'Caloris Basin, Mercury',
    subtitle: 'Closest Planet · 0.39 AU',
    explorationMode: 'surface',
    unlockXp: 100,
    badgeTitle: 'Solar Messenger Pioneer',
    gravityMs2: 3.7,
    jumpForce: 9.0,
    gravityAccel: 11.2,
    skyColorHex: 0x020408,
    fogColorHex: 0x0a0f1d,
    fogDensity: 0.001,
    terrainPrimaryHex: '#475569',
    terrainSecondaryHex: '#334155',
    nasaTopic: 'solar',
    atmosphereLabel: 'Razor-Thin Exosphere · Harsh Sun',
    realScienceNote:
      'Mercury is the closest planet to the Sun, with giant craters, bright sunlight, pitch-black shadows, and +430 °C to -180 °C extremes.',
    sourceUrl: 'https://science.nasa.gov/mercury/',
    planetFacts: {
      distanceFromSun: '58 million km (0.39 AU)',
      temperature: '+430 °C daytime to -180 °C nighttime',
      gravity: '3.70 m/s² (38% of Earth)',
      dayLength: '59 Earth days (rotation); 1 solar day = 176 Earth days',
      moonsCount: '0 moons',
      surfaceType: 'Heavily cratered gray silicate crust & tall cliff scarps',
      funFacts: [
        'A year on Mercury takes only 88 Earth days—it races around the Sun fastest of all!',
        'From Mercury, the Sun looks about 3 times wider than it does from Earth.',
        'Even next to blazing 430 °C rocks, deep polar craters stay frozen below -180 °C.',
      ],
    },
  },
  venus: {
    id: 'venus',
    name: 'Aphrodite Terra, Venus',
    subtitle: 'Cloudy Greenhouse World · 0.72 AU',
    explorationMode: 'surface',
    unlockXp: 100,
    badgeTitle: 'Venus Shield Navigator',
    gravityMs2: 8.87,
    jumpForce: 5.4,
    gravityAccel: 13.8,
    skyColorHex: 0x4a280a,
    fogColorHex: 0x7a4012,
    fogDensity: 0.0046,
    terrainPrimaryHex: '#B45309',
    terrainSecondaryHex: '#78350F',
    nasaTopic: 'solar',
    atmosphereLabel: '92-Bar CO2 & Sulfuric Clouds',
    realScienceNote:
      'Venus has a runaway greenhouse atmosphere that traps heat at +465 °C under thick yellow sulfuric acid cloud decks.',
    sourceUrl: 'https://science.nasa.gov/venus/',
    planetFacts: {
      distanceFromSun: '108 million km (0.72 AU)',
      temperature: '+465 °C (hotter than Mercury!)',
      gravity: '8.87 m/s² (91% of Earth)',
      dayLength: '243 Earth days (spins backwards!)',
      moonsCount: '0 moons',
      surfaceType: 'Volcanic basalt plains & highlands under dense amber clouds',
      funFacts: [
        'Venus spins backwards compared to Earth, so the Sun rises in the west and sets in the east.',
        'Its thick CO2 atmosphere crushes landers with pressure like 900 meters underwater.',
        'A single day on Venus is longer than its entire 225-day year!',
      ],
    },
  },
  jupiter: {
    id: 'jupiter',
    name: 'Great Red Spot Deck, Jupiter',
    subtitle: 'Gas Giant Flight Zone · 5.20 AU',
    explorationMode: 'flight',
    unlockXp: 200,
    badgeTitle: 'Jovian Storm Pilot',
    gravityMs2: 24.79,
    jumpForce: 4.5,
    gravityAccel: 21.0,
    skyColorHex: 0x2b1c0c,
    fogColorHex: 0x5c3a1e,
    fogDensity: 0.0032,
    terrainPrimaryHex: '#D97706',
    terrainSecondaryHex: '#B45309',
    nasaTopic: 'solar',
    atmosphereLabel: 'Gas Giant Flight · 540 km/h Jets',
    realScienceNote:
      'Jupiter has NO solid ground! Spacecraft fly through swirling ammonia clouds above the giant Great Red Spot storm.',
    sourceUrl: 'https://science.nasa.gov/jupiter/',
    planetFacts: {
      distanceFromSun: '778 million km (5.20 AU)',
      temperature: '-110 °C in upper cloud tops',
      gravity: '24.79 m/s² (2.5× Earth at cloud tops)',
      dayLength: '9 hours 55 minutes (fastest spin!)',
      moonsCount: '95 known moons (including Io, Europa & Ganymede)',
      surfaceType: 'No solid ground — deep swirling hydrogen & helium gas layers',
      funFacts: [
        'Jupiter is so huge that over 1,300 Earths could fit inside it!',
        'The Great Red Spot is a raging storm bigger than the entire planet Earth.',
        'Because Jupiter has no solid land, your craft explores by flying through its cloud layers.',
      ],
    },
  },
  saturn: {
    id: 'saturn',
    name: 'Cassini Ring Plane, Saturn',
    subtitle: 'Ringed Gas Giant Flight · 9.58 AU',
    explorationMode: 'flight',
    unlockXp: 200,
    badgeTitle: 'Saturn Ring Voyager',
    gravityMs2: 10.44,
    jumpForce: 5.8,
    gravityAccel: 14.2,
    skyColorHex: 0x1f1b0a,
    fogColorHex: 0x473b18,
    fogDensity: 0.0024,
    terrainPrimaryHex: '#CA8A04',
    terrainSecondaryHex: '#A16207',
    nasaTopic: 'solar',
    atmosphereLabel: 'Ring-Plane Flight · Water-Ice Arc',
    realScienceNote:
      'Saturn is a gas giant without solid land. Pilot your spacecraft alongside its glittering water-ice rings and Cassini Division.',
    sourceUrl: 'https://science.nasa.gov/saturn/',
    planetFacts: {
      distanceFromSun: '1.4 billion km (9.58 AU)',
      temperature: '-140 °C in upper clouds',
      gravity: '10.44 m/s² (106% of Earth at cloud tops)',
      dayLength: '10 hours 33 minutes',
      moonsCount: '146+ moons (including Titan & Enceladus)',
      surfaceType: 'No solid ground — gas clouds surrounded by billions of orbiting ice rings',
      funFacts: [
        'Saturn is less dense than water — theoretically it could float in a gigantic bathtub!',
        'Its dazzling rings are made of billions of ice crystals and boulders from dust-size to house-size.',
        'Moons like Mimas carve clear gaps like the Cassini Division using gravity.',
      ],
    },
  },
  uranus: {
    id: 'uranus',
    name: 'Tilted Methane Skies, Uranus',
    subtitle: 'Ice Giant Flight Zone · 19.2 AU',
    explorationMode: 'flight',
    unlockXp: 300,
    badgeTitle: 'Uranus Polar Flyer',
    gravityMs2: 8.69,
    jumpForce: 6.5,
    gravityAccel: 12.6,
    skyColorHex: 0x041f26,
    fogColorHex: 0x0e3b46,
    fogDensity: 0.0024,
    terrainPrimaryHex: '#0891B2',
    terrainSecondaryHex: '#0e7490',
    nasaTopic: 'solar',
    atmosphereLabel: 'Ice Giant Flight · 98° Sideways Tilt',
    realScienceNote:
      'Uranus is an ice giant rolled on a 98° sideways tilt with pale-cyan methane clouds at -214 °C and faint vertical rings.',
    sourceUrl: 'https://science.nasa.gov/uranus/',
    planetFacts: {
      distanceFromSun: '2.9 billion km (19.2 AU)',
      temperature: '-214 °C (coldest planetary atmosphere!)',
      gravity: '8.69 m/s² (89% of Earth)',
      dayLength: '17 hours 14 minutes (rotates sideways)',
      moonsCount: '28 known moons (named after Shakespeare & Pope characters)',
      surfaceType: 'No solid ground — cyan methane, water & ammonia ice-giant atmosphere',
      funFacts: [
        'Uranus tilts nearly 98 degrees on its side, rolling around the Sun like a bowling ball!',
        'Methane gas absorbs red sunlight and reflects gorgeous pale-cyan color.',
        'Each pole gets 42 straight years of sunlight followed by 42 years of winter darkness.',
      ],
    },
  },
  neptune: {
    id: 'neptune',
    name: 'Supersonic Storm Deck, Neptune',
    subtitle: 'Outer Ice Giant Flight · 30.1 AU',
    explorationMode: 'flight',
    unlockXp: 300,
    badgeTitle: 'Neptune Deep-Space Ace',
    gravityMs2: 11.15,
    jumpForce: 5.6,
    gravityAccel: 15.0,
    skyColorHex: 0x040d26,
    fogColorHex: 0x0d2157,
    fogDensity: 0.0026,
    terrainPrimaryHex: '#2563EB',
    terrainSecondaryHex: '#1D4ED8',
    nasaTopic: 'solar',
    atmosphereLabel: 'Ice Giant Flight · 2,100 km/h Gales',
    realScienceNote:
      'Neptune is the farthest major planet, whipped by 2,100 km/h supersonic methane winds driven by internal planetary heat.',
    sourceUrl: 'https://science.nasa.gov/neptune/',
    planetFacts: {
      distanceFromSun: '4.5 billion km (30.1 AU)',
      temperature: '-201 °C in upper clouds',
      gravity: '11.15 m/s² (114% of Earth)',
      dayLength: '16 hours 6 minutes',
      moonsCount: '16 known moons (largest is Triton)',
      surfaceType: 'No solid ground — deep azure ice-giant storm atmosphere',
      funFacts: [
        'Neptune whips up winds faster than the speed of sound on Earth — over 2,000 km/h!',
        'One Neptune year takes 165 Earth years (it completed only one orbit since discovery in 1846!).',
        'It gives off more than twice as much heat from inside as it gets from the distant Sun.',
      ],
    },
  },
};

export interface WorldPickup {
  id: string;
  worldId: WorldId;
  x: number;
  yOffset: number; // Above ground on surface worlds, or world Y altitude on flight worlds
  z: number;
  title: string;
  reading: string;
  colorHex: number;
}

export const WORLD_PICKUPS: WorldPickup[] = [
  { id: 'pk-earth-1', worldId: 'earth', x: -16, yOffset: 1.2, z: -12, title: 'Coastal Ozone Sample', reading: 'Stratospheric O3 UV absorption confirmed healthy.', colorHex: 0x38bdf8 },
  { id: 'pk-earth-2', worldId: 'earth', x: 24, yOffset: 1.2, z: -8, title: 'Biosphere Leaf Core', reading: 'Chlorophyll photosynthesis absorbing CO2 & emitting O2.', colorHex: 0x22c55e },
  { id: 'pk-earth-3', worldId: 'earth', x: 14, yOffset: 1.2, z: 22, title: 'Aquifer Mineral Vial', reading: 'Clean limestone-filtered freshwater sample.', colorHex: 0x06b6d4 },

  { id: 'pk-moon-1', worldId: 'moon', x: 18, yOffset: 1.4, z: -18, title: 'Basalt Moon Pebble', reading: 'Dark lunar mare volcanic basalt (~3.5 billion years old).', colorHex: 0x94a3b8 },
  { id: 'pk-moon-2', worldId: 'moon', x: -22, yOffset: 1.4, z: -14, title: 'Highland Anorthosite', reading: 'Bright plagioclase mineral from early lunar crust.', colorHex: 0xe2e8f0 },
  { id: 'pk-moon-3', worldId: 'moon', x: 32, yOffset: 1.4, z: -32, title: 'Polar Frost Crystal', reading: 'Frozen trace water vapor collected near Shackleton shadow.', colorHex: 0x38bdf8 },

  { id: 'pk-mars-1', worldId: 'mars', x: -20, yOffset: 1.3, z: -20, title: 'Hematite Blueberry', reading: 'Tiny iron-rich sphere formed in ancient wet Martian rock.', colorHex: 0xf97316 },
  { id: 'pk-mars-2', worldId: 'mars', x: 26, yOffset: 1.3, z: -18, title: 'Jezero Siltstone Core', reading: 'Layered mudstone deposited at the bottom of an ancient lake.', colorHex: 0xfb923c },
  { id: 'pk-mars-3', worldId: 'mars', x: -28, yOffset: 1.3, z: 16, title: 'Martian Dust Filter', reading: 'Fine rust-colored iron oxide dust carried by global winds.', colorHex: 0xf59e0b },

  { id: 'pk-station-1', worldId: 'station', x: -20, yOffset: 1.2, z: -14, title: 'Micro-G Crystal Tube', reading: 'Protein crystal grown symmetrically in microgravity.', colorHex: 0x38bdf8 },
  { id: 'pk-station-2', worldId: 'station', x: 22, yOffset: 1.2, z: -14, title: 'Solar Cell Test Wafer', reading: 'High-efficiency space photovoltaic coupon.', colorHex: 0x60a5fa },
  { id: 'pk-station-3', worldId: 'station', x: 18, yOffset: 1.2, z: 16, title: 'Telemetry Black Box', reading: 'Logged 16 orbital day/night temperature cycles.', colorHex: 0x22d3ee },

  { id: 'pk-mercury-1', worldId: 'mercury', x: 16, yOffset: 1.3, z: -14, title: 'Graphite Crust Flake', reading: 'Dark carbon-rich crust darkened by ancient volcanism.', colorHex: 0x94a3b8 },
  { id: 'pk-mercury-2', worldId: 'mercury', x: -18, yOffset: 1.3, z: -18, title: 'Solar Wind Foil Trap', reading: 'Captured charged protons streaming straight from the Sun.', colorHex: 0xfef08a },
  { id: 'pk-mercury-3', worldId: 'mercury', x: 18, yOffset: 1.3, z: 12, title: 'Iron Core Mag-Chip', reading: 'Recorded Mercury’s weak offset dipole magnetic field.', colorHex: 0xfbbf24 },

  { id: 'pk-venus-1', worldId: 'venus', x: -16, yOffset: 1.3, z: -12, title: 'Acid-Resistant Aerosol Vial', reading: 'Captured upper-cloud sulfuric acid droplet mist.', colorHex: 0xf59e0b },
  { id: 'pk-venus-2', worldId: 'venus', x: 20, yOffset: 1.3, z: -16, title: 'Basalt Lava Crust', reading: 'Heat-baked volcanic basalt from Aphrodite highlands.', colorHex: 0xf97316 },
  { id: 'pk-venus-3', worldId: 'venus', x: -18, yOffset: 1.3, z: 14, title: 'Infrared Flux Capsule', reading: 'Measured trapped thermal radiation under 96.5% CO2.', colorHex: 0xfde047 },

  { id: 'pk-jupiter-1', worldId: 'jupiter', x: -18, yOffset: 10, z: -16, title: 'Ammonia Cloud Pod', reading: 'Collected golden-white ammonia crystal aerosols at 0.5 bar.', colorHex: 0xfcd34d },
  { id: 'pk-jupiter-2', worldId: 'jupiter', x: 22, yOffset: 14, z: -22, title: 'Red Spot Storm Sample', reading: 'Logged anticyclonic wind shear along the Great Red Spot edge.', colorHex: 0xf97316 },
  { id: 'pk-jupiter-3', worldId: 'jupiter', x: -10, yOffset: 16, z: -36, title: 'Auroral Mag-Sensor', reading: 'Recorded intense Jovian magnetic radiation bursts.', colorHex: 0x38bdf8 },

  { id: 'pk-saturn-1', worldId: 'saturn', x: 18, yOffset: 12, z: -14, title: 'Pure Ring Ice Fragment', reading: '99% crystalline water ice floating in the B-ring wake.', colorHex: 0xbae6fd },
  { id: 'pk-saturn-2', worldId: 'saturn', x: -20, yOffset: 15, z: -24, title: 'Hexagon Polar Telemetry', reading: 'Wave telemetry from Saturn’s six-sided north polar jet stream.', colorHex: 0xfde047 },
  { id: 'pk-saturn-3', worldId: 'saturn', x: 24, yOffset: 10, z: 8, title: 'Enceladus Plume Trace', reading: 'Tiny salt-rich water grains ejected by moon Enceladus geysers.', colorHex: 0x67e8f9 },

  { id: 'pk-uranus-1', worldId: 'uranus', x: -16, yOffset: 11, z: -16, title: 'Methane Ice Crystal', reading: 'Frozen cyan methane haze from -214 °C cloud layer.', colorHex: 0x67e8f9 },
  { id: 'pk-uranus-2', worldId: 'uranus', x: 20, yOffset: 14, z: -22, title: 'Tilted Ring Dust Pod', reading: 'Fine dark dust captured from Uranus’s near-vertical ring plane.', colorHex: 0x22d3ee },
  { id: 'pk-uranus-3', worldId: 'uranus', x: -12, yOffset: 16, z: 12, title: 'Superionic Water Log', reading: 'Magnetic data hinting at deep conductive ice-mantle currents.', colorHex: 0xa5f3fc },

  { id: 'pk-neptune-1', worldId: 'neptune', x: 18, yOffset: 11, z: -18, title: 'Supersonic Wind Pod', reading: 'Clocked 2,100 km/h methane jet stream shear.', colorHex: 0x60a5fa },
  { id: 'pk-neptune-2', worldId: 'neptune', x: -20, yOffset: 15, z: -24, title: 'Methane Cirrus Flake', reading: 'High-altitude white methane ice cloud hovering over blue storm.', colorHex: 0xe0f2fe },
  { id: 'pk-neptune-3', worldId: 'neptune', x: 14, yOffset: 14, z: 12, title: 'Triton Cryo-Relay', reading: 'Deep-space telemetry ping toward Neptune’s icy moon Triton.', colorHex: 0x3b82f6 },
];

export interface WorldInteractiveNode {
  id: string;
  worldId: WorldId;
  x: number;
  y?: number; // Custom flight altitude for gas/ice giant buoyant nodes
  z: number;
  kind: 'radiator' | 'satellite' | 'solar_sensor' | 'rover' | 'drill' | 'ice_crater' | 'rock_sample' | 'shuttle' | 'training_console';
  title: string;
  shortPrompt: string;
  investigationId?: string;
  scientificDataReading: string;
  rewardItem?: Omit<InventoryItem, 'collectedAt'>;
  actionType: 'investigate_node' | 'warp_hub' | 'open_training_sim';
}

export const WORLD_NODES: WorldInteractiveNode[] = [
  // === ORBITAL STATION NODES (Massive 180m Orbital Truss Complex) ===
  {
    id: 'node-station-coolant',
    worldId: 'station',
    x: -44,
    z: -32,
    kind: 'radiator',
    title: 'Thermal Radiator Manifold',
    shortPrompt: 'Scan Radiator & Coolant Loop',
    investigationId: 'station-coolant',
    scientificDataReading:
      'Coolant Loop B Flow: 42% (Low) · Sunlit Hull Temp: +118 °C · Radiator Valve B: Stuck Closed · Backup Loop A: Standby',
    rewardItem: {
      id: 'item-coolant-log',
      name: 'Thermal Radiator Sensor Log',
      worldId: 'station',
      category: 'telemetry',
      reading: 'Loop B clogged; infrared radiator wing #2 offline (+118 °C peak).',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-station-power',
    worldId: 'station',
    x: 46,
    z: -36,
    kind: 'solar_sensor',
    title: 'Solar Array Junction & Magnetometer',
    shortPrompt: 'Read Solar Storm & Array Telemetry',
    investigationId: 'solar-storm',
    scientificDataReading:
      'Proton Flux: 4,200 pfu (Elevated CME Incoming!) · Estimated Arrival: 22 min · Storm Shield Module: Ready · Solar Array Power: 96%',
    rewardItem: {
      id: 'item-cme-reading',
      name: 'Magnetometer CME Reading',
      worldId: 'station',
      category: 'telemetry',
      reading: 'High-energy solar proton spike detected 22 min before arrival.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-station-satellite',
    worldId: 'station',
    x: 52,
    z: 28,
    kind: 'satellite',
    title: 'Docked Relay Satellite',
    shortPrompt: 'Inspect Satellite Attitude & Antenna',
    investigationId: 'satellite-drift',
    scientificDataReading:
      'Earth Link: -112 dBm (Lost) · Star Tracker Yaw Offset: +24.5° · Reaction Wheel #2 Speed: Saturated · Fuel Reserve: 78%',
    rewardItem: {
      id: 'item-sat-chip',
      name: 'Satellite Star-Tracker Log',
      worldId: 'station',
      category: 'telemetry',
      reading: 'Relay antenna drifted +24.5° off Earth after reaction wheel saturation.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-station-shuttle',
    worldId: 'station',
    x: 0,
    z: 28,
    kind: 'shuttle',
    title: 'Orbital Transfer Shuttle',
    shortPrompt: 'Open Star Map & Travel to Mars / Moon',
    scientificDataReading: 'Interplanetary Transfer Engines Ready · Destination: Mars or Moon',
    actionType: 'warp_hub',
  },
  {
    id: 'node-station-sim',
    worldId: 'station',
    x: -38,
    z: 24,
    kind: 'training_console',
    title: 'Academy Flight Simulators',
    shortPrompt: 'Open 2D Flight, Robotics & Exam Hub',
    scientificDataReading: 'Flight Navigation, Robotic Arm & Cadet Certification Simulators Online',
    actionType: 'open_training_sim',
  },

  // === MARS JEZERO CRATER NODES (Vast 180m Open Canyon & Delta) ===
  {
    id: 'node-mars-rover',
    worldId: 'mars',
    x: -44,
    z: -42,
    kind: 'rover',
    title: 'Perseverance-Class Science Rover',
    shortPrompt: 'Analyze Rover Dust & Solar/RTG Data',
    investigationId: 'mars-lakebed',
    scientificDataReading:
      'Atmospheric Dust Opacity (Tau): 2.8 (Dust Storm!) · Rover Battery: 34% · Clay Mineral Signature: Smectite Detected at Delta Rim',
    rewardItem: {
      id: 'item-mars-clay',
      name: 'Jezero Clay Mineral Scan',
      worldId: 'mars',
      category: 'sample',
      reading: 'Spectrometer confirmed water-formed clay minerals in ancient river delta.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-mars-rock',
    worldId: 'mars',
    x: 52,
    z: -34,
    kind: 'rock_sample',
    title: 'Ancient Delta Outcrop',
    shortPrompt: 'Collect Martian Core Sample',
    investigationId: 'mars-lakebed',
    scientificDataReading:
      'Rock Composition: Iron Oxide + Carbonate Pebbles · Grain Shape: Smooth Rounded (indicates ancient flowing river water!)',
    rewardItem: {
      id: 'item-mars-core',
      name: 'Martian Delta Rock Core',
      worldId: 'mars',
      category: 'sample',
      reading: 'Rounded river pebbles & carbonates proving liquid water once flowed here.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-mars-storm',
    worldId: 'mars',
    x: -56,
    z: 34,
    kind: 'solar_sensor',
    title: 'Martian Radiation & Weather Mast',
    shortPrompt: 'Inspect Mars Radiation & Thin Air Data',
    investigationId: 'solar-storm',
    scientificDataReading:
      'Mars Surface Pressure: 0.006 bar (No thick magnetic field!) · UV & Solar Proton Index: HIGH · Underground Lava Tube Shelter: 18 m away',
    rewardItem: {
      id: 'item-mars-rad',
      name: 'Mars Surface Radiation Log',
      worldId: 'mars',
      category: 'telemetry',
      reading: 'Mars lacks a global magnetic field; radiation rises sharply during solar storms.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-mars-shuttle',
    worldId: 'mars',
    x: 0,
    z: 28,
    kind: 'shuttle',
    title: 'Mars Ascent Shuttle',
    shortPrompt: 'Open Star Map & Travel to Station / Moon',
    scientificDataReading: 'Ascent Vehicle Fueled · Ready for Orbital Return or Lunar Transfer',
    actionType: 'warp_hub',
  },

  // === MOON SHACKLETON RIDGE NODES (Vast 180m South Pole Crater Basin) ===
  {
    id: 'node-moon-ice',
    worldId: 'moon',
    x: 46,
    z: -48,
    kind: 'ice_crater',
    title: 'Shadowed Crater Ice Deposit',
    shortPrompt: 'Scan Shadowed Crater Hydrogen & Temp',
    investigationId: 'lunar-ice',
    scientificDataReading:
      'Crater Floor Temp: -178 °C (Permanent Shadow) · Neutron Spectrometer Hydrogen Spike: +4.8% (Water Ice Present!) · Sunlight Angle: 0°',
    rewardItem: {
      id: 'item-lunar-ice',
      name: 'Lunar Water-Ice Spectrometer Log',
      worldId: 'moon',
      category: 'sample',
      reading: 'Confirmed frozen H2O molecules trapped inside -178 °C polar shadow.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-moon-drill',
    worldId: 'moon',
    x: -46,
    z: -34,
    kind: 'drill',
    title: 'Lunar Regolith Core Drill',
    shortPrompt: 'Check Regolith Drill & Solar Power',
    investigationId: 'lunar-ice',
    scientificDataReading:
      'Sunlit Ridge Temp: +112 °C · Solar Tower Output: 98% · Drill Bit Warning: Regolith dust abrasive! Need slow pulsed cooling.',
    rewardItem: {
      id: 'item-lunar-regolith',
      name: 'Lunar Regolith Dust Sample',
      worldId: 'moon',
      category: 'sample',
      reading: 'Sharp microscopic silicate dust formed by billions of micrometeorite impacts.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-moon-shuttle',
    worldId: 'moon',
    x: 0,
    z: 28,
    kind: 'shuttle',
    title: 'Artemis Lunar Lander',
    shortPrompt: 'Open Star Map & Travel to Station / Mars',
    scientificDataReading: 'Lunar Liftoff Thrusters Nominal · Ready to Travel',
    actionType: 'warp_hub',
  },

  // === EARTH BIOSPHERE & SPACE COAST (Vast 840m Grassy Rolling Hills & River Valley) ===
  {
    id: 'node-earth-lidar',
    worldId: 'earth',
    x: -38,
    z: -26,
    kind: 'satellite',
    title: 'NASA Atmospheric LiDAR & Weather Station',
    shortPrompt: 'Inspect Atmospheric Aerosol & Cloud Telemetry',
    investigationId: 'earth-atmosphere',
    scientificDataReading:
      'Atmospheric Pressure: 1.013 bar (1 atm) · N2: 78.08%, O2: 20.95%, Ar: 0.93%, CO2: 421 ppm · Tropospheric Cloud Deck: Stratus at 1,800 m · Solar Irradiance: 1,361 W/m²',
    rewardItem: {
      id: 'item-earth-lidar',
      name: 'NASA Atmospheric LiDAR Sounding',
      worldId: 'earth',
      category: 'telemetry',
      reading: 'Continuous vertical aerosol profile tracking clouds and ozone layer balance.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-earth-biosphere',
    worldId: 'earth',
    x: 42,
    z: -32,
    kind: 'rock_sample',
    title: 'Biosphere Ecological Canopy Sensor',
    shortPrompt: 'Sample Vegetation Index & Soil Moisture',
    investigationId: 'earth-hydrology',
    scientificDataReading:
      'NDVI Vegetation Index: 0.78 (Lush Canopy) · Soil Moisture (SMAP): 32% volumetric · Root Zone Temperature: 19.4 °C · Photosynthetic Active Radiation: Optimal',
    rewardItem: {
      id: 'item-earth-soil',
      name: 'Fertile Biosphere Soil Core',
      worldId: 'earth',
      category: 'sample',
      reading: 'Rich organic humus soil supporting aerobic microorganisms and mycorrhizal fungi.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-earth-hydrology',
    worldId: 'earth',
    x: 28,
    z: 42,
    kind: 'ice_crater',
    title: 'Hydrological River Basin Monitor',
    shortPrompt: 'Analyze Freshwater Runoff & Sediment',
    investigationId: 'earth-hydrology',
    scientificDataReading:
      'Surface Water Flow: 14.2 m³/s · Dissolved Oxygen: 8.9 mg/L · pH: 7.2 · Turbidity: Low · Aquifer Recharge Rate: Nominal',
    rewardItem: {
      id: 'item-earth-water',
      name: 'Pristine River Basin Water Sample',
      worldId: 'earth',
      category: 'sample',
      reading: 'Liquid H2O filtered through natural limestone aquifer strata.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-earth-shuttle',
    worldId: 'earth',
    x: 0,
    z: 24,
    kind: 'shuttle',
    title: 'Launch Complex 39A Heavy Shuttle',
    shortPrompt: 'Open Star Map & Launch to Space Station / Mars / Moon',
    scientificDataReading: 'Orbital Class Shuttle Fuel Mass: 100% · Cryogenic Tanks Nominal · Ready for Launch',
    actionType: 'warp_hub',
  },
  {
    id: 'node-earth-sim',
    worldId: 'earth',
    x: -24,
    z: 22,
    kind: 'training_console',
    title: 'Astronaut Academy Operations Terminal',
    shortPrompt: 'Open Robotic Arm / Docking Flight Simulators',
    scientificDataReading: 'NASA Flight Simulator Mainframe Online · Cadet Evaluation Modules Loaded',
    actionType: 'open_training_sim',
  },

  // === VENUS APHRODITE TERRA NODES ===
  {
    id: 'node-venus-barometer',
    worldId: 'venus',
    x: -34,
    z: -26,
    kind: 'solar_sensor',
    title: 'Venera-Class Pressure & Thermal Probe',
    shortPrompt: 'Scan Venus Surface Pressure & Greenhouse Data',
    investigationId: 'venus-greenhouse',
    scientificDataReading:
      'Surface Pressure: 92 bar (equivalent to 900 m under Earth’s ocean) · Temp: +465 °C · CO2 Concentration: 96.5% · Cloud Deck: H2SO4 droplets',
    rewardItem: {
      id: 'item-venus-probe',
      name: 'Venus Thermal Barometer Log',
      worldId: 'venus',
      category: 'telemetry',
      reading: 'Dense 96.5% CO2 atmosphere traps infrared heat at 465 °C.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-venus-basalt',
    worldId: 'venus',
    x: 28,
    z: -18,
    kind: 'rock_sample',
    title: 'Volcanic Basalt Ridge Sample',
    shortPrompt: 'Scan Volcanic Sulfur Rock & Solve Venus Puzzle',
    investigationId: 'venus-greenhouse',
    scientificDataReading:
      'Volcanic Highlands: Basalt Plains · Sulfur Oxide Crust Detected · Infrared Re-radiation Trapped Under Thick Clouds',
    rewardItem: {
      id: 'item-venus-basalt',
      name: 'Aphrodite Volcanic Basalt Core',
      worldId: 'venus',
      category: 'sample',
      reading: 'Highland basalt shaped by widespread ancient Venusian lava flows.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-venus-shuttle',
    worldId: 'venus',
    x: 0,
    z: 24,
    kind: 'shuttle',
    title: 'Thermal-Shielded Ascent Shuttle',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Titanium Heat Shield Nominal · Ready for Orbital Ascent',
    actionType: 'warp_hub',
  },

  // === MERCURY CALORIS BASIN NODES ===
  {
    id: 'node-mercury-magnetometer',
    worldId: 'mercury',
    x: 34,
    z: -28,
    kind: 'radiator',
    title: 'Solar-Shielded Magnetometer Array',
    shortPrompt: 'Inspect Extreme Thermal Swing & Exosphere',
    investigationId: 'mercury-extremes',
    scientificDataReading:
      'Daylight Rock Temp: +430 °C · Night Crater Shadow: -180 °C · Surface Air: Near-Zero Exosphere · Solar Wind Flux: EXTREME',
    rewardItem: {
      id: 'item-mercury-thermal',
      name: 'Caloris Thermal Swing Reading',
      worldId: 'mercury',
      category: 'telemetry',
      reading: '610 °C day-to-night temperature swing due to virtually no atmosphere.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-mercury-crater',
    worldId: 'mercury',
    x: -26,
    z: -22,
    kind: 'drill',
    title: 'Caloris Impact Ejecta Analyzer',
    shortPrompt: 'Sample Crater Silicate & Calibrate Sunshade',
    investigationId: 'mercury-extremes',
    scientificDataReading:
      'Iron Core Fraction: ~85% of planet radius · Impact Crater Rays: Unweathered (no wind or rain erosion)',
    rewardItem: {
      id: 'item-mercury-ejecta',
      name: 'Caloris Crater Silicate Grain',
      worldId: 'mercury',
      category: 'sample',
      reading: 'Fresh unweathered crater ejecta from Mercury’s giant impact basin.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-mercury-shuttle',
    worldId: 'mercury',
    x: 0,
    z: 24,
    kind: 'shuttle',
    title: 'Sun-Shielded Messenger Shuttle',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Ceramic Sunshade Intact · Ready for Interplanetary Transfer',
    actionType: 'warp_hub',
  },

  // === JUPITER CLOUD DECK ALPHA NODES (3D Spacecraft Flight Mode) ===
  {
    id: 'node-jupiter-spectrometer',
    worldId: 'jupiter',
    x: -36,
    y: 12,
    z: -30,
    kind: 'satellite',
    title: 'Juno-Class Ammonia Vortex Probe',
    shortPrompt: 'Analyze Jovian Cloud Bands & Great Red Spot',
    investigationId: 'jupiter-vortex',
    scientificDataReading:
      'Atmosphere: 90% H2, 10% He + Ammonia Cloud Decks · Equatorial Jet Stream: 540 km/h · Magnetic Field: 14x stronger than Earth',
    rewardItem: {
      id: 'item-jupiter-vortex',
      name: 'Jovian Cyclone Doppler Log',
      worldId: 'jupiter',
      category: 'telemetry',
      reading: 'Counter-rotating ammonia jet streams power century-old anticyclonic storms.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-jupiter-redspot',
    worldId: 'jupiter',
    x: 30,
    y: 15,
    z: -26,
    kind: 'solar_sensor',
    title: 'Great Red Spot Drop-Sonde Buoy',
    shortPrompt: 'Sample Storm Edge & Repair Relay',
    investigationId: 'jupiter-vortex',
    scientificDataReading:
      'Storm Span: ~16,000 km (wider than Earth!) · Deep Convection Altitude · Zero Solid Surface Friction Detected',
    rewardItem: {
      id: 'item-jupiter-storm',
      name: 'Great Red Spot Aerosol Capsule',
      worldId: 'jupiter',
      category: 'sample',
      reading: 'Reddish ammonium hydrosulfide cloud tracers sampled above storm edge.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-jupiter-shuttle',
    worldId: 'jupiter',
    x: 0,
    y: 10,
    z: 26,
    kind: 'shuttle',
    title: 'Aero-Orbit Transfer Beacon',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Deep-Space Propulsion Ready · Destination Selectable via Star Map',
    actionType: 'warp_hub',
  },

  // === SATURN RING-PLANE STATION NODES (3D Spacecraft Flight Mode) ===
  {
    id: 'node-saturn-ringscanner',
    worldId: 'saturn',
    x: 34,
    y: 13,
    z: -24,
    kind: 'ice_crater',
    title: 'Cassini Ring-Particle Spectrometer',
    shortPrompt: 'Analyze Ring Composition & Cassini Division',
    investigationId: 'saturn-rings',
    scientificDataReading:
      'Ring Composition: 99% Pure Water Ice + Trace Silicate Dust · Particle Sizes: Micrometers to House-Sized Boulders · Moon Mimas Orbital Resonance Detected',
    rewardItem: {
      id: 'item-saturn-ice',
      name: 'Saturn Ring Water-Ice Sample',
      worldId: 'saturn',
      category: 'sample',
      reading: 'Ultra-reflective water-ice fragments sculpted into bands by shepherd moons.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-saturn-shepherd',
    worldId: 'saturn',
    x: -28,
    y: 16,
    z: -28,
    kind: 'satellite',
    title: 'Cassini Division Shepherd Beacon',
    shortPrompt: 'Inspect Shepherd Moon Gravity Gap',
    investigationId: 'saturn-rings',
    scientificDataReading:
      'Cassini Division Gap Width: 4,800 km · Sculpted by 2:1 Gravitational Resonance with Moon Mimas',
    rewardItem: {
      id: 'item-saturn-resonance',
      name: 'Ring Resonance Orbit Chart',
      worldId: 'saturn',
      category: 'telemetry',
      reading: 'Mapped shepherd moon gravity waves clearing Saturn’s main ring gap.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-saturn-shuttle',
    worldId: 'saturn',
    x: 0,
    y: 11,
    z: 26,
    kind: 'shuttle',
    title: 'Ring-Plane Transfer Beacon',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Outer System Navigation Locked · Ready for Departure',
    actionType: 'warp_hub',
  },

  // === URANUS METHANE SKIES NODES (3D Spacecraft Flight Mode) ===
  {
    id: 'node-uranus-gyro',
    worldId: 'uranus',
    x: -32,
    y: 12,
    z: -28,
    kind: 'solar_sensor',
    title: 'Axial-Tilt & Methane Cryo-Sensor',
    shortPrompt: 'Inspect 98° Axial Tilt & Methane Haze',
    investigationId: 'uranus-tilt',
    scientificDataReading:
      'Axial Tilt: 97.77° (Sideways Rotation) · Cloud Temp: -214 °C · Upper Atmosphere: Hydrogen, Helium & 2.3% Methane (absorbs red light)',
    rewardItem: {
      id: 'item-uranus-methane',
      name: 'Uranian Methane Spectrum Log',
      worldId: 'uranus',
      category: 'telemetry',
      reading: 'Methane gas absorbs red wavelengths and reflects cyan-blue sunlight.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-uranus-ringprobe',
    worldId: 'uranus',
    x: 26,
    y: 16,
    z: -22,
    kind: 'satellite',
    title: 'Vertical Polar Ring Relay',
    shortPrompt: 'Scan Cyan Clouds & Sideways Ring Arc',
    investigationId: 'uranus-tilt',
    scientificDataReading:
      'Orbital Period: 84 Earth Years · Polar Summer Duration: ~42 Continuous Years · Methane Haze Altitude: 1 bar',
    rewardItem: {
      id: 'item-uranus-polar',
      name: 'Uranian Polar Season Chart',
      worldId: 'uranus',
      category: 'telemetry',
      reading: 'Mapped 42-year continuous polar sunlight caused by 98° sideways spin.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-uranus-shuttle',
    worldId: 'uranus',
    x: 0,
    y: 11,
    z: 26,
    kind: 'shuttle',
    title: 'Ice-Giant Transfer Beacon',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Cryo-Propellant Nominal · Ready to Travel',
    actionType: 'warp_hub',
  },

  // === NEPTUNE SUPERSONIC STORMS NODES (3D Spacecraft Flight Mode) ===
  {
    id: 'node-neptune-anemometer',
    worldId: 'neptune',
    x: 32,
    y: 13,
    z: -30,
    kind: 'radiator',
    title: 'Supersonic Wind Doppler Mast',
    shortPrompt: 'Measure 2,100 km/h Methane Gale Energy',
    investigationId: 'neptune-winds',
    scientificDataReading:
      'Peak Wind Velocity: 2,100 km/h (Supersonic) · Solar Distance: 30.1 AU (0.1% Earth sunlight) · Internal Heat Emission: 2.6x energy absorbed from Sun',
    rewardItem: {
      id: 'item-neptune-wind',
      name: 'Neptune Supersonic Gale Log',
      worldId: 'neptune',
      category: 'telemetry',
      reading: 'Internal planetary heat drives the fastest winds in the Solar System.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-neptune-cirrus',
    worldId: 'neptune',
    x: -26,
    y: 16,
    z: -24,
    kind: 'satellite',
    title: 'Methane Cirrus Weather Buoy',
    shortPrompt: 'Repair Weather Buoy & Log Internal Heat',
    investigationId: 'neptune-winds',
    scientificDataReading:
      'Upper Cloud Layer: White Methane Cirrus Streaks at -201 °C · Core Thermal Upwelling Active',
    rewardItem: {
      id: 'item-neptune-cirrus',
      name: 'Neptune Cirrus Ice Log',
      worldId: 'neptune',
      category: 'sample',
      reading: 'High-altitude frozen methane streaks racing across azure storm bands.',
    },
    actionType: 'investigate_node',
  },
  {
    id: 'node-neptune-shuttle',
    worldId: 'neptune',
    x: 0,
    y: 11,
    z: 26,
    kind: 'shuttle',
    title: 'Deep-Space Return Beacon',
    shortPrompt: 'Open Star Map & Travel to Other Worlds',
    scientificDataReading: 'Long-Range Warp Systems Online · Ready for Departure',
    actionType: 'warp_hub',
  },
];

export interface ScientificInvestigation {
  id: string;
  title: string;
  worldId: WorldId;
  category: string;
  worldEffectTag: string;
  worldEffectLabel: string;
  problemStatement: string;
  fictionalVsRealNote: string;
  nasaSourceLabel: string;
  nasaSourceUrl: string;
  requiredNodeIds: string[];
  questionPrompt: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    reasoningFeedback: string;
  }[];
  commanderExtraClue: string;
}

export const SCIENTIFIC_INVESTIGATIONS: ScientificInvestigation[] = [
  {
    id: 'station-coolant',
    title: 'Space Station Thermal Imbalance',
    worldId: 'station',
    category: 'Space Station Emergency',
    worldEffectTag: 'RADIATOR_COOLING_ONLINE',
    worldEffectLabel: 'External radiator vanes rotated & Backup Loop A cooling active!',
    problemStatement:
      'Cabin computers in the Orbital Research Station are heating up during the sunlit half of orbit. Scan the Thermal Radiator Manifold in the 3D station to inspect the telemetry before choosing a fix.',
    fictionalVsRealNote:
      'Fictional Training Scenario: Loop B valve failure aboard our academy station. Real NASA Science: The real ISS uses external ammonia loops and white radiator panels to dump heat into space as infrared radiation.',
    nasaSourceLabel: 'NASA · Space Station Thermal Control',
    nasaSourceUrl: 'https://www.nasa.gov/international-space-station/',
    requiredNodeIds: ['node-station-coolant'],
    commanderExtraClue:
      'Commander Analysis: Compare how heat escapes in a vacuum (radiation only, no air convection) with your Loop B flow reading (42%).',
    questionPrompt:
      'Based on your Thermal Radiator telemetry (+118 °C hull, Loop B valve stuck at 42% flow), what is the safest scientific solution?',
    options: [
      {
        id: 'switch-loop-a',
        label: 'Isolate clogged Loop B, activate redundant Cooling Loop A, and turn radiators edge-on to Earth’s sun glare',
        isCorrect: true,
        reasoningFeedback:
          'Exact aerospace engineering! Because space is a vacuum with no air to carry heat away, switching to redundant Loop A restores heat transfer to the external infrared radiators safely.',
      },
      {
        id: 'open-hatch-cool',
        label: 'Crack open the airlock hatch briefly so cold space air rushes in to cool the computers',
        isCorrect: false,
        reasoningFeedback:
          'Think about space physics: outer space is a vacuum with NO air! Opening a hatch would vent the astronauts’ breathable cabin air without cooling the electronics safely.',
      },
      {
        id: 'increase-power',
        label: 'Run extra heaters to balance the temperature sensors',
        isCorrect: false,
        reasoningFeedback:
          'Adding heat raises thermal load even more! Remember, the telemetry showed Loop B coolant flow dropped to 42%.',
      },
    ],
  },
  {
    id: 'satellite-drift',
    title: 'Deep Space Relay Signal Loss',
    worldId: 'station',
    category: 'Satellite Investigation',
    worldEffectTag: 'SATELLITE_LOCK_RESTORED',
    worldEffectLabel: 'Relay satellite reaction wheels despun & Earth antenna locked!',
    problemStatement:
      'A docked communications satellite lost radio contact with Earth. Walk over to the Docked Relay Satellite in the 3D station to inspect its Star Tracker and Reaction Wheel readings.',
    fictionalVsRealNote:
      'Fictional Training Scenario: Academy relay satellite signal loss. Real NASA Science: Satellites use spinning reaction wheels and star-tracker cameras to aim dishes within fractions of a degree toward Earth.',
    nasaSourceLabel: 'NASA · Deep Space Network & Attitude Control',
    nasaSourceUrl: 'https://science.nasa.gov/',
    requiredNodeIds: ['node-station-satellite'],
    commanderExtraClue:
      'Commander Analysis: Notice Reaction Wheel #2 is saturated (spinning at max RPM) while fuel is 78% and Yaw Offset is +24.5°.',
    questionPrompt:
      'The satellite’s Star Tracker shows a +24.5° yaw offset and Reaction Wheel #2 is saturated. How do engineers restore the link?',
    options: [
      {
        id: 'desaturate-repoint',
        label: 'Pulse attitude thrusters gently to unload Reaction Wheel #2, then use Star Tracker coordinates to re-aim -24.5° toward Earth',
        isCorrect: true,
        reasoningFeedback:
          'Spot on! Real spacecraft unload saturated reaction wheels with tiny thruster pulses (momentum dumping) and use star trackers to lock the dish right back onto Earth.',
      },
      {
        id: 'boost-transmitter',
        label: 'Leave the dish pointing +24.5° away and double the radio volume',
        isCorrect: false,
        reasoningFeedback:
          'High-gain space antennas focus radio beams tightly like a laser pointer. Even a 24.5° error misses Earth completely no matter how loud the signal is!',
      },
      {
        id: 'spin-faster',
        label: 'Spin the satellite continuously in circles so it sweeps past Earth every second',
        isCorrect: false,
        reasoningFeedback:
          'Continuous spinning breaks sustained data downloads and stresses solar arrays. Controlled star-tracker pointing is needed.',
      },
    ],
  },
  {
    id: 'solar-storm',
    title: 'Incoming Solar Storm (CME) Alert',
    worldId: 'station',
    category: 'Solar Storm Defense',
    worldEffectTag: 'STORM_SHIELD_ACTIVE',
    worldEffectLabel: 'Radiation storm shelter energized & particle flux shielded!',
    problemStatement:
      'NASA space weather monitors detect a fast Coronal Mass Ejection (CME) heading toward Earth and Mars. Scan either the Station Solar Array Magnetometer or the Mars Radiation Mast to collect live particle data.',
    fictionalVsRealNote:
      'Fictional Training Scenario: Immediate 22-minute station/Mars storm drill. Real NASA Science: NASA’s Solar Dynamics Observatory (SDO) tracks CMEs—clouds of magnetized solar particles that raise radiation hazards in space.',
    nasaSourceLabel: 'NASA · Space Weather & Solar Dynamics',
    nasaSourceUrl: 'https://science.nasa.gov/sun/',
    requiredNodeIds: ['node-station-power', 'node-mars-storm'], // Either one satisfies via custom check!
    commanderExtraClue:
      'Commander Analysis: Solar protons travel slower than light (arrival in 22 min in our drill). Mars has no global magnetic field like Earth.',
    questionPrompt:
      'Proton flux is spiking ahead of a solar storm. What scientific action best protects astronauts and sensitive electronics?',
    options: [
      {
        id: 'shield-shelter',
        label: 'Move crew into high-density water/polyethylene storm shielding and switch non-vital computers to radiation-safe mode',
        isCorrect: true,
        reasoningFeedback:
          'Excellent space-weather protocol! Hydrogen-rich materials like water walls and polyethylene absorb high-energy solar protons much better than thin metal alone, protecting astronauts until the storm passes.',
      },
      {
        id: 'spacewalk-watch',
        label: 'Go outside for an EVA spacewalk to watch the solar particles closely',
        isCorrect: false,
        reasoningFeedback:
          'Outside the station or on an unshielded surface, spacesuits offer far less radiation protection than thick habitat storm shelters.',
      },
      {
        id: 'open-mirrors',
        label: 'Point telescope mirrors directly at the Sun without filters',
        isCorrect: false,
        reasoningFeedback:
          'Focusing intense sunlight without solar filters damages optical sensors and does not protect the crew from high-energy protons.',
      },
    ],
  },
  {
    id: 'mars-lakebed',
    title: 'Jezero Crater Ancient Water Mystery',
    worldId: 'mars',
    category: 'Mars Exploration',
    worldEffectTag: 'MARS_ROVER_ANALYZED',
    worldEffectLabel: 'Jezero ancient delta sample logged & rover power conserved!',
    problemStatement:
      'Explore Jezero Crater on Mars! Scan both the Perseverance-Class Rover AND the Ancient Delta Outcrop to gather mineral and dust-storm data, then determine what the rock clues prove.',
    fictionalVsRealNote:
      'Fictional Training Scenario: Combined field survey at Jezero Crater. Real NASA Science: Perseverance actually landed in Jezero Crater because orbital maps showed clay minerals and an ancient river delta.',
    nasaSourceLabel: 'NASA · Mars Perseverance Rover',
    nasaSourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    requiredNodeIds: ['node-mars-rover', 'node-mars-rock'],
    commanderExtraClue:
      'Commander Analysis: Look at BOTH evidence logs—smooth rounded pebbles + smectite clay minerals + Tau 2.8 dust storm lowering solar power.',
    questionPrompt:
      'Your Martian scans found rounded pebbles and smectite clay during a dust storm (Tau 2.8). What conclusion and rover action are scientifically sound?',
    options: [
      {
        id: 'water-and-power',
        label: 'The rounded pebbles and clay prove liquid water once flowed here; shelter solar rovers or rely on nuclear MMRTG power during the dust storm',
        isCorrect: true,
        reasoningFeedback:
          'Brilliant planetary geology! Only long-term flowing water tumbles rocks smooth and forms smectite clays. And because Martian dust storms block sunlight, real rovers like Perseverance use an MMRTG nuclear battery!',
      },
      {
        id: 'wind-only',
        label: 'Martian wind carved ocean waves today, and solar panels work twice as well inside dust storms',
        isCorrect: false,
        reasoningFeedback:
          'Check your data: Mars air is far too thin for oceans today, and thick dust storms (Tau 2.8) block sunlight from reaching solar panels.',
      },
      {
        id: 'lava-lake',
        label: 'Clay minerals only form inside active volcanoes with zero water',
        isCorrect: false,
        reasoningFeedback:
          'Smectite clays require water interacting with rock—that is the exact reason NASA chose Jezero Crater!',
      },
    ],
  },
  {
    id: 'lunar-ice',
    title: 'Shackleton Crater Lunar Ice Discovery',
    worldId: 'moon',
    category: 'Lunar Exploration',
    worldEffectTag: 'LUNAR_ICE_EXTRACTED',
    worldEffectLabel: 'Cryo-core sample sealed & Lunar South Pole relay beacon activated!',
    problemStatement:
      'Investigate the Moon’s South Pole! Scan the Shadowed Crater Ice Deposit and the Lunar Regolith Core Drill to compare sunlit vs. shadowed temperatures and plan a safe extraction.',
    fictionalVsRealNote:
      'Fictional Training Scenario: Artemis-style South Pole field test. Real NASA Science: Lunar Reconnaissance Orbiter data shows water ice trapped inside permanently shadowed polar craters below -160 °C.',
    nasaSourceLabel: 'NASA · Artemis & Lunar South Pole',
    nasaSourceUrl: 'https://science.nasa.gov/moon/',
    requiredNodeIds: ['node-moon-ice', 'node-moon-drill'],
    commanderExtraClue:
      'Commander Analysis: Notice the 290 °C temperature swing between the sunlit ridge (+112 °C) and crater shadow (-178 °C), plus sharp abrasive dust!',
    questionPrompt:
      'Why is finding water ice in -178 °C permanently shadowed craters so valuable, and how must your drill handle lunar regolith?',
    options: [
      {
        id: 'ice-for-oxygen-fuel',
        label: 'Water ice can supply drinking water, breathable oxygen, and rocket fuel (H₂/O₂); use dust-sealed, thermally insulated slow drilling',
        isCorrect: true,
        reasoningFeedback:
          'Outstanding Artemis engineering! Splitting H₂O into hydrogen and oxygen provides air and propellant without hauling heavy water from Earth, while dust seals protect the drill from sharp lunar regolith.',
      },
      {
        id: 'ice-melts-noon',
        label: 'Wait until noon for the crater floor to warm into a swimming pool so pumps can suck it up',
        isCorrect: false,
        reasoningFeedback:
          'Because the Moon’s axis barely tilts (1.5°), deep South Pole crater floors stay in permanent shadow and never warm up at noon!',
      },
      {
        id: 'regolith-soft',
        label: 'Lunar dust is smooth like beach sand, so no dust protection is needed',
        isCorrect: false,
        reasoningFeedback:
          'Unlike Earth sand smoothed by wind and water, lunar regolith is shattered by meteorite impacts into razor-sharp glass-like grains that cling via static electricity.',
      },
    ],
  },
  {
    id: 'earth-atmosphere',
    title: 'Earth Atmospheric Ozone & Greenhouse Balance',
    worldId: 'earth',
    category: 'Earth Science & Climate',
    worldEffectTag: 'ATMOSPHERIC_LIDAR_CALIBRATED',
    worldEffectLabel: 'NASA LiDAR calibrated & Stratospheric Ozone telemetry logged!',
    problemStatement:
      'Atmospheric LiDAR sensors at Kennedy Space Center detect changes in tropospheric aerosols and stratospheric ozone. Inspect the LiDAR telemetry to understand Earth’s natural greenhouse effect and radiation shielding.',
    fictionalVsRealNote:
      'NASA Earth Science: Satellites like Terra, Aqua, and Aura measure the ozone layer and greenhouse gases (CO2, CH4, H2O) that keep Earth’s average surface temperature at a hospitable 15 °C.',
    nasaSourceLabel: 'NASA Earth Science & Climate Observation',
    nasaSourceUrl: 'https://science.nasa.gov/earth/',
    requiredNodeIds: ['node-earth-lidar'],
    commanderExtraClue:
      'Commander Analysis: Consider Earth’s unique atmospheric composition (78% N2, 21% O2) and how greenhouse gases trap infrared thermal radiation emitted by the ground.',
    questionPrompt:
      'How does Earth’s atmosphere protect life and maintain a stable temperature compared to the airless Moon or runaway greenhouse on Venus?',
    options: [
      {
        id: 'earth-balance',
        label: 'The stratospheric ozone layer blocks harmful solar UV-C rays, while trace greenhouse gases trap just enough infrared heat to keep liquid water stable',
        isCorrect: true,
        reasoningFeedback:
          'Exact NASA Earth Science! Without greenhouse gases Earth would freeze at -18 °C; ozone blocks lethal UV, creating the ideal Goldilocks zone for life.',
      },
      {
        id: 'nitrogen-burns',
        label: 'Nitrogen gas ignites in sunlight to heat the planet like an open furnace',
        isCorrect: false,
        reasoningFeedback:
          'Molecular nitrogen (N2) is an inert, non-flammable gas with a triple bond that stabilizes the atmosphere without burning.',
      },
      {
        id: 'no-infrared',
        label: 'Earth’s surface does not emit any heat radiation into the atmosphere',
        isCorrect: false,
        reasoningFeedback:
          'Earth absorbs incoming solar radiation and reradiates it as longwave infrared energy, which greenhouse gases naturally absorb.',
      },
    ],
  },
  {
    id: 'earth-hydrology',
    title: 'Global Hydrological Cycle & Biosphere Moisture',
    worldId: 'earth',
    category: 'Earth Science & Climate',
    worldEffectTag: 'BIOSPHERE_CANOPY_HEALTHY',
    worldEffectLabel: 'Soil Moisture active & Hydrological River Runoff verified!',
    problemStatement:
      'Sample the Biosphere Ecological Canopy and Hydrological River Basin to assess how water cycles between soil, plants, and the atmosphere (evapotranspiration).',
    fictionalVsRealNote:
      'NASA SMAP (Soil Moisture Active Passive) and SWOT missions map Earth’s surface water and root-zone moisture to predict droughts, floods, and agricultural productivity.',
    nasaSourceLabel: 'NASA · SMAP & Hydrology',
    nasaSourceUrl: 'https://science.nasa.gov/earth/water/',
    requiredNodeIds: ['node-earth-biosphere', 'node-earth-hydrology'],
    commanderExtraClue:
      'Commander Analysis: Note how plant transpiration cools the local microclimate and drives continental precipitation loops.',
    questionPrompt:
      'How does vegetation and soil moisture influence Earth’s water cycle and weather systems?',
    options: [
      {
        id: 'transpiration-cooling',
        label: 'Plant transpiration pumps water vapor into the air to form clouds, cools surface temperatures, and regulates regional rainfall patterns',
        isCorrect: true,
        reasoningFeedback:
          'Outstanding biosphere science! Vegetation acts as a natural water pump and air conditioner, recycling over 60% of land precipitation through evapotranspiration.',
      },
      {
        id: 'soil-dries-clouds',
        label: 'Moist soil destroys clouds because wet mud absorbs all atmospheric moisture',
        isCorrect: false,
        reasoningFeedback:
          'Moist soil evaporates water into the air, promoting cloud formation and local showers rather than destroying clouds.',
      },
      {
        id: 'rivers-never-evaporate',
        label: 'Rivers only flow downward into bedrock and never return water to the atmosphere',
        isCorrect: false,
        reasoningFeedback:
          'Water continuously evaporates from rivers, lakes, and oceans into the atmosphere, condensing into clouds and falling again as rain.',
      },
    ],
  },
  {
    id: 'venus-greenhouse',
    title: 'Venus Runaway Greenhouse Furnace',
    worldId: 'venus',
    category: 'Planetary Atmospheres',
    worldEffectTag: 'VENUS_SHIELD_TUNED',
    worldEffectLabel: 'Titanium thermal shield tuned & Aphrodite radar beacon active!',
    problemStatement:
      'Even though Mercury is closer to the Sun, Venus is the hottest planet in the Solar System (+465 °C). Scan the Venera-Class Pressure Probe to examine why.',
    fictionalVsRealNote:
      'Real NASA/Venera Science: Venus has an ultra-dense 96.5% CO2 atmosphere creating a runaway greenhouse effect at 92 bar surface pressure.',
    nasaSourceLabel: 'NASA · Venus Facts & DAVINCI Mission',
    nasaSourceUrl: 'https://science.nasa.gov/venus/',
    requiredNodeIds: ['node-venus-barometer', 'node-venus-basalt'],
    commanderExtraClue:
      'Commander Analysis: Compare 96.5% carbon dioxide trapping infrared heat with Venus’s distance from the Sun.',
    questionPrompt:
      'Why does Venus stay hotter (+465 °C) than Mercury even though Venus receives less sunlight?',
    options: [
      {
        id: 'venus-co2-trap',
        label: 'A crushing carbon dioxide (96.5%) atmosphere traps escaping infrared heat in a runaway greenhouse effect',
        isCorrect: true,
        reasoningFeedback:
          'Spot-on planetary climatology! Sunlight filters through Venus’s clouds, warms the rock, and the thick CO2 blanket blocks infrared heat from escaping back to space.',
      },
      {
        id: 'venus-closer-sun',
        label: 'Venus actually orbits closer to the Sun than Mercury during summer',
        isCorrect: false,
        reasoningFeedback:
          'Check the Star Map: Mercury orbits at 0.39 AU while Venus orbits nearly twice as far at 0.72 AU.',
      },
      {
        id: 'venus-no-air',
        label: 'Venus has zero atmosphere so raw sunlight burns the surface directly',
        isCorrect: false,
        reasoningFeedback:
          'The probe recorded 92 bar of surface pressure—Venus has the thickest terrestrial atmosphere in the Solar System!',
      },
    ],
  },
  {
    id: 'mercury-extremes',
    title: 'Mercury Extreme Temperature Swings',
    worldId: 'mercury',
    category: 'Inner Solar System',
    worldEffectTag: 'MERCURY_SHADE_LOCKED',
    worldEffectLabel: 'Caloris thermal array aligned & solar-wind shield energized!',
    problemStatement:
      'Our Caloris Basin magnetometer measured +430 °C on the sunlit side and -180 °C in crater shadows right next door. Scan the array to understand why Mercury cannot hold warmth.',
    fictionalVsRealNote:
      'Real NASA Science: NASA’s MESSENGER spacecraft confirmed Mercury has only a razor-thin exosphere, so heat escapes instantly into space at nightfall.',
    nasaSourceLabel: 'NASA · Mercury Exploration',
    nasaSourceUrl: 'https://science.nasa.gov/mercury/',
    requiredNodeIds: ['node-mercury-magnetometer', 'node-mercury-crater'],
    commanderExtraClue:
      'Commander Analysis: Look at the near-zero exosphere reading paired with the 610 °C day-to-night drop.',
    questionPrompt:
      'What causes Mercury’s night side to plunge to -180 °C despite being the closest planet to the Sun?',
    options: [
      {
        id: 'mercury-no-blanket',
        label: 'Mercury has virtually no atmosphere (only a thin exosphere) to circulate or trap heat after sunset',
        isCorrect: true,
        reasoningFeedback:
          'Exact physics! Without an atmosphere acting as an insulating blanket, heat radiates directly out into space as soon as the Sun sets.',
      },
      {
        id: 'mercury-ice-core',
        label: 'A giant iceberg core freezes the entire planet every 10 minutes',
        isCorrect: false,
        reasoningFeedback:
          'Mercury actually has a huge iron core, not an iceberg—only permanently shadowed polar craters stay frozen.',
      },
      {
        id: 'sun-turns-off',
        label: 'The Sun cools down completely whenever Mercury passes behind Venus',
        isCorrect: false,
        reasoningFeedback:
          'The Sun shines steadily; Mercury rotates slowly (~59 Earth days per spin), leaving night regions dark and airless.',
      },
    ],
  },
  {
    id: 'jupiter-vortex',
    title: 'Jupiter Ammonia Cyclones & Jet Streams',
    worldId: 'jupiter',
    category: 'Gas Giant Dynamics',
    worldEffectTag: 'JUPITER_DOPPLER_LOCKED',
    worldEffectLabel: 'Jovian Doppler radar locked onto ammonia cloud bands!',
    problemStatement:
      'Swirling amber-and-white ammonia clouds race beneath Cloud Deck Alpha at 540 km/h. Scan the Juno-Class Vortex Probe to discover how storms like the Great Red Spot survive for centuries.',
    fictionalVsRealNote:
      'Fictional Aero-Platform over Real NASA Science: NASA’s Juno probe measures Jupiter’s deep jet streams and 300+ year old Great Red Spot anticyclone.',
    nasaSourceLabel: 'NASA · Juno Mission to Jupiter',
    nasaSourceUrl: 'https://science.nasa.gov/jupiter/',
    requiredNodeIds: ['node-jupiter-spectrometer', 'node-jupiter-redspot'],
    commanderExtraClue:
      'Commander Analysis: Earth hurricanes weaken when they hit solid continents. Does a gas giant have solid land beneath its storms?',
    questionPrompt:
      'Why can giant storms like Jupiter’s Great Red Spot last for hundreds of years instead of fading in days like Earth hurricanes?',
    options: [
      {
        id: 'jupiter-no-land',
        label: 'Gas giants have no solid ground friction to slow storms down, and fast 10-hour rotation feeds strong jet streams',
        isCorrect: true,
        reasoningFeedback:
          'Brilliant fluid dynamics! With no continents or mountain ranges creating surface friction—and intense internal heat—Jovian vortices spin for centuries.',
      },
      {
        id: 'jupiter-tiny-gravity',
        label: 'Jupiter has weaker gravity than the Moon so air stops moving',
        isCorrect: false,
        reasoningFeedback:
          'Check the HUD: Jupiter has 24.79 m/s² gravity (more than 2.5× Earth) and violent 540 km/h jet streams!',
      },
      {
        id: 'jupiter-rocky-peaks',
        label: 'Tall granite mountains lock the storm inside a stone bowl',
        isCorrect: false,
        reasoningFeedback:
          'Jupiter is a gas giant composed mostly of hydrogen and helium with no solid rocky surface.',
      },
    ],
  },
  {
    id: 'saturn-rings',
    title: 'Saturn’s Icy Rings & Cassini Division',
    worldId: 'saturn',
    category: 'Planetary Ring Physics',
    worldEffectTag: 'SATURN_SCANNER_TUNED',
    worldEffectLabel: 'Ring-plane LiDAR calibrated to shepherd moon orbits!',
    problemStatement:
      'Above Saturn’s golden cloud deck, massive icy rings stretch across the sky with a sharp dark gap called the Cassini Division. Scan the Ring-Particle Spectrometer to inspect what forms the rings and gaps.',
    fictionalVsRealNote:
      'Real NASA Cassini Science: Saturn’s rings are 99% pure water-ice orbiting chunks, sculpted by gravitational resonances from moons like Mimas and shepherd moons.',
    nasaSourceLabel: 'NASA · Cassini & Saturn’s Rings',
    nasaSourceUrl: 'https://science.nasa.gov/saturn/',
    requiredNodeIds: ['node-saturn-ringscanner', 'node-saturn-shepherd'],
    commanderExtraClue:
      'Commander Analysis: Look at the Moon Mimas orbital resonance note in your spectrometer telemetry.',
    questionPrompt:
      'What are Saturn’s dazzling rings made of, and what carves the wide dark Cassini Division gap?',
    options: [
      {
        id: 'saturn-ice-resonance',
        label: 'Billions of orbiting water-ice and rock particles; gravitational tugs from moons like Mimas sweep clear orbital gaps',
        isCorrect: true,
        reasoningFeedback:
          'Exact orbital mechanics! Every time ring particles orbit twice, Mimas orbits once (2:1 resonance), nudging ice out of the Cassini Division.',
      },
      {
        id: 'saturn-solid-hoop',
        label: 'A single solid disk of painted aluminum welded around the equator',
        isCorrect: false,
        reasoningFeedback:
          'Spectrometer telemetry proves the rings are billions of independent water-ice chunks ranging from dust grains to boulders.',
      },
      {
        id: 'saturn-fire-belt',
        label: 'Molten lava rivers glowing white in vacuum',
        isCorrect: false,
        reasoningFeedback:
          'At 9.58 AU from the Sun, Saturn is freezing cold—its bright rings reflect sunlight off pure water ice.',
      },
    ],
  },
  {
    id: 'uranus-tilt',
    title: 'Uranus 98° Axial Tilt & Cyan Methane Skies',
    worldId: 'uranus',
    category: 'Ice Giant Science',
    worldEffectTag: 'URANUS_GYRO_SYNCED',
    worldEffectLabel: 'Axial telemetry synchronized with Uranian polar jet!',
    problemStatement:
      'Uranus rolls on its side at a 97.77° tilt while cyan methane clouds sweep past. Scan the Axial-Tilt Cryo-Sensor to explain both its sideways seasons and icy cyan color.',
    fictionalVsRealNote:
      'Real NASA Voyager 2 Science: Uranus’s extreme tilt creates 42-year polar summers/winters, and atmospheric methane absorbs red sunlight, leaving cyan.',
    nasaSourceLabel: 'NASA · Uranus Facts',
    nasaSourceUrl: 'https://science.nasa.gov/uranus/',
    requiredNodeIds: ['node-uranus-gyro', 'node-uranus-ringprobe'],
    commanderExtraClue:
      'Commander Analysis: Sunlight contains red, green, and blue wavelengths. Which color does methane absorb?',
    questionPrompt:
      'What gives Uranus its pale-cyan color and extreme 42-year seasons?',
    options: [
      {
        id: 'uranus-methane-tilt',
        label: 'Methane gas absorbs red sunlight leaving cyan-blue reflections, while a ~98° axial tilt aims poles toward the Sun for decades',
        isCorrect: true,
        reasoningFeedback:
          'Spot-on spectroscopy and orbital geometry! With a nearly horizontal spin axis and an 84-year orbit, each pole gets ~42 Earth years of continuous daylight or darkness.',
      },
      {
        id: 'uranus-neon-lamps',
        label: 'Giant turquoise spotlights under a frozen ocean',
        isCorrect: false,
        reasoningFeedback:
          'The cyan glow is natural solar reflection filtered by upper-atmosphere methane gas.',
      },
      {
        id: 'uranus-no-spin',
        label: 'Uranus never rotates at all and has no seasons',
        isCorrect: false,
        reasoningFeedback:
          'Uranus actually rotates every ~17 hours on its tilted 97.77° axis, causing extreme seasonal shifts.',
      },
    ],
  },
  {
    id: 'neptune-winds',
    title: 'Neptune Supersonic Winds in Deep Space',
    worldId: 'neptune',
    category: 'Outer Ice Giants',
    worldEffectTag: 'NEPTUNE_MAST_LOCKED',
    worldEffectLabel: 'Doppler anemometer locked onto 2,100 km/h methane jet!',
    problemStatement:
      'At 30 AU from the Sun, Neptune receives 900 times less sunlight than Earth—yet hosts 2,100 km/h supersonic winds! Scan the Doppler Mast to uncover where the storm energy comes from.',
    fictionalVsRealNote:
      'Real NASA Voyager 2 / Hubble Science: Neptune radiates over 2.6× as much heat from its deep interior as it receives from the distant Sun, fueling fierce atmospheric jets.',
    nasaSourceLabel: 'NASA · Neptune Exploration',
    nasaSourceUrl: 'https://science.nasa.gov/neptune/',
    requiredNodeIds: ['node-neptune-anemometer', 'node-neptune-cirrus'],
    commanderExtraClue:
      'Commander Analysis: Check the Internal Heat Emission ratio (2.6× solar input) paired with low friction in cold hydrogen/methane.',
    questionPrompt:
      'How can Neptune generate 2,100 km/h supersonic winds so far from the Sun’s warmth?',
    options: [
      {
        id: 'neptune-internal-heat',
        label: 'Strong internal planetary heat (2.6× solar input) rises through cold, low-friction methane layers to power extreme winds',
        isCorrect: true,
        reasoningFeedback:
          'Outstanding astrophysics! Internal heat escaping from Neptune’s dense interior drives vigorous convection with very little atmospheric drag.',
      },
      {
        id: 'neptune-solar-flare',
        label: 'Neptune sits closest to the Sun so solar heat boils the clouds',
        isCorrect: false,
        reasoningFeedback:
          'Neptune orbits at 30.1 AU—farthest of the eight major planets—receiving only 0.1% as much sunlight as Earth.',
      },
      {
        id: 'neptune-comet-fans',
        label: 'Passing comets physically push Neptune’s clouds every day',
        isCorrect: false,
        reasoningFeedback:
          'Winds are sustained continuously by Neptune’s own internal heat flux and rapid planetary rotation.',
      },
    ],
  },
];

const ANY_NODE_INVESTIGATIONS = new Set([
  'solar-storm',
  'venus-greenhouse',
  'mercury-extremes',
  'jupiter-vortex',
  'saturn-rings',
  'uranus-tilt',
  'neptune-winds',
]);

export function isInvestigationReady(
  inv: ScientificInvestigation,
  discoveredNodes: string[]
): boolean {
  if (ANY_NODE_INVESTIGATIONS.has(inv.id)) {
    return inv.requiredNodeIds.some((id) => discoveredNodes.includes(id));
  }
  return inv.requiredNodeIds.every((id) => discoveredNodes.includes(id));
}
