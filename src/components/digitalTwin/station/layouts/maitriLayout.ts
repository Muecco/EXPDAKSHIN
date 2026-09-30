/**
 * DAKSHIN — MAITRI STATION LAYOUT MANIFEST (SINGLE SOURCE OF TRUTH)
 *
 * Every position used by the MAITRI 3D model, its sensor beacons, its
 * infrastructure nodes and its utility routes lives HERE. No other module may
 * hardcode a Maitri position — this removes the previous divergence where the
 * 3D scene, the digital-twin data service and the simulation engine each
 * carried their own, disagreeing coordinate tables.
 *
 * ── Reference-derived site plan (station-local metres, Y up) ───────────────
 * Origin (0,0,0) sits at the glazed knuckle module of the main complex.
 *   • Arm A — the long module block: 8 modules × 4.0 m running toward −X
 *     (x: 0 → −32), 3.6 m wide, deck top at y = 1.75 m, roof cap at y = 4.65 m.
 *   • Arm B — the short wing: 6 modules × 4.0 m running toward −Z
 *     (z: 0 → −24), giving the reference L-shaped footprint.
 *   • Glazed observation knuckle at the bend (the reference conservatory
 *     module) spanning ±2.2 m in X and Z.
 *   • External stair towers (orange/red) at the far end of Arm B, at the far
 *     end of Arm A, and at the tricolour module on Arm A's north facade.
 *   • Container fleet: 1 isolated unit beyond Arm B, a 5-unit cluster with the
 *     white-roofed unit to the west, 2 units in the foreground, plus the dark
 *     green waste container east of the knuckle.
 *   • Outbuildings: small white hut with pitched grey roof (west), second small
 *     shelter (far west, greywater treatment), utility plant house (east) with
 *     the conduit convergence hub, AWS mast (east).
 *   • Terrain: large frozen lake south-west, smaller open meltwater pond
 *     north-east, dirt tracks, a dark coal/gravel heap on the west shore,
 *     scattered boulders and snow patches over rocky scree.
 *
 * ALL CONDUIT ROUTES ARE DOCUMENTED APPROXIMATIONS for demonstration (see
 * `siteProvenance`). They follow the reference legend's six service types but
 * must never be presented as surveyed engineering layouts.
 *
 * Coordinates are single-eyeball estimates from the reference views — no
 * dimensions are published on them. Proportions are recorded as approximations.
 */

import type { StationLayout } from '../types';

// ---------------------------------------------------------------------------
// Footprint constants (shared by the geometry builders)
// ---------------------------------------------------------------------------

export const MAITRI_GEOMETRY = {
  /** Deck top height above ground (stilt undercarriage clearance). */
  deckY: 1.75,
  /** Module body height (deck → roof cap). */
  moduleHeight: 2.9,
  /** One prefabricated module length. */
  moduleLength: 4.0,
  /** Module / corridor width. */
  moduleWidth: 3.6,
  /** Module count per arm. */
  armAModules: 8,
  armBModules: 6,
  /** Roof cap height above ground. */
  roofY: 4.65,
  /** Glazed knuckle module half-size. */
  knuckleHalf: 2.2,
  /** X of the far end of Arm A (negative). */
  armAEndX: -32,
  /** Z of the far end of Arm B (negative). */
  armBEndZ: -24,
} as const;

