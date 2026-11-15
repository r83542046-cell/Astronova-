import imgApollo11 from '../assets/images/history_apollo_11_eagle_1794744500293.jpg';
import imgVoyager from '../assets/images/history_voyager_interstellar_1794744501093.jpg';
import imgIssSpacewalk from '../assets/images/history_iss_spacewalk_1794744501285.jpg';
import imgIngenuity from '../assets/images/history_perseverance_ingenuity_1794744500500.jpg';

export interface SpaceTravelEvent {
  id: string;
  title: string;
  year: number;
  dateStr: string;
  category: 'moon' | 'human-flight' | 'deep-space' | 'stations' | 'mars' | 'telescopes';
  spacecraft: string;
  crewOrAgency: string;
  summary: string;
  whatHappened: string[];
  keyQuote?: string;
  scientificBreakthrough: string;
  spaceflightPhysics: string;
  imageSrc?: string;
  sourceLabel: string;
  sourceUrl: string;
  telemetryLogs: {
    label: string;
    value: string;
    status: 'nominal' | 'critical' | 'alert' | 'historic';
  }[];
}

export interface SpaceTravelPhenomenon {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  astronautExperience: string;
  physicsExplanation: string;
  countermeasures: string;
  severity: 'high' | 'medium' | 'routine';
}

export const SPACE_TRAVEL_PHENOMENA: SpaceTravelPhenomenon[] = [
  {
    id: 'launch-g-forces',
    title: 'Launch Ascent & Extreme G-Forces',
    subtitle: 'Accelerating from 0 to 28,000 km/h in 510 seconds',
    description:
      'During rocket ascent, multi-stage solid and liquid propellant rocket engines generate millions of pounds of thrust, pushing astronauts deep into their contoured couches.',
    astronautExperience:
      'Astronauts experience up to 3G to 4.5G of acceleration. Your chest feels heavy, breathing requires conscious effort, and blood is pulled toward your spine. When the main engines cut off (MECO), gravity abruptly vanishes, and you instantly float in pure free-fall.',
    physicsExplanation:
      'Newton’s Second Law (F = ma): To escape Earth’s gravity well and reach low-Earth orbital velocity (7.8 km/s), the rocket must continuously accelerate, increasing the apparent gravitational load on everything inside.',
    countermeasures:
      'Crews lie in supine contoured couches with feet elevated so G-forces are directed chest-to-back (+Gx) rather than head-to-toe (+Gz), preventing visual greyout or blackout.',
    severity: 'high',
  },
  {
    id: 'space-adaptation-fluid-shift',
    title: 'Space Adaptation Syndrome & Fluid Shift',
    subtitle: 'The "Puffy Face, Bird Legs" effect in microgravity',
    description:
      'On Earth, gravity pulls approximately 2 liters of bodily fluids into your legs and lower body. In the microgravity of space, fluids redistribute evenly throughout the entire body.',
    astronautExperience:
      'Within hours of reaching orbit, astronauts notice their faces swell, nasal passages become congested like a head cold, and calf diameters shrink by up to 20%. The vestibular system in the inner ear becomes confused, causing 50–70% of crew members to experience space motion sickness during the first 48 hours.',
    physicsExplanation:
      'Without a 1G gravitational vector pulling bodily fluids downward, cardiovascular hydrostatic pressure equalizes, causing blood and extracellular fluid to migrate cephalad (towards the head).',
    countermeasures:
      'Astronauts use scopolamine patches, drink isotonic rehydration drinks, and adapt naturally within 3 to 5 days as the body sheds excess fluid volume.',
    severity: 'medium',
  },
  {
    id: 'cosmic-ray-phosphenes',
    title: 'Cosmic Ray Phosphenes & Radiation',
    subtitle: 'Seeing flashes of light with eyes closed in the dark',
    description:
      'Outside Earth’s protective atmospheric blanket and magnetosphere, space is permeated by high-energy Galactic Cosmic Rays (GCRs) and solar energetic protons.',
    astronautExperience:
      'When resting in their sleeping quarters with eyes closed, astronauts frequently report seeing bright white, blue, or yellow flashes, streaks, and stars. Apollo astronauts traveling to the Moon and ISS crews report these regular optical fireworks inside their eyeballs.',
    physicsExplanation:
      'Subatomic particles (relativistic iron ions, high-energy protons) traveling near the speed of light pass straight through the spacecraft hull, entering the human eye and generating Cherenkov radiation or direct ionization in the retinal photoreceptor cells.',
    countermeasures:
      'Spacecraft hulls use polyethylene and hydrogen-rich water wall shielding; storm shelters are maintained during severe Solar Particle Events (SPEs).',
    severity: 'high',
  },
  {
    id: 'atmospheric-reentry-plasma',
    title: 'Atmospheric Re-entry & Plasma Blackout',
    subtitle: '1,600°C Heat Shield Shockwave and Telemetry Loss',
    description:
      'Returning to Earth requires shedding orbital speed (28,000 km/h) or lunar return speed (40,000 km/h) solely through atmospheric friction and compression.',
    astronautExperience:
      'Looking through the capsule window, the blackness of space gives way to a blinding incandescent orange and violet fireball. The capsule shakes violently, deceleration forces ramp up to 4G–7G, and for 4 to 7 minutes all radio signals with Mission Control go dead.',
    physicsExplanation:
      'At hypersonic speeds (Mach 25), the air in front of the blunt heat shield cannot move out of the way fast enough, undergoing extreme compression. Temperatures exceed 1,600°C (3,000°F), stripping electrons from air molecules and creating an electrically conductive sheath of ionized plasma that blocks all electromagnetic radio waves.',
    countermeasures:
      'Ablative heat shields (PICA-X, Avcoat) slowly melt and vaporize in a controlled manner, carrying heat away from the crew capsule before parachutes deploy at 3,000 meters altitude.',
    severity: 'high',
  },
  {
    id: 'orbital-spacewalk-extremes',
    title: 'Spacewalk Thermal Cycling & Vacuum Danger',
    subtitle: 'Swinging from +120°C in sunlight to -150°C in shadow every 45 minutes',
    description:
      'Conducting an Extravehicular Activity (EVA) places an astronaut inside a pressurized personal spacecraft with nothing between them and the hostile vacuum of space.',
    astronautExperience:
      'Every 45 minutes as the spacecraft orbits Earth, the Sun abruptly drops behind the horizon. The temperature drops instantly by over 270°C. Fingertips get chilly, and the gold-coated visor must be adjusted to see in blinding direct sunlight versus orbital darkness.',
    physicsExplanation:
      'In a vacuum, there is no air to conduct heat or produce atmospheric twilight. Heat is transferred solely by direct solar radiation and infrared emission into deep space (2.7 Kelvin).',
    countermeasures:
      'The Extravehicular Mobility Unit (EMU) features a Liquid Cooling and Ventilation Garment (LCVG) pumping chilled water through 90 meters of tiny tubes, coupled with 14 layers of aluminized mylar and Kevlar insulation.',
    severity: 'high',
  },
];

