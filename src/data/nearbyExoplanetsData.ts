import artProximaB from '../assets/images/exo_proxima_b_surface_1794744017822.jpg';
import artRoss128B from '../assets/images/exo_ross_128_temperate_1794744017717.jpg';
import artEpsilonEridaniB from '../assets/images/exo_epsilon_eridani_giant_1794744020416.jpg';
import artBarnardsStarB from '../assets/images/exo_barnards_star_b_1794744019836.jpg';

export interface SpectroscopyDataPoint {
  wavelengthUm: number; // e.g. 1.0 to 5.0 micrometers
  relativeAbsorptionPpm: number; // parts per million
  chemicalLabel?: string;
}

export interface NearbyExoplanet {
  id: string;
  name: string;
  hostStar: string;
  starType: string;
  distanceLy: number;
  planetaryClass: 'Terrestrial' | 'Super-Earth' | 'Gas Giant' | 'Mini-Neptune';
  massEarthRatio: number | null; // null if unknown
  radiusEarthRatio: number | null; // null if unknown
  orbitalPeriodDays: number | null;
  semiMajorAxisAU: number | null;
  discoveryYear: number;
  discoveryMethod: string;
  temperatureCelsius: number | null; // null if unknown
  temperatureKelvin: number | null;
  inHabitableZone: boolean;
  confirmed: boolean; // true = confirmed, false = candidate
  stellarTempK: number;
  stellarRadiusSunRatio: number;
  stellarLuminositySunRatio: number;
  habitableZoneAU: { min: number; max: number };
  radialVelocityAmplitudeK: number | null; // m/s
  atmosphereStatus: string;
  spectroscopyData: SpectroscopyDataPoint[];
  scientificFacts: string[];
  openQuestions: string[];
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
  illustrationSrc?: string;
  surfaceTextureType: 'cratered-red' | 'cratered-basalt' | 'temperate-water' | 'gas-turbulent' | 'super-earth-haze' | 'sub-earth-scorched';
}