const G = MAITRI_GEOMETRY;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const MAITRI_LAYOUT: StationLayout = {
  stationId: 'maitri',
  footprint: { lengthX: 62, depthZ: 46, heightY: 13 },

  // Indoor assets sit on the deck (group origin at deck level); outdoor assets
  // sit on the ground.
  assetPositions: {
    'GEN-01': [G.armAEndX + 5.0, G.deckY + 0.15, -0.9],
    'GEN-02': [G.armAEndX + 8.5, G.deckY + 0.15, -0.9],
    'BAT-01': [G.armAEndX + 13.0, G.deckY + 0.15, 0.9],
    'HEATER-01': [G.armAEndX + 18.0, G.deckY + 0.15, 0.9],
    'PUMP-01': [G.armAEndX + 23.0, G.deckY + 0.15, -0.9],
    'FUEL-01': [-37.0, 0.15, 11.0],
    'ENV-01': [9.0, 0.15, -9.0],
  },

  assetLabels: {
    'GEN-01': 'Primary Diesel Generator Set 01',
    'GEN-02': 'Secondary Diesel Generator Set 02',
    'BAT-01': 'Station DC Battery Bank',
    'FUEL-01': 'Aviation Turbine Fuel Farm',
    'PUMP-01': 'Hydronic Circulation Pump',
    'HEATER-01': 'Main Boiler Heat Exchanger',
    'ENV-01': 'Automatic Weather Station Mast',
  },

  // Beacons sit just above the roofline for indoor plant (always visible and
  // clickable from outside) and above ground level for outdoor plant.
  sensorBeacons: [
    { id: 'GEN-01', assetId: 'GEN-01', label: 'GEN-01 Generator Set 01', position: [G.armAEndX + 5.0, 5.5, -0.9], status: 'WARNING' },
    { id: 'GEN-02', assetId: 'GEN-02', label: 'GEN-02 Generator Set 02', position: [G.armAEndX + 8.5, 5.5, -0.9], status: 'NORMAL' },
    { id: 'BAT-01', assetId: 'BAT-01', label: 'BAT-01 Battery Bank', position: [G.armAEndX + 13.0, 5.5, 0.9], status: 'NORMAL' },
    { id: 'HEATER-01', assetId: 'HEATER-01', label: 'HEATER-01 Boiler Exchanger', position: [G.armAEndX + 18.0, 5.5, 0.9], status: 'NORMAL' },
    { id: 'PUMP-01', assetId: 'PUMP-01', label: 'PUMP-01 Circulation Pump', position: [G.armAEndX + 23.0, 5.5, -0.9], status: 'WARNING' },
    { id: 'FUEL-01', assetId: 'FUEL-01', label: 'FUEL-01 Fuel Farm', position: [-37.0, 3.2, 11.0], status: 'NORMAL' },
    { id: 'ENV-01', assetId: 'ENV-01', label: 'ENV-01 AWS Mast', position: [9.0, 6.4, -9.0], status: 'NORMAL' },
    { id: 'ROOF-MET', label: 'ROOF-MET Antenna Cluster', position: [-4.0, 6.4, 0.0], status: 'NORMAL' },
  ],

  infrastructureNodes: [
    {
      id: 'GENSET-HALL',
      name: 'Generator Hall (Arm A, seaward end)',
      category: 'primary',
      position: [G.armAEndX + 6.5, G.deckY, 0],
      connectedAssetIds: ['GEN-01', 'GEN-02'],
      description: 'Diesel generation bay with acoustic separation, fuel injection lines and exhaust risers.',
    },
    {
      id: 'PLANT-ROOM',
      name: 'Plant Room (Arm A)',
      category: 'primary',
      position: [G.armAEndX + 18.0, G.deckY, 0],
      connectedAssetIds: ['HEATER-01', 'PUMP-01', 'FUEL-01'],
      description: 'Boiler heat exchanger, hydronic circulation pumps and the heating-water distribution manifold.',
    },
    {
      id: 'BATTERY-ROOM',
      name: 'DC Battery Room (Arm A)',
      category: 'auxiliary',
      position: [G.armAEndX + 13.0, G.deckY, 0],
      connectedAssetIds: ['BAT-01'],
      description: 'Ventilated battery bay providing UPS buffer for the station power bus.',
    },
    {
      id: 'UTIL-PLANT',
      name: 'Utility Plant House & Conduit Hub',
      category: 'outbuilding',
      position: [7.0, 0, 7.0],
      connectedAssetIds: ['HEATER-01', 'PUMP-01', 'BAT-01'],
      description: 'External plant house where the service conduits converge — matches the reference pipeline view hub.',
    },
    {
      id: 'FUEL-FARM',
      name: 'Containerised Fuel Farm',
      category: 'outbuilding',
      position: [-37.0, 0, 11.0],
      connectedAssetIds: ['FUEL-01'],
      description: 'Bunded aviation turbine fuel storage with the west container cluster.',
    },
    {
      id: 'WATER-STORE',
      name: 'Potable Water Store (white hut)',
      category: 'outbuilding',
      position: [-36.0, 0, -2.0],
      connectedAssetIds: ['PUMP-01'],
      description: 'Pitched-roof white hut housing the potable water reserve and treatment plant.',
    },
    {
      id: 'TREATMENT',
      name: 'Greywater Treatment Shelter',
      category: 'outbuilding',
      position: [-44.0, 0, 2.0],
      connectedAssetIds: ['PUMP-01'],
      description: 'Far-west shelter receiving the greywater collection line.',
    },
    {
      id: 'COMMS-KNUCKLE',
      name: 'Roof Antenna Cluster & Comms Room',
      category: 'primary',
      position: [-4.0, G.roofY, 0],
      connectedAssetIds: ['ENV-01'],
      description: 'Antenna masts and dish above the glazed knuckle, feeding the station comms room.',
    },
    {
      id: 'AWS-MAST',
      name: 'Automatic Weather Station Mast',
      category: 'auxiliary',
      position: [9.0, 0, -9.0],
      connectedAssetIds: ['ENV-01'],
      description: 'Instrumented mast with anemometers, radiation shield and air-quality intake.',
    },
    {
      id: 'AHU-A',
      name: 'AHU-A Air Handling Unit (roof)',
      category: 'auxiliary',
      position: [-13.5, G.roofY, 0.9],
      connectedAssetIds: ['HEATER-01'],
      description: 'Roof-mounted air handling unit fed by HVAC Supply Duct A; supplies conditioned air to the laboratory wing.',
    },
    {
      id: 'AHU-B',
      name: 'AHU-B Air Handling Unit (roof)',
      category: 'auxiliary',
      position: [-19.0, G.roofY, -0.9],
      connectedAssetIds: ['HEATER-01'],
      description: 'Second roof-mounted AHU serving the accommodation and generator zones off the same duct run.',
    },
    {
      id: 'ELEC-HUB-3',
      name: 'Electrical Hub 3',
      category: 'primary',
      position: [6.4, 1.2, 6.0],
      connectedAssetIds: ['GEN-01', 'BAT-01'],
      description: 'Main low-voltage distribution hub inside the utility plant house — terminus of the power bus.',
    },
    {
      id: 'INCINERATOR-B',
      name: 'Chemical & Waste Incinerator B',
      category: 'outbuilding',
      position: [-40.4, 0, 5.2],
      connectedAssetIds: ['TREATMENT'],
      description: 'Waste incineration unit west of the complex, fed by the dedicated chemical and waste line.',
    },
    {
      id: 'LAKE-ICE',
      name: 'Frozen Lake (south-west)',
      category: 'terrain',
      position: [-46.0, 0, -18.0],
      connectedAssetIds: [],
      description: 'Large ice-covered lake with a snow-covered shore — terrain reference feature, not an asset.',
    },
    {
      id: 'MELT-POND',
      name: 'Meltwater Pond (north-east)',
      category: 'terrain',
      position: [14.0, 0, -20.0],
      connectedAssetIds: [],
      description: 'Small open meltwater pond with rocky banks — terrain reference feature, not an asset.',
    },
    {
      id: 'STORE-YARD',
      name: 'Foreground Container Pair',
      category: 'outbuilding',
      position: [-18.0, 0, 14.5],
      connectedAssetIds: [],
      description: 'Two containers on the foreground apron, matching the reference layout.',
    },
  ],

  // ── Utility routes ────────────────────────────────────────────────────────
  // Service-type colours follow the MAITRI pipeline reference legend:
  //   heating water (red) · potable water (blue) · greywater (grey)
  //   fuel (green) · electrical (yellow) · electrical conduit (dark)
  utilityRoutes: [
    // Legend colours follow the station reference:
    //   RED heating water · BLUE potable/fresh water · GREEN greywater/waste
    //   YELLOW fuel · CYAN HVAC air · ORANGE electrical · dark instrumentation conduit
    {
      id: 'mt-heat-supply',
      name: 'Heating Water Supply Main',
      type: 'heating_water',
      color: '#DC2626',
      points: [
        [6.4, 1.2, 6.4], [3.0, 1.3, 4.0], [1.2, 1.3, 1.2], [-2.0, 1.3, 0.6],
        [-8.0, 1.3, 0.6], [-16.0, 1.3, 0.6], [-24.0, 1.3, 0.6], [-30.0, 1.3, 0.1],
        [-31.0, 1.4, -0.9],
      ],
      diameter: 0.085,
      flowDirection: 1,
      sourceAssetId: 'HEATER-01',
      targetAssetId: 'GEN-01',
      provenance: 'documented',
    },
    {
      id: 'mt-heat-return',
      name: 'Heating Water Return Main',
      type: 'heating_water',
      color: '#991B1B',
      points: [
        [-31.0, 1.15, -1.2], [-24.0, 1.15, -0.9], [-16.0, 1.15, -0.9], [-8.0, 1.15, -0.9],
        [-2.0, 1.15, -1.0], [1.2, 1.15, -1.6], [3.2, 1.15, -4.0], [6.2, 1.15, 5.6],
      ],
      diameter: 0.085,
      flowDirection: -1,
      sourceAssetId: 'HEATER-01',
      targetAssetId: 'PUMP-01',
      provenance: 'documented',
    },
    {
      id: 'mt-fresh-water-a',
      name: 'Freshwater Loop A (Arm A)',
      type: 'potable_water',
      color: '#2563EB',
      points: [
        [-35.6, 1.0, -1.4], [-30.0, 1.0, 0.4], [-24.0, 1.0, 1.2], [-16.0, 1.0, 1.3],
        [-8.0, 1.0, 1.3], [-2.0, 1.0, 1.3], [1.0, 1.0, 0.8],
      ],
      diameter: 0.06,
      flowDirection: 1,
      sourceAssetId: 'PUMP-01',
      targetAssetId: 'HEATER-01',
      provenance: 'approximate',
    },
    {
      id: 'mt-fresh-water-b',
      name: 'Freshwater Loop B (Arm B)',
      type: 'potable_water',
      color: '#2563EB',
      points: [
        [1.0, 1.05, 0.4], [1.2, 1.05, -4.0], [1.2, 1.05, -10.0], [1.2, 1.05, -16.0],
        [1.2, 1.05, -21.5],
      ],
      diameter: 0.055,
      flowDirection: 1,
      sourceAssetId: 'PUMP-01',
      targetAssetId: 'PUMP-01',
      provenance: 'approximate',
    },
    {
      id: 'mt-fresh-water-c',
      name: 'Freshwater Loop C (Outbuildings)',
      type: 'potable_water',
      color: '#2563EB',
      points: [
        [-2.0, 1.05, 1.8], [-12.0, 1.05, 2.2], [-24.0, 1.05, 2.4], [-33.0, 0.95, 1.0],
        [-36.0, 0.9, -0.4],
      ],
      diameter: 0.05,
      flowDirection: -1,
      sourceAssetId: 'PUMP-01',
      targetAssetId: 'WATER-STORE',
      provenance: 'approximate',
    },
    {
      id: 'mt-raw-water',
      name: 'Raw Water Intake (Meltwater Lake)',
      type: 'water',
      color: '#1D4ED8',
      points: [
        [-48.0, 0.4, -12.0], [-44.0, 0.5, -8.0], [-40.0, 0.6, -5.0], [-37.5, 0.7, -2.6],
        [-36.2, 0.9, -2.0],
      ],
      diameter: 0.075,
      flowDirection: 1,
      sourceAssetId: 'LAKE-ICE',
      targetAssetId: 'WATER-STORE',
      provenance: 'approximate',
    },
    {
      id: 'mt-greywater',
      name: 'Greywater & Wastewater Return',
      type: 'greywater',
      color: '#16A34A',
      points: [
        [-2.0, 0.8, -1.8], [-10.0, 0.8, -2.3], [-18.0, 0.8, -2.3], [-26.0, 0.8, -2.3],
        [-33.0, 0.8, -1.2], [-40.0, 0.7, 0.8], [-43.6, 0.6, 1.8],
      ],
      diameter: 0.07,
      flowDirection: -1,
      sourceAssetId: 'PUMP-01',
      targetAssetId: 'TREATMENT',
      provenance: 'approximate',
    },
    {
      id: 'mt-incineration-b',
      name: 'Chemical & Waste Incinerator B Line',
      type: 'incineration',
      color: '#8B5CF6',
      points: [
        [-20.0, 0.95, -2.4], [-26.0, 0.95, -2.4], [-33.0, 0.9, -1.2], [-38.0, 0.8, 2.0],
        [-40.4, 0.7, 5.2],
      ],
      diameter: 0.055,
      flowDirection: -1,
      sourceAssetId: 'TREATMENT',
      targetAssetId: 'INCINERATOR-B',
      provenance: 'documented',
    },
    {
      id: 'mt-fuel-1a',
      name: 'Diesel Fuel Line 1A',
      type: 'fuel',
      color: '#EAB308',
      points: [
        [-37.0, 0.7, 10.6], [-34.0, 0.8, 8.0], [-30.0, 0.9, 5.0], [-28.0, 1.0, 2.2],
        [-27.0, 1.15, 0.2], [-27.0, 1.3, -0.9],
      ],
      diameter: 0.07,
      flowDirection: 1,
      sourceAssetId: 'FUEL-01',
      targetAssetId: 'GEN-01',
      provenance: 'documented',
    },
    {
      id: 'mt-power-hub3',
      name: 'Electrical Hub 3 Distribution Bus',
      type: 'electrical',
      color: '#F97316',
      points: [
        [-26.0, 1.18, -1.65], [-20.0, 1.18, -1.65], [-13.0, 1.18, -1.65], [-6.0, 1.18, -1.65],
        [-1.6, 1.18, -1.9], [2.2, 1.18, -3.2], [4.0, 1.2, 2.0], [6.4, 1.2, 6.0],
      ],
      diameter: 0.075,
      flowDirection: 1,
      sourceAssetId: 'GEN-01',
      targetAssetId: 'ELEC-HUB-3',
      provenance: 'documented',
    },
    {
      id: 'mt-power-armb',
      name: 'Arm B Power Distribution',
      type: 'electrical',
      color: '#F97316',
      points: [
        [1.65, 1.18, -3.6], [1.65, 1.18, -9.0], [1.65, 1.18, -15.0], [1.65, 1.18, -21.5],
      ],
      diameter: 0.065,
      flowDirection: 1,
      sourceAssetId: 'BAT-01',
      targetAssetId: 'PUMP-01',
      provenance: 'approximate',
    },
    {
      id: 'mt-air-hvac-a',
      name: 'HVAC Supply Duct A',
      type: 'air',
      color: '#06B6D4',
      points: [
        [6.2, 1.5, 6.2], [3.0, 1.7, 4.2], [1.0, 1.9, 1.0], [-2.0, 2.3, -1.2],
        [-8.0, 2.7, -1.2], [-13.5, 3.5, -1.0], [-13.5, 5.05, 0.9],
        [-16.0, 5.05, -0.9], [-19.0, 5.05, -0.9],
      ],
      diameter: 0.11,
      flowDirection: 1,
      sourceAssetId: 'HEATER-01',
      targetAssetId: 'AHU-A',
      provenance: 'documented',
    },
    {
      id: 'mt-conduit-loop',
      name: 'Instrumentation & Fire Conduit Loop',
      type: 'electrical_conduit',
      color: '#1F2937',
      points: [
        [-31.0, 0.55, 2.1], [-24.0, 0.55, 2.1], [-16.0, 0.55, 2.1], [-8.0, 0.55, 2.1],
        [-2.0, 0.6, 2.2], [2.7, 0.5, 2.7], [4.2, 0.4, 0.0], [6.0, 0.3, -5.0], [8.6, 0.3, -8.4],
      ],
      diameter: 0.045,
      flowDirection: 1,
      sourceAssetId: 'ENV-01',
      targetAssetId: 'GEN-01',
      provenance: 'approximate',
    },
    {
      id: 'mt-comms-link',
      name: 'Sensor & Communications Data Link',
      type: 'comms',
      color: '#A855F7',
      points: [
        [9.0, 1.6, -9.0], [6.2, 1.9, -5.2], [3.2, 2.6, -2.2], [0.2, 3.6, -0.8],
        [-2.6, 4.4, 0.0], [-4.0, 4.9, 0.0],
      ],
      diameter: 0.04,
      flowDirection: -1,
      sourceAssetId: 'ENV-01',
      targetAssetId: 'COMMS-KNUCKLE',
      provenance: 'approximate',
    },
  ],

  // ── Thermal radiation sources (data-driven heat emitters) ─────────────────
  // thermalOutput = rated heat factor (0-1) · thermalRadius = metres of influence.
  // Live intensity is derived from each machine's temperature above ambient, so a
  // working generator blazes while a cold standby unit barely glows.
  thermalSources: [
    { id: 'GEN-01', type: 'generator', position: [G.armAEndX + 5.0, G.deckY + 0.6, -0.9], thermalOutput: 1.0, thermalRadius: 8, label: 'Primary Generator Set 01' },
    { id: 'GEN-02', type: 'generator', position: [G.armAEndX + 8.5, G.deckY + 0.6, -0.9], thermalOutput: 1.0, thermalRadius: 8, label: 'Secondary Generator Set 02' },
    { id: 'HEATER-01', type: 'heat_exchanger', position: [G.armAEndX + 18.0, G.deckY + 0.8, 0.9], thermalOutput: 0.8, thermalRadius: 6, label: 'Main Boiler Heat Exchanger' },
    { id: 'PUMP-01', type: 'pump', position: [G.armAEndX + 23.0, G.deckY + 0.5, -0.9], thermalOutput: 0.55, thermalRadius: 4, label: 'Hydronic Circulation Pump' },
    { id: 'BAT-01', type: 'electrical', position: [G.armAEndX + 13.0, G.deckY + 0.7, 0.9], thermalOutput: 0.4, thermalRadius: 3, label: 'DC Battery Bank' },
    { id: 'FUEL-01', type: 'fuel_system', position: [-37.0, 0.9, 11.0], thermalOutput: 0.25, thermalRadius: 4, label: 'Aviation Turbine Fuel Farm' },
    { id: 'ENV-01', type: 'environmental', position: [9.0, 0.8, -9.0], thermalOutput: 0.15, thermalRadius: 2.5, label: 'AWS Mast De-icing' },
  ],

  cameraPresets: {
    aerial: { position: [26, 30, 34], target: [-14, 2.0, -8] },
    front: { position: [-14, 7, 36], target: [-14, 2.5, -8] },
    side: { position: [42, 8, -8], target: [-14, 2.5, -8] },
    infra: { position: [16, 6, 16], target: [-6, 2.0, 0] },
    plan: { position: [-14, 48, -7.9], target: [-14, 0, -8] },
  },

  orbit: { minDistance: 8, maxDistance: 95, target: [-14, 2.2, -8] },

  environment: {
    skyColor: '#C4D4DE',
    fogDensity: 0.009,
    groundColor: '#8B8071',
    gridColor: '#004E64',
  },

  siteProvenance:
    'MAITRI site geometry traced from the station reference views (normal / X-ray / thermal heat map / pipe & conduit). ' +
    'Unit positions are proportional estimates — the references publish no dimensions. ' +
    'Six service conduit types follow the reference legend; their exact routing is a documented approximation for demonstration, not a surveyed engineering layout.',
};