export const SPACE_TRAVEL_EVENTS: SpaceTravelEvent[] = [
  {
    id: 'event-apollo-11',
    title: 'Apollo 11: Humanity’s First Steps on the Moon',
    year: 1969,
    dateStr: 'July 20, 1969',
    category: 'moon',
    spacecraft: 'Lunar Module Eagle / Saturn V',
    crewOrAgency: 'Neil Armstrong, Buzz Aldrin, Michael Collins (NASA)',
    summary:
      'The historic landing that fulfilled humanity’s dream of walking on another celestial body, overcoming critical computer alarms and boulder hazards with only seconds of fuel remaining.',
    whatHappened: [
      'During lunar descent at 33,000 feet, the Apollo Guidance Computer flashed unexpected "1202" and "1208" program alarms as rendezvous radar data overloaded memory buffers. Flight controller Steve Bales confirmed the computer was prioritizing thruster commands and called: "We’re GO on that alarm!"',
      'At 500 feet altitude, Commander Neil Armstrong realized the automated autopilot was guiding Eagle into a hazardous boulder-strewn crater field the size of a football stadium (West Crater). Armstrong took semi-manual attitude control, pitched the lander forward, and flew horizontally to find smooth ground.',
      'Inside the cockpit, Buzz Aldrin called out altitude and descent velocity ("Forward, forward, 40 feet, down two and a half..."). In Houston, CapCom Charlie Duke listened as fuel timers counted down past the 60-second "bingo fuel" mark.',
      'At 102 hours, 45 minutes mission elapsed time, contact probes beneath the footpads touched the lunar soil. Armstrong throttled down the descent engine, and radioed: "Houston, Tranquility Base here. The Eagle has landed."',
      'Six hours later, Armstrong lowered the ladder and stepped onto the lunar surface: "That’s one small step for man, one giant leap for mankind."',
    ],
    keyQuote: 'Houston, Tranquility Base here. The Eagle has landed.',
    scientificBreakthrough:
      'Returned 21.55 kg of lunar regolith and rock samples; proved the Moon was formed 4.5 billion years ago; deployed the Laser Ranging Retroreflector (LRRR) that still measures the Moon’s distance from Earth today to within millimeters.',
    spaceflightPhysics:
      'Mastered lunar orbit rendezvous (LOR), variable-thrust descent engine throttling in 1/6th gravity, and translunar injection burns.',
    imageSrc: imgApollo11,
    sourceLabel: 'NASA History Division · Apollo 11 Mission Log',
    sourceUrl: 'https://www.nasa.gov/mission/apollo-11/',
    telemetryLogs: [
      { label: 'Altitude', value: '0.00 m (Surface Touchdown)', status: 'historic' },
      { label: 'Fuel Remaining', value: '25 seconds descent reserve', status: 'critical' },
      { label: 'AGC Status', value: '1202 Executive Overflow Cleared', status: 'nominal' },
      { label: 'Location', value: 'Sea of Tranquility (0.67° N, 23.47° E)', status: 'nominal' },
    ],
  },
  {
    id: 'event-vostok-1',
    title: 'Vostok 1: Yuri Gagarin Becomes First Human in Space',
    year: 1961,
    dateStr: 'April 12, 1961',
    category: 'human-flight',
    spacecraft: 'Vostok 3KA (Vostok 1)',
    crewOrAgency: 'Yuri Gagarin (Soviet Space Program)',
    summary:
      'The dawn of human spaceflight: a single 108-minute orbit around Earth that proved human beings could survive and function in the weightlessness of space.',
    whatHappened: [
      'At 06:07 UTC, the 287-ton R-7 rocket ignited at Baikonur Cosmodrome. Gagarin famously cheered over the radio: "Поехали!" ("Poyekhali!" / "Let’s go!").',
      'Accelerating up to 5G, Vostok 1 reached orbital velocity of 28,260 km/h and entered an elliptical low-Earth orbit with an apogee of 327 km.',
      'Gagarin consumed paste from aluminum tubes, tested speaking, wrote notes, and marveled at the view: "I see Earth in the haze of clouds. It’s blue, it’s so beautiful!"',
      'During re-entry over Africa, the equipment module failed to separate cleanly from the spherical descent capsule, bound together by an umbilical wire bundle. The combined craft began wild gyrations and tumbling at 8G until atmospheric friction burned through the wires, allowing the heat shield to orient itself forward.',
      'At 7 km altitude, Gagarin safely ejected from the capsule and parachuted to safety in a rural potato field near Engels, USSR.',
    ],
    keyQuote: 'Poyekhali! The earth is blue. How wonderful. It is amazing.',
    scientificBreakthrough:
      'First empirical confirmation that human cardiovascular, neurological, and perceptual systems can function normally in microgravity.',
    spaceflightPhysics:
      'First achievement of First Cosmic Velocity (7.9 km/s orbital insertion speed) and blunt-body aerodynamic re-entry.',
    sourceLabel: 'NASA History · Vostok 1 60th Anniversary',
    sourceUrl: 'https://www.nasa.gov/history/60-years-ago-yuri-gagarin-becomes-the-first-person-in-space/',
    telemetryLogs: [
      { label: 'Mission Duration', value: '108 minutes (1 full Earth orbit)', status: 'historic' },
      { label: 'Max Altitude (Apogee)', value: '327.0 km', status: 'nominal' },
      { label: 'Orbital Speed', value: '28,260 km/h (7.85 km/s)', status: 'nominal' },
      { label: 'Re-entry G-Load', value: '8.0 G Peak Deceleration', status: 'critical' },
    ],
  },
  {
    id: 'event-apollo-13',
    title: 'Apollo 13: "Houston, We’ve Had a Problem"',
    year: 1970,
    dateStr: 'April 13–17, 1970',
    category: 'moon',
    spacecraft: 'Odyssey (Command Module) & Aquarius (Lunar Module)',
    crewOrAgency: 'Jim Lovell, Jack Swigert, Fred Haise (NASA)',
    summary:
      'An oxygen tank explosion 200,000 miles from Earth turned a lunar landing into history’s greatest space rescue, using the Lunar Module as a cosmic lifeboat.',
    whatHappened: [
      'At 55 hours, 55 minutes into the flight, Jack Swigert flipped the switch to stir the cryogenic oxygen tanks in the Service Module. An exposed wire ignited Teflon insulation, causing Oxygen Tank 2 to violently explode and blow off an entire exterior hull panel.',
      'Commander Jim Lovell looked out the hatch window and saw a cloud of gas venting into the blackness: "We are venting something out into the- into the stars... It’s a gas of some sort." The Command Module was losing all electricity, oxygen, and drinking water.',
      'Flight Director Gene Kranz and his Tiger Team ordered the crew to power down the dying Command Module Odyssey and evacuate into the two-man Lunar Module Aquarius to use it as a lifeboat.',
      'Aquarius was designed to keep two men alive on the Moon for 45 hours, but now had to sustain three men for nearly 90 hours. Temperatures plummeted to 3°C (38°F), water froze in tubes, and carbon dioxide levels rose to toxic levels.',
      'Engineers on the ground used plastic bags, flight manual cardboard covers, and grey duct tape to invent a square-to-round adapter ("the mailbox") so Command Module CO2 scrubbers could work inside the Lunar Module.',
      'Firing Aquarius’s descent engine in critical free-return burns, Apollo 13 looped around the far side of the Moon and safely splashed down in the Pacific Ocean on April 17.',
    ],
    keyQuote: 'Houston, we’ve had a problem here.',
    scientificBreakthrough:
      'Revolutionized spacecraft redundancy, dual-redundant cryogenic wiring, crisis engineering management, and free-return orbital trajectories.',
    spaceflightPhysics:
      'Leveraged lunar gravity assist trajectory calculations to sling the crippled spacecraft back toward Earth without major engine firings.',
    sourceLabel: 'NASA History · Apollo 13 Flight Log',
    sourceUrl: 'https://www.nasa.gov/mission/apollo-13/',
    telemetryLogs: [
      { label: 'Distance from Earth', value: '321,860 km (200,000 miles)', status: 'alert' },
      { label: 'O2 Tank 2 Pressure', value: '0 psi (Catastrophic Rupture)', status: 'critical' },
      { label: 'LM Cabin Temperature', value: '3.3°C (Near Freezing)', status: 'alert' },
      { label: 'Outcome', value: '100% Crew Survival & Safe Splashdown', status: 'historic' },
    ],
  },
  {
    id: 'event-voyager',
    title: 'Voyager 1 & 2: The Grand Tour & Interstellar Crossing',
    year: 1977,
    dateStr: 'August–September 1977',
    category: 'deep-space',
    spacecraft: 'Voyager 1 & Voyager 2 / Titan IIIE-Centaur',
    crewOrAgency: 'NASA Jet Propulsion Laboratory (JPL)',
    summary:
      'Twin robotic explorers that toured the outer giant planets, carried humanity’s Golden Record, and became the first human-made objects to enter interstellar space.',
    whatHappened: [
      'Launched in 1977 to take advantage of a rare planetary alignment occurring once every 175 years, allowing spacecraft to slingshot from Jupiter to Saturn, Uranus, and Neptune using gravity assists.',
      'Voyager discovered active sulfur volcanoes on Jupiter’s moon Io (the first active volcanoes outside Earth), intricate shepherd moons and spokes in Saturn’s rings, nitrogen geysers on Neptune’s moon Triton, and mysterious cracks across Jupiter’s ice moon Europa.',
      'On February 14, 1990, at Carl Sagan’s request, Voyager 1 turned its camera back toward the inner Solar System and took the "Family Portrait", capturing Earth as a tiny "Pale Blue Dot" suspended in a sunbeam 6 billion kilometers away.',
      'On August 25, 2012, at a distance of 121 AU (18 billion km), Voyager 1 detected a sharp drop in solar wind particles and a dramatic surge in galactic cosmic rays, officially crossing the heliopause into true interstellar space.',
      'Powered by radioisotope thermoelectric generators (RTGs), both Voyagers continue communicating with NASA’s Deep Space Network over 47 years later.',
    ],
    keyQuote: 'Look again at that dot. That’s here. That’s home. That’s us.',
    scientificBreakthrough:
      'First in-situ measurements of interstellar plasma density; discovered ocean world prospects on Europa and Enceladus; provided first close-ups of all four outer giant planets.',
    spaceflightPhysics:
      'Demonstrated multi-body gravitational slingshot orbital mechanics and long-range high-frequency microwave communications across light-hours of distance.',
    imageSrc: imgVoyager,
    sourceLabel: 'NASA JPL · Voyager Interstellar Mission',
    sourceUrl: 'https://voyager.jpl.nasa.gov/',
    telemetryLogs: [
      { label: 'Distance from Earth', value: 'Over 24 billion km (162 AU)', status: 'historic' },
      { label: 'Signal Travel Time', value: '22 hours, 35 minutes each way', status: 'nominal' },
      { label: 'Operating Lifespan', value: '47+ Years Continuous Flight', status: 'nominal' },
      { label: 'Current Sector', value: 'Interstellar Medium (Beyond Heliopause)', status: 'historic' },
    ],
  },
  {
    id: 'event-iss',
    title: 'International Space Station: 25+ Years of Human Life in Orbit',
    year: 1998,
    dateStr: 'November 20, 1998 – Present',
    category: 'stations',
    spacecraft: 'Zarya, Unity, Destiny, Columbus, Kibo, Cupola modules',
    crewOrAgency: 'NASA, ESA, JAXA, CSA, Roscosmos (21 Participating Nations)',
    summary:
      'The largest, most complex international engineering construction in human history, continuously occupied by astronauts since November 2000.',
    whatHappened: [
      'Assembled piece-by-piece over more than 40 assembly flights in low-Earth orbit, traveling at 28,000 km/h (17,500 mph) and weighing 450 metric tons.',
      'Astronauts witness 16 sunrises and sunsets every 24 hours as the station circles Earth every 90 minutes at an altitude of approximately 408 kilometers.',
      'Crews conduct over 3,000 scientific investigations in microgravity spanning protein crystal growth, macular degeneration, cancer immunotherapy, quantum Bose-Einstein condensates, and closed-loop water recycling (reclaiming 98% of water from sweat and urine).',
      'Over 270 astronauts have lived aboard the station, logging thousands of hours of spacewalks, maintenance repairs, and robotic Canadarm2 operations.',
    ],
    keyQuote: 'The ISS is living proof that global cooperation can overcome any earthly division.',
    scientificBreakthrough:
      'Developed bone-loss prevention protocols for deep-space flight; perfected closed-loop environmental control life support systems (ECLSS); advanced microgravity material sciences.',
    spaceflightPhysics:
      'Orbital maintenance via periodic reboost burns to counteract upper-atmospheric aerodynamic drag; precision high-speed automated docking.',
    imageSrc: imgIssSpacewalk,
    sourceLabel: 'NASA International Space Station Research',
    sourceUrl: 'https://www.nasa.gov/international-space-station/',
    telemetryLogs: [
      { label: 'Orbital Velocity', value: '27,600 km/h (7.66 km/s)', status: 'nominal' },
      { label: 'Orbital Period', value: '92.9 minutes per revolution', status: 'nominal' },
      { label: 'Continuous Habitation', value: 'Since Nov 2, 2000 (>24 years)', status: 'historic' },
      { label: 'Solar Array Wingspan', value: '109 meters (full football field)', status: 'nominal' },
    ],
  },
  {
    id: 'event-perseverance-ingenuity',
    title: 'Perseverance & Ingenuity: First Powered Flight on Mars',
    year: 2021,
    dateStr: 'February 18, 2021 – Present',
    category: 'mars',
    spacecraft: 'Mars 2020 Perseverance Rover & Ingenuity Helicopter',
    crewOrAgency: 'NASA JPL (Jet Propulsion Laboratory)',
    summary:
      'The autonomous landing of a 1-ton nuclear astrobiology rover via Sky Crane and the historic first aerodynamic rotorcraft flight through Mars’ ultra-thin atmosphere.',
    whatHappened: [
      'Perseverance entered Mars’ atmosphere at 19,500 km/h (12,100 mph). Using Terrain-Relative Navigation (TRN), onboard cameras matched ground crater patterns to dodge cliffs and sand dunes during the harrowing "Seven Minutes of Terror".',
      'At 20 meters above the red dirt, the rocket-powered Sky Crane descent stage lowered the rover to the ground on 6.4-meter nylon tethers before severing the cables and flying away.',
      'On April 19, 2021, the 1.8-kg Ingenuity Mars Helicopter spun its counter-rotating carbon-fiber blades at 2,400 RPM—five times faster than an Earth helicopter—to bite into the Martian atmosphere, which is only 1% as dense as Earth’s air.',
      'Ingenuity ascended to 3 meters, hovered steadily, and touched back down, achieving the first powered, controlled flight on another world (an "extraterrestrial Wright Brothers moment").',
      'Originally designed for just 5 demonstration flights, Ingenuity completed an astonishing 72 flights across 3 years, serving as an aerial scout for Perseverance.',
    ],
    keyQuote: 'Ingenuity has performed its first flight — the first flight of a powered aircraft on another planet!',
    scientificBreakthrough:
      'Collected and sealed 24+ sedimentary rock core samples in sterile titanium tubes for future Mars Sample Return; proved aerodynamical flight in ultra-low pressure environments.',
    spaceflightPhysics:
      'Extreme high-speed rotor aerodynamics in carbon dioxide gas at 0.006 bar surface pressure; autonomous computer vision navigation with 15-minute Earth communication latency.',
    imageSrc: imgIngenuity,
    sourceLabel: 'NASA Mars Exploration · Perseverance & Ingenuity',
    sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    telemetryLogs: [
      { label: 'Ingenuity Total Flights', value: '72 completed flights', status: 'historic' },
      { label: 'Rotor RPM', value: '2,400 – 2,700 RPM', status: 'nominal' },
      { label: 'Atmospheric Density', value: '~1% of Earth Sea Level', status: 'alert' },
      { label: 'Radio Signal Lag', value: '11 to 22 minutes (Roundtrip)', status: 'nominal' },
    ],
  },
  {
    id: 'event-jwst',
    title: 'James Webb Space Telescope: Unfolding the Cosmic Dawn',
    year: 2021,
    dateStr: 'December 25, 2021',
    category: 'telescopes',
    spacecraft: 'Ariane 5 / James Webb Space Telescope (JWST)',
    crewOrAgency: 'NASA, ESA, Canadian Space Agency (CSA)',
    summary:
      'Humanity’s premier deep-space infrared observatory, navigating a high-stakes 30-day journey to Sun-Earth Lagrange Point 2 and deploying a 6.5-meter gold-plated honeycomb mirror.',
    whatHappened: [
      'Launched on Christmas Day 2021 from Kourou, French Guiana, on an Ariane 5 rocket with flawless trajectory precision that preserved extra onboard propellant for 20+ years of science operations.',
      'Because JWST was too large to fit in any rocket fairing, it was folded like high-tech origami with 344 single-point failure mechanisms that all had to execute flawlessly.',
      'During its 1.5-million-kilometer journey to Lagrange Point 2 (L2), controllers unfolded the tennis-court-sized 5-layer Kapton sunshield that keeps the mirrors cooled to -233°C (-388°F).',
      'Controllers individually aligned all 18 beryllium mirror segments coated with a microscopic 100-nanometer layer of pure gold to within a fraction of a wavelength of light.',
      'JWST opened humanity’s eyes to the earliest galaxies formed just 300 million years after the Big Bang, and detected atmospheric carbon dioxide and water vapor on distant exoplanets.',
    ],
    keyQuote: 'Webb is an exceptional feat of engineering and international collaboration that rewrites cosmic history.',
    scientificBreakthrough:
      'Observed earliest proto-galaxies in the cosmic dark ages; provided first transmission spectroscopy detections of CO2 and sulfur dioxide on exoplanets.',
    spaceflightPhysics:
      'Stationkeeping at Sun-Earth L2 halo orbit; cryogenic passive thermal dissipation using multi-layer radiative sunshields.',
    sourceLabel: 'NASA Goddard Space Flight Center · JWST Mission',
    sourceUrl: 'https://science.nasa.gov/mission/webb/',
    telemetryLogs: [
      { label: 'Orbital Location', value: 'Sun-Earth L2 (1.5 million km from Earth)', status: 'historic' },
      { label: 'Cold Side Temp', value: '37 Kelvin (-236°C / -393°F)', status: 'nominal' },
      { label: 'Primary Mirror Size', value: '6.5 meters (18 Gold Segments)', status: 'nominal' },
      { label: 'Single Points of Failure', value: '344/344 Deployed Successfully', status: 'historic' },
    ],
  },
  {
    id: 'event-artemis',
    title: 'Artemis Program: Returning Humanity to the Moon & Mars',
    year: 2024,
    dateStr: '2024–2026+',
    category: 'moon',
    spacecraft: 'Space Launch System (SLS) & Orion Spacecraft',
    crewOrAgency: 'NASA, ESA, JAXA, CSA, Commercial & International Partners',
    summary:
      'The modern lunar exploration campaign to land the first woman and first person of color on the Moon and build permanent infrastructure at the lunar South Pole.',
    whatHappened: [
      'Artemis I proved the massive Space Launch System (SLS)—generating 8.8 million pounds of thrust—and sent an uncrewed Orion spacecraft 432,000 km from Earth, farther than any human-rated spacecraft in history.',
      'Orion survived a violent skip-reentry into Earth’s atmosphere at Mach 32 (40,000 km/h), withstanding 2,800°C temperatures on its advanced heat shield.',
      'Artemis II will launch four astronauts on a 10-day translunar flyby mission around the far side of the Moon.',
      'Artemis III and IV target the permanently shadowed craters of the lunar South Pole, where billions of tons of water ice are frozen in perpetual darkness, vital for making rocket fuel (liquid hydrogen and liquid oxygen) for future voyages to Mars.',
    ],
    keyQuote: 'We are returning to the Moon for scientific discovery, economic benefits, and inspiration for a new generation.',
    scientificBreakthrough:
      'Harvesting volatile water ice in lunar cold traps for in-situ resource utilization (ISRU); proving deep-space radiation life support.',
    spaceflightPhysics:
      'Lunar South Pole precision descent trajectories, cislunar orbital mechanics (Near-Rectilinear Halo Orbits / NRHO), and deep space communications.',
    sourceLabel: 'NASA Artemis Program',
    sourceUrl: 'https://www.nasa.gov/artemis-program/',
    telemetryLogs: [
      { label: 'SLS Liftoff Thrust', value: '8.8 million lbs (15% more than Saturn V)', status: 'nominal' },
      { label: 'Max Distance Achieved', value: '432,210 km (Artemis I Record)', status: 'historic' },
      { label: 'Target Destination', value: 'Lunar South Pole Shackleton Crater', status: 'nominal' },
      { label: 'ISRU Objective', value: 'Water Ice Mining for H2/O2 Rocket Fuel', status: 'nominal' },
    ],
  },
];