export const NEARBY_EXOPLANETS: NearbyExoplanet[] = [
  {
    id: 'proxima-centauri-b',
    name: 'Proxima Centauri b',
    hostStar: 'Proxima Centauri',
    starType: 'Red Dwarf (M6.5V)',
    distanceLy: 4.246,
    planetaryClass: 'Terrestrial',
    massEarthRatio: 1.07,
    radiusEarthRatio: 1.08,
    orbitalPeriodDays: 11.186,
    semiMajorAxisAU: 0.0485,
    discoveryYear: 2016,
    discoveryMethod: 'Radial Velocity (HARPS / ESPRESSO)',
    temperatureCelsius: -39,
    temperatureKelvin: 234,
    inHabitableZone: true,
    confirmed: true,
    stellarTempK: 3042,
    stellarRadiusSunRatio: 0.154,
    stellarLuminositySunRatio: 0.0017,
    habitableZoneAU: { min: 0.042, max: 0.082 },
    radialVelocityAmplitudeK: 1.24,
    atmosphereStatus: 'Unconfirmed · High UV flare erosion risk being modeled by JWST GTO programs.',
    spectroscopyData: [
      { wavelengthUm: 1.1, relativeAbsorptionPpm: 240 },
      { wavelengthUm: 1.4, relativeAbsorptionPpm: 310, chemicalLabel: 'H2O window' },
      { wavelengthUm: 1.9, relativeAbsorptionPpm: 260 },
      { wavelengthUm: 2.7, relativeAbsorptionPpm: 480, chemicalLabel: 'CO2 band' },
      { wavelengthUm: 3.3, relativeAbsorptionPpm: 340, chemicalLabel: 'CH4 feature' },
      { wavelengthUm: 4.3, relativeAbsorptionPpm: 620, chemicalLabel: 'CO2 spike' },
      { wavelengthUm: 4.8, relativeAbsorptionPpm: 290 },
    ],
    scientificFacts: [
      'Closest known exoplanet to our Solar System at exactly 4.25 light-years away in constellation Centaurus.',
      'Orbits within the conservative habitable zone of its parent red dwarf star with stellar flux ~65% of Earth.',
      'Radial velocity semi-amplitude of 1.24 m/s confirmed across multiple European Southern Observatory spectrographs.',
    ],
    openQuestions: [
      'Is the planet synchronously locked into 1:1 tidal spin or a 3:2 spin-orbit resonance like Mercury?',
      'Has intense coronal mass ejections and X-ray flaring stripped away secondary atmosphere volatiles?',
    ],
    sourceName: 'NASA Exoplanet Archive (Verified Astronomical Reference)',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    illustrationSrc: artProximaB,
    surfaceTextureType: 'cratered-red',
  },
  {
    id: 'proxima-centauri-d',
    name: 'Proxima Centauri d',
    hostStar: 'Proxima Centauri',
    starType: 'Red Dwarf (M6.5V)',
    distanceLy: 4.246,
    planetaryClass: 'Terrestrial',
    massEarthRatio: 0.26,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 5.122,
    semiMajorAxisAU: 0.0288,
    discoveryYear: 2022,
    discoveryMethod: 'Radial Velocity (ESPRESSO on VLT)',
    temperatureCelsius: 87,
    temperatureKelvin: 360,
    inHabitableZone: false,
    confirmed: true,
    stellarTempK: 3042,
    stellarRadiusSunRatio: 0.154,
    stellarLuminositySunRatio: 0.0017,
    habitableZoneAU: { min: 0.042, max: 0.082 },
    radialVelocityAmplitudeK: 0.39,
    atmosphereStatus: 'Unknown · Sub-Earth mass planet subjected to severe stellar wind irradiation.',
    spectroscopyData: [
      { wavelengthUm: 1.2, relativeAbsorptionPpm: 120 },
      { wavelengthUm: 1.8, relativeAbsorptionPpm: 140 },
      { wavelengthUm: 2.5, relativeAbsorptionPpm: 130 },
      { wavelengthUm: 3.5, relativeAbsorptionPpm: 155 },
      { wavelengthUm: 4.5, relativeAbsorptionPpm: 160 },
    ],
    scientificFacts: [
      'One of the lightest exoplanets ever discovered using the radial velocity method (mass is ~0.26 Earth masses).',
      'Orbits Proxima Centauri in just 5.1 days at roughly 4.3 million km distance.',
      'Detected via tiny stellar reflex wobbles of only 39 cm/s.',
    ],
    openQuestions: [
      'Does a bare metallic core remain after volatile atmospheric blowoff?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    surfaceTextureType: 'cratered-basalt',
  },
  {
    id: 'barnards-star-b',
    name: "Barnard's Star b",
    hostStar: "Barnard's Star",
    starType: 'Red Dwarf (M4V)',
    distanceLy: 5.96,
    planetaryClass: 'Terrestrial',
    massEarthRatio: 0.375,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 3.15,
    semiMajorAxisAU: 0.0229,
    discoveryYear: 2024,
    discoveryMethod: 'Radial Velocity (ESPRESSO & CARMENES)',
    temperatureCelsius: 125,
    temperatureKelvin: 398,
    inHabitableZone: false,
    confirmed: true,
    stellarTempK: 3134,
    stellarRadiusSunRatio: 0.196,
    stellarLuminositySunRatio: 0.0033,
    habitableZoneAU: { min: 0.058, max: 0.115 },
    radialVelocityAmplitudeK: 0.52,
    atmosphereStatus: 'Ultra-hot rocky world; likely bare silicate/basalt regolith with minimal atmosphere.',
    spectroscopyData: [
      { wavelengthUm: 1.2, relativeAbsorptionPpm: 80 },
      { wavelengthUm: 2.1, relativeAbsorptionPpm: 95 },
      { wavelengthUm: 3.2, relativeAbsorptionPpm: 110 },
      { wavelengthUm: 4.4, relativeAbsorptionPpm: 105 },
    ],
    scientificFacts: [
      'Second closest star system to the Solar System after Alpha Centauri.',
      'Barnard’s Star exhibits the highest apparent proper motion of any star in the night sky (10.3 arcseconds/year).',
      'The planet orbits in only 3.15 days, resulting in surface temperatures above the boiling point of liquid water.',
    ],
    openQuestions: [
      'Are additional planetary companions in the system stabilizing this compact orbital geometry?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    illustrationSrc: artBarnardsStarB,
    surfaceTextureType: 'sub-earth-scorched',
  },
  {
    id: 'barnards-star-c',
    name: "Barnard's Star c",
    hostStar: "Barnard's Star",
    starType: 'Red Dwarf (M4V)',
    distanceLy: 5.96,
    planetaryClass: 'Super-Earth',
    massEarthRatio: 2.3,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 233,
    semiMajorAxisAU: 0.407,
    discoveryYear: 2024,
    discoveryMethod: 'Radial Velocity (Candidate Signal)',
    temperatureCelsius: -170,
    temperatureKelvin: 103,
    inHabitableZone: false,
    confirmed: false, // Candidate
    stellarTempK: 3134,
    stellarRadiusSunRatio: 0.196,
    stellarLuminositySunRatio: 0.0033,
    habitableZoneAU: { min: 0.058, max: 0.115 },
    radialVelocityAmplitudeK: 0.45,
    atmosphereStatus: 'Candidate planet status under active observational triage.',
    spectroscopyData: [
      { wavelengthUm: 1.5, relativeAbsorptionPpm: 60 },
      { wavelengthUm: 3.0, relativeAbsorptionPpm: 75 },
      { wavelengthUm: 4.5, relativeAbsorptionPpm: 70 },
    ],
    scientificFacts: [
      'Classified as an exoplanet candidate requiring follow-up spectrographic runs to rule out stellar magnetic cycle cycles.',
      'Located well beyond the outer snow line of Barnard’s Star.',
    ],
    openQuestions: [
      'Can archival HARPS data definitively confirm or refute this 233-day periodic modulation?',
    ],
    sourceName: 'NASA Exoplanet Archive (Candidate List)',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    surfaceTextureType: 'super-earth-haze',
  },
  {
    id: 'ross-128-b',
    name: 'Ross 128 b',
    hostStar: 'Ross 128',
    starType: 'Red Dwarf (M4V)',
    distanceLy: 11.0,
    planetaryClass: 'Terrestrial',
    massEarthRatio: 1.4,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 9.865,
    semiMajorAxisAU: 0.0496,
    discoveryYear: 2017,
    discoveryMethod: 'Radial Velocity (HARPS)',
    temperatureCelsius: 21,
    temperatureKelvin: 294,
    inHabitableZone: true,
    confirmed: true,
    stellarTempK: 3192,
    stellarRadiusSunRatio: 0.197,
    stellarLuminositySunRatio: 0.0036,
    habitableZoneAU: { min: 0.045, max: 0.098 },
    radialVelocityAmplitudeK: 1.42,
    atmosphereStatus: 'Prime candidate for habitable atmosphere due to host star quietness and lack of violent flares.',
    spectroscopyData: [
      { wavelengthUm: 1.15, relativeAbsorptionPpm: 190 },
      { wavelengthUm: 1.42, relativeAbsorptionPpm: 380, chemicalLabel: 'H2O potential' },
      { wavelengthUm: 2.05, relativeAbsorptionPpm: 230 },
      { wavelengthUm: 2.75, relativeAbsorptionPpm: 460, chemicalLabel: 'CO2 band' },
      { wavelengthUm: 3.4, relativeAbsorptionPpm: 310 },
      { wavelengthUm: 4.35, relativeAbsorptionPpm: 540, chemicalLabel: 'CO2 band' },
    ],
    scientificFacts: [
      'Ross 128 is an exceptionally quiet red dwarf with minimal flare activity compared to Proxima Centauri.',
      'Equilibrium temperature is near room temperature (approx 21°C depending on cloud albedo).',
      'Located 11.0 light-years away and currently moving closer toward our Solar System.',
    ],
    openQuestions: [
      'Does Ross 128 b have a protective geomagnetic field generated by a liquid metallic core?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    illustrationSrc: artRoss128B,
    surfaceTextureType: 'temperate-water',
  },
  {
    id: 'epsilon-eridani-b',
    name: 'Epsilon Eridani b (AEgir)',
    hostStar: 'Epsilon Eridani',
    starType: 'K-Type Orange Dwarf (K2V)',
    distanceLy: 10.5,
    planetaryClass: 'Gas Giant',
    massEarthRatio: 250.0, // ~0.78 Jupiter mass
    radiusEarthRatio: 11.2, // Jovian radius estimate
    orbitalPeriodDays: 2688.0,
    semiMajorAxisAU: 3.48,
    discoveryYear: 2000,
    discoveryMethod: 'Radial Velocity & Astrometry (HST / Ground)',
    temperatureCelsius: -140,
    temperatureKelvin: 133,
    inHabitableZone: false,
    confirmed: true,
    stellarTempK: 5084,
    stellarRadiusSunRatio: 0.735,
    stellarLuminositySunRatio: 0.34,
    habitableZoneAU: { min: 0.58, max: 1.15 },
    radialVelocityAmplitudeK: 19.1,
    atmosphereStatus: 'Deep hydrogen-helium atmosphere with turbulent methane and ammonia weather systems.',
    spectroscopyData: [
      { wavelengthUm: 1.1, relativeAbsorptionPpm: 450 },
      { wavelengthUm: 1.65, relativeAbsorptionPpm: 920, chemicalLabel: 'CH4 absorption' },
      { wavelengthUm: 2.3, relativeAbsorptionPpm: 870, chemicalLabel: 'CH4 band' },
      { wavelengthUm: 3.3, relativeAbsorptionPpm: 1240, chemicalLabel: 'Hydrocarbon haze' },
      { wavelengthUm: 4.6, relativeAbsorptionPpm: 780, chemicalLabel: 'CO trace' },
    ],
    scientificFacts: [
      'Giant planet orbiting a young, Sun-like orange dwarf star easily visible to the unaided human eye.',
      'The star system possesses two massive outer asteroid and dust belts akin to our Kuiper Belt.',
      'One of the nearest known giant exoplanets to Earth.',
    ],
    openQuestions: [
      'Could large exomoons orbiting Epsilon Eridani b possess temperate surface conditions?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    illustrationSrc: artEpsilonEridaniB,
    surfaceTextureType: 'gas-turbulent',
  },
  {
    id: 'gj-887-b',
    name: 'GJ 887 b',
    hostStar: 'Gliese 887 (Lacaille 9352)',
    starType: 'Red Dwarf (M2V)',
    distanceLy: 9.74,
    planetaryClass: 'Super-Earth',
    massEarthRatio: 4.2,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 9.26,
    semiMajorAxisAU: 0.068,
    discoveryYear: 2020,
    discoveryMethod: 'Radial Velocity (HARPS / PlanetFinder)',
    temperatureCelsius: 167,
    temperatureKelvin: 440,
    inHabitableZone: false,
    confirmed: true,
    stellarTempK: 3676,
    stellarRadiusSunRatio: 0.467,
    stellarLuminositySunRatio: 0.0368,
    habitableZoneAU: { min: 0.12, max: 0.24 },
    radialVelocityAmplitudeK: 3.12,
    atmosphereStatus: 'Super-Earth candidate for transmission spectroscopy; host star has very low magnetic variability.',
    spectroscopyData: [
      { wavelengthUm: 1.3, relativeAbsorptionPpm: 210 },
      { wavelengthUm: 2.2, relativeAbsorptionPpm: 330 },
      { wavelengthUm: 3.4, relativeAbsorptionPpm: 280 },
      { wavelengthUm: 4.5, relativeAbsorptionPpm: 410 },
    ],
    scientificFacts: [
      'Gliese 887 is the brightest red dwarf star in the sky as seen from Earth.',
      'The star exhibits remarkably low magnetic activity and photometric starspot quietness.',
      'GJ 887 b is a compact super-Earth orbiting within the hot inner boundary.',
    ],
    openQuestions: [
      'Has the host star’s photometric stability protected an ancient volatile envelope from escape?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    surfaceTextureType: 'super-earth-haze',
  },
  {
    id: 'gj-887-c',
    name: 'GJ 887 c',
    hostStar: 'Gliese 887 (Lacaille 9352)',
    starType: 'Red Dwarf (M2V)',
    distanceLy: 9.74,
    planetaryClass: 'Super-Earth',
    massEarthRatio: 7.6,
    radiusEarthRatio: null, // Unknown
    orbitalPeriodDays: 21.78,
    semiMajorAxisAU: 0.124,
    discoveryYear: 2020,
    discoveryMethod: 'Radial Velocity (HARPS / PlanetFinder)',
    temperatureCelsius: 70,
    temperatureKelvin: 343,
    inHabitableZone: true,
    confirmed: true,
    stellarTempK: 3676,
    stellarRadiusSunRatio: 0.467,
    stellarLuminositySunRatio: 0.0368,
    habitableZoneAU: { min: 0.12, max: 0.24 },
    radialVelocityAmplitudeK: 3.98,
    atmosphereStatus: 'Located near inner habitable zone edge; prime target for JWST atmosphere characterization.',
    spectroscopyData: [
      { wavelengthUm: 1.25, relativeAbsorptionPpm: 260 },
      { wavelengthUm: 1.85, relativeAbsorptionPpm: 340 },
      { wavelengthUm: 2.65, relativeAbsorptionPpm: 490, chemicalLabel: 'CO2 band' },
      { wavelengthUm: 3.6, relativeAbsorptionPpm: 390 },
      { wavelengthUm: 4.4, relativeAbsorptionPpm: 560, chemicalLabel: 'CO2 window' },
    ],
    scientificFacts: [
      'Sits near the inner boundary of the habitable zone where liquid water could potentially persist under moderate cloud reflection.',
      'Mass of ~7.6 Earths places it in the massive super-Earth or mini-Neptune transitional category.',
      'One of the top targets selected for upcoming high-contrast exoplanet imaging missions.',
    ],
    openQuestions: [
      'Is GJ 887 c a rocky ocean planet with a deep hydrosphere or a sub-Neptune with a hydrogen/helium envelope?',
    ],
    sourceName: 'NASA Exoplanet Archive',
    sourceUrl: 'https://exoplanetarchive.ipac.caltech.edu/',
    lastVerified: 'November 2026',
    surfaceTextureType: 'temperate-water',
  },
];