export interface SpaceTravelProblem {
  id: string;
  title: string;
  mission: string;
  year: number;
  criticality: 'life-threatening' | 'mission-critical' | 'hardware-failure';
  alarmCode: string;
  subsystem: string;
  rootCause: string;
  immediateDanger: string;
  emergencySolution: string;
  radioQuote: string;
  reformAndPrevention: string;
  interactiveChallengeQuestion: string;
  interactiveChallengeOptions: string[];
  interactiveCorrectIndex: number;
  interactiveExplanation: string;
}

export const SPACE_TRAVEL_PROBLEMS: SpaceTravelProblem[] = [
  {
    id: 'problem-apollo-13-explosion',
    title: 'Cryogenic Oxygen Tank Explosion',
    mission: 'Apollo 13',
    year: 1970,
    criticality: 'life-threatening',
    alarmCode: 'MAIN BUS B UNDERVOLT / O2 TANK 2 PRESS: 0 PSI',
    subsystem: 'Cryogenic Electrical Power & Life Support (Service Module)',
    rootCause:
      'Damaged Teflon wire insulation sparked when a routine heater fan stir was commanded, causing Tank 2 to violently rupture and blow off an entire exterior hull panel.',
    immediateDanger:
      'Total loss of electricity, water generation, and breathable oxygen 320,000 km from Earth with three astronauts aboard.',
    emergencySolution:
      'Shut down the dying Command Module Odyssey and evacuate crew into the two-man Lunar Module Aquarius to use it as a lifeboat; built the "mailbox" CO2 scrubber adapter out of flight manual covers and grey duct tape; executed critical free-return burns around the far side of the Moon.',
    radioQuote: 'Houston, we’ve had a problem here. We are venting something out into the stars...',
    reformAndPrevention:
      'Redesigned oxygen tanks with third redundant tank, removed immersion heater switches, and isolated all internal wiring in non-combustible conduits.',
    interactiveChallengeQuestion: 'When the Apollo 13 Command Module lost power and oxygen, what was the crew’s life-saving strategy?',
    interactiveChallengeOptions: [
      'Perform an immediate U-turn burn using the Command Module main engine',
      'Power down the Command Module and use the Lunar Module Aquarius as a lifeboat',
      'Vent all nitrogen into space and wait for a rescue shuttle'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'The Lunar Module had its own batteries, oxygen supply, and descent engine, keeping the crew alive for 4 days until splashdown.',
  },
  {
    id: 'problem-apollo-11-alarm',
    title: '1202 & 1208 Computer Overload & Boulder Hazard',
    mission: 'Apollo 11',
    year: 1969,
    criticality: 'life-threatening',
    alarmCode: 'PROGRAM ALARM 1202 / 1208 EXECUTIVE OVERFLOW',
    subsystem: 'Apollo Guidance Computer (AGC) & Radar Interface',
    rootCause:
      'Rendezvous radar switch was mistakenly left in AUTO mode, flooding the CPU with 12,800 unnecessary interrupts per second during lunar descent.',
    immediateDanger:
      'If the computer crashed, throttle and attitude control would be lost, causing Eagle to plummet into the Moon. Simultaneously, autopilot was steering toward a giant boulder field.',
    emergencySolution:
      'Margaret Hamilton’s asynchronous priority architecture dropped radar processing to keep thruster commands running; 26-year-old Steve Bales called "GO on that alarm"; Neil Armstrong grabbed manual control to fly past West Crater with only 25s fuel left.',
    radioQuote: 'Program Alarm. It’s a 1202... Give us a reading on the 1202 Program Alarm.',
    reformAndPrevention:
      'Implemented hardware interlocks preventing unneeded radar telemetry from polling flight computers during critical landing burns.',
    interactiveChallengeQuestion: 'Why was the Apollo Guidance Computer able to survive the 1202 overload alarm without crashing?',
    interactiveChallengeOptions: [
      'Astronauts replaced the CPU circuit board mid-flight',
      'The software used priority scheduling to drop low-priority radar tasks and preserve thruster control',
      'Houston sent a reboot signal over radio in less than 2 seconds'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'Margaret Hamilton’s team designed asynchronous priority scheduling: when overloaded, the AGC dropped radar telemetry but kept calculating engine thrust.',
  },
  {
    id: 'problem-apollo-12-lightning',
    title: 'Dual Lightning Strike at Liftoff ("SCE to AUX")',
    mission: 'Apollo 12',
    year: 1969,
    criticality: 'life-threatening',
    alarmCode: 'TOTAL AC BUS DROP / GIMBAL LOCK / ALL WARNING LIGHTS',
    subsystem: 'Signal Conditioning Equipment (SCE) & Power Distribution',
    rootCause:
      'The Saturn V rocket’s ionized exhaust plume acted as a giant lightning conductor, drawing two atmospheric cloud-to-ground lightning strikes at T+36s and T+52s.',
    immediateDanger:
      'Fuel cells knocked off-line, telemetry scrambled into unintelligible nonsense, and the Range Safety Officer was seconds away from triggering rocket self-destruction.',
    emergencySolution:
      '24-year-old EECOM flight controller John Aaron recognized the scrambled telemetry signature from a test simulation and radioed: "Try SCE to AUX." Alan Bean flipped the switch, instantly restoring telemetry and resetting the fuel cells.',
    radioQuote: 'Try SCE to AUX. What the heck is that? SCE to AUX... NCE to AUX... Got it!',
    reformAndPrevention:
      'Strict launch weather constraints implemented prohibiting rocket launches within designated distances of anvil clouds or electrical charge gradients.',
    interactiveChallengeQuestion: 'What did flipping the "SCE to AUX" switch accomplish during the Apollo 12 lightning strike crisis?',
    interactiveChallengeOptions: [
      'It switched telemetry instruments to auxiliary power, restoring intelligible telemetry to Mission Control',
      'It discharged the lightning bolt safely into the ocean',
      'It jettisoned the Apollo launch escape tower'
    ],
    interactiveCorrectIndex: 0,
    interactiveExplanation: 'The Signal Conditioning Equipment (SCE) translates raw sensor voltages into telemetry; switching it to auxiliary restored telemetry so fuel cells could be safely restarted.',
  },
  {
    id: 'problem-gemini-8-spin',
    title: 'Thruster Stuck Open & 60 RPM Death Spin',
    mission: 'Gemini 8',
    year: 1966,
    criticality: 'life-threatening',
    alarmCode: 'UNCOMMANDED ROLL ACCELERATION > 60°/SEC',
    subsystem: 'Orbital Attitude and Maneuvering System (OAMS) Thruster #8',
    rootCause:
      'An electrical short-circuit jammed the solenoid valve on Roll Thruster #8, firing continuously and converting docking success into a violent spin.',
    immediateDanger:
      'Centrifugal force reached 1 revolution per second (60 RPM). Vision blurred, blood pooled in the astronauts’ brains, and unconsciousness and fatal stroke were imminent within seconds.',
    emergencySolution:
      'Neil Armstrong undocked from the Agena target, switched off the entire OAMS system, and fired the Re-entry Control System (RCS) thrusters to counteract the spin and stabilize the capsule, executing an emergency abort.',
    radioQuote: 'We have serious problems here... We’re tumbling end over end... We’re rolling up!',
    reformAndPrevention:
      'Isolated thruster electrical wiring and added independent circuit breakers for each individual maneuvering thruster.',
    interactiveChallengeQuestion: 'How did Neil Armstrong regain control of Gemini 8 when it was spinning at 1 revolution per second?',
    interactiveChallengeOptions: [
      'He manually crawled outside the capsule to disconnect the thruster',
      'He deactivated the maneuvering thrusters and fired the re-entry control thrusters to halt the spin',
      'He waited for orbital drag to slow down the capsule'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'Activating the Re-entry Control System (RCS) allowed Armstrong to counter the spin, though flight rules required an immediate emergency landing.',
  },
  {
    id: 'problem-voskhod-2-suit',
    title: 'Ballooning Spacesuit in Vacuum During First EVA',
    mission: 'Voskhod 2',
    year: 1965,
    criticality: 'life-threatening',
    alarmCode: 'SUIT RIGIDITY / AIRLOCK CLEARANCE ZERO',
    subsystem: 'Berkut Extravehicular Activity (EVA) Pressure Suit',
    rootCause:
      'In the hard vacuum of space, the internal atmospheric pressure caused the fabric spacesuit to balloon and stiffen like hard rubber.',
    immediateDanger:
      'Cosmonaut Alexei Leonov’s hands slipped out of his gloves, his boots detached from the soles, and his suit grew too swollen to fit through the 1.2-meter inflatable airlock hatch with minutes of oxygen remaining.',
    emergencySolution:
      'Without notifying ground control, Leonov opened an emergency bleed valve on his suit to lower pressure to 0.27 atmospheres (risking decompression sickness and hypoxia), squeezed through head-first, and contorted his body inside the tube to close the hatch.',
    radioQuote: 'I had to bleed the pressure down to get back inside the airlock.',
    reformAndPrevention:
      'Pioneered semi-rigid spacesuit architectures with mechanical joint bearings and low-pressure pure-oxygen pre-breathe protocols.',
    interactiveChallengeQuestion: 'What extreme risk did Alexei Leonov take to squeeze back into the airlock during the first spacewalk?',
    interactiveChallengeOptions: [
      'He vented his suit pressure down to 0.27 atm, risking fatal decompression sickness',
      'He cut his spacesuit tether and floated free',
      'He climbed through the rocket engine exhaust nozzle'
    ],
    interactiveCorrectIndex: 0,
    interactiveExplanation: 'Lowering suit pressure allowed the fabric to soften so he could bend his joints and fit through the hatch, risking the bends.',
  },
  {
    id: 'problem-hubble-mirror',
    title: 'The 2.2-Micrometer Spherical Mirror Aberration',
    mission: 'Hubble Space Telescope',
    year: 1990,
    criticality: 'hardware-failure',
    alarmCode: 'FOCAL PLANE COMA / SPHERICAL ABERRATION (0.5 WAVE RMS)',
    subsystem: '2.4-Meter Fused Silica Primary Mirror',
    rootCause:
      'During ground fabrication, a measuring tool called a Reflective Null Corrector had a 1.3-mm spacer washer installed upside down, causing the mirror edge to be polished 2.2 microns too flat.',
    immediateDanger:
      'Humanity’s flagship $1.5 billion space telescope produced blurry, unfocused halos around stars, unable to resolve deep cosmological targets.',
    emergencySolution:
      'In 1993, STS-61 Space Shuttle astronauts carried out 5 spacewalks to install COSTAR (a set of motorized coin-sized corrective mirrors) and the WFPC2 camera, acting like corrective glasses that restored crystal-clear sight.',
    radioQuote: 'One small step for man, one giant leap for Hubble! The pictures are magnificent.',
    reformAndPrevention:
      'Independent optical testing requirements mandated for all future space telescopes (including JWST cryogenic end-to-end vacuum testing).',
    interactiveChallengeQuestion: 'How did NASA fix the blurry primary mirror on the Hubble Space Telescope without bringing it back to Earth?',
    interactiveChallengeOptions: [
      'They sent astronauts to polish the mirror in orbit with diamond paste',
      'Astronauts installed corrective optics (COSTAR) in orbit that compensated for the mirror flaw',
      'They fired thrusters to change Hubble’s orbital focus'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'COSTAR and new cameras featured internal mirrors ground with the exact opposite optical prescription, perfectly counteracting the primary mirror flaw.',
  },
  {
    id: 'problem-mir-progress-collision',
    title: 'Progress Cargo Ship Collision & Hull Puncture',
    mission: 'Mir Space Station',
    year: 1997,
    criticality: 'life-threatening',
    alarmCode: 'RAPID PRESSURE DEPRESSURIZATION / HULL BREACH',
    subsystem: 'Spektr Science Module Pressure Hull',
    rootCause:
      'During a manual remote-controlled (TORU) docking test through cloud cover, the 7-ton uncrewed Progress M-34 spacecraft lost trajectory control and collided directly with Mir’s solar panels and Spektr module.',
    immediateDanger:
      'Spektr’s hull was punctured, venting breathable cabin air into the vacuum. Mir began violently depressurizing and lost 40% of its electrical power.',
    emergencySolution:
      'The crew severed thick cables passing through the module hatchway and slammed the heavy hatch shut to isolate the leaking Spektr module, saving the rest of the space station.',
    radioQuote: 'We felt a heavy blow and heard a sharp hiss of escaping air.',
    reformAndPrevention:
      'Automated optical proximity sensors, autonomous collision-avoidance abort burns, and quick-disconnect umbilical pass-throughs for multi-module stations.',
    interactiveChallengeQuestion: 'What immediate action saved the Mir Space Station after the Progress collision?',
    interactiveChallengeOptions: [
      'The crew quickly abandoned the station in the Soyuz capsule',
      'The cosmonauts severed cables and sealed the hatch to isolate the punctured Spektr module',
      'They injected liquid foam into the outer hull'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'Isolating the punctured Spektr module stopped the decompression and preserved breathable air for the rest of Mir.',
  },
  {
    id: 'problem-parmitano-water-leak',
    title: 'Spacesuit Helmet Water Leak & Zero-G Drowning',
    mission: 'ISS EVA 23',
    year: 2013,
    criticality: 'life-threatening',
    alarmCode: 'FAN PUMP SEPARATOR FAILURE / LIQUID IN VISOR',
    subsystem: 'Extravehicular Mobility Unit (EMU) Water Loop',
    rootCause:
      'Chemical contamination in the suit’s liquid cooling loop blocked a water separator fan, forcing 1.5 liters of water directly into the helmet ventilation duct.',
    immediateDanger:
      'In zero gravity, water surface tension caused the fluid to adhere to Luca Parmitano’s head, filling his ears, blinding his eyes, and covering his nostrils and mouth with no way to exhale or wipe it away.',
    emergencySolution:
      'Blind and unable to hear radio transmissions, Parmitano used his safety tether to feel his way back to the Quest airlock; partner Chris Cassidy and station crew repressed the chamber and stripped the helmet in record time.',
    radioQuote: 'My head is really wet and it’s increasing... It’s covering my eyes, ears, and nose.',
    reformAndPrevention:
      'Equipped all NASA EMU spacesuits with helmet absorption pads, a snorkel breathing tube, and redesigned centrifugal water separators.',
    interactiveChallengeQuestion: 'Why was a water leak inside an astronaut helmet during a spacewalk a lethal drowning hazard?',
    interactiveChallengeOptions: [
      'The water froze instantly into solid ice and shattered the visor',
      'In microgravity, water clings to skin and facial surfaces due to surface tension, blocking breathing and vision',
      'The water created an electrical short in the suit radio'
    ],
    interactiveCorrectIndex: 1,
    interactiveExplanation: 'Without gravity to pull water down, fluid clings to the face and creeps over the nose and mouth, creating a genuine zero-G drowning danger.',
  },
];

