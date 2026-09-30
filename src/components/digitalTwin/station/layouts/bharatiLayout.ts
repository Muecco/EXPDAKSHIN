/**
 * DAKSHIN — BHARATI STATION LAYOUT MANIFEST (SINGLE SOURCE OF TRUTH)
 *
 * Reproduces BHARATI Research Station (Larsemann Hills, Prydz Bay, East
 * Antarctica) from its references:
 *
 *   b.png           — 4-panel composite (Normal / X-ray / Thermal heat map /
 *                     Hydronic + HVAC pipeline legend)
 *   7quow7…png      — orthographic FRONT + SIDE views with labelled elements:
 *                     RADOMES, HELICOPTER PLATFORM, GROUND SUPPORT COLUMNS,
 *                     ACCOMMODATION MODULES, LABORATORY CONTAINERS, PRYDZ BAY
 *
 * ── Reference-derived site plan (station-local metres, Y up) ───────────────
 * Origin (0,0,0) sits at the main building's geometric centre.
 *   • Main building — a single long rectangular envelope ≈17.4 × 6.6 m, one
 *     main occupied floor (deck top at y = 2.45) plus a shallow roof zone to
 *     y ≈ 6.0, carried on GROUND SUPPORT COLUMNS with an open undercroft.
 *   • Long axis runs seaward (−X, Prydz Bay) → inland (+X, helipad).
 *   • Roof — three white spherical radomes, roof helideck with helicopter,
 *     solar PV rows, HVAC chillers and a meteorological mast (already built in
 *     StationBuilding; this manifest owns their data).
 *   • Yard — LABORATORY CONTAINERS stacked to the west, ACCOMMODATION MODULES
 *     to the east, a ground helipad inland (helicopter), and the Prydz Bay sea
 *     to the west with a rocky shoreline.
 *   • Interior zones (from the X-ray labels) — Laboratories / Laboratory /
 *     Microbiology at the seaward end, Generator hall, Breezeway lounge,
 *     central Stairwell, Living quarters, Recreation, Movements foyer.
 *
 * Pipeline legend (b.png, verbatim):
 *   RED   High-grade waste heat hydronic water distribution
 *   ORANGE Medium-temperature hydronic water distribution to radiators
 *   CYAN  Ducts: fresh/recirculated air
 * plus the station's electrical (orange), potable water (blue) and fuel (yellow).
 *
 * ALL positions are proportional estimates — the references publish no
 * dimensions. Conduit routing is a documented approximation, not surveyed.
 */

import type { StationLayout } from '../types';

// ---------------------------------------------------------------------------
// Footprint constants (shared by the geometry builders)
// ---------------------------------------------------------------------------

export const BHARATI_GEOMETRY = {
  /** Deck top height above ground (open undercroft on support columns). */
  deckY: 2.45,
  /** Main building half-length along X (seaward ↔ inland). */
  halfX: 8.7,
  /** Main building half-width along Z. */
  halfZ: 3.3,
  /** Main occupied floor body height. */
  bodyHeight: 2.5,
  /** Roof cap height above ground. */
  roofY: 6.0,
  /** Equipment floor level (deck + step). */
  equipY: 2.45,
} as const;

const G = BHARATI_GEOMETRY;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const BHARATI_LAYOUT: StationLayout = {
  stationId: 'bharati',
  footprint: { lengthX: 30, depthZ: 16, heightY: 13 },

  // Asset positions (station-local). Indoor plant sits on the deck; FUEL-01
  // is an exterior tank farm.
  assetPositions: {
    'GEN-01': [-4.6, G.equipY, -1.2],
    'GEN-02': [-4.6, G.equipY, 1.2],
    'BAT-01': [-1.2, G.equipY, -1.8],
    'FUEL-01': [-13.0, 0.15, -3.0],
    'PUMP-01': [1.8, G.equipY, -1.8],
    'HEATER-01': [1.6, G.equipY, 1.4],
    'ENV-01': [5.0, G.equipY, 0.0],
  },

  assetLabels: {
    'GEN-01': 'Primary Diesel Generator Set 01',
    'GEN-02': 'Secondary Diesel Generator Set 02',
    'BAT-01': 'Station Battery / Electrical Hub',
    'FUEL-01': 'Diesel Fuel Storage',
    'PUMP-01': 'Hydronic / RO Water Pump',
    'HEATER-01': 'Heat Exchanger',
    'ENV-01': 'Automatic Weather Station',
  },

  sensorBeacons: [
    { id: 'GEN-01', assetId: 'GEN-01', label: 'GEN-01 Generator 01', position: [-4.6, 5.2, -1.2], status: 'NORMAL' },
    { id: 'GEN-02', assetId: 'GEN-02', label: 'GEN-02 Generator 02', position: [-4.6, 5.2, 1.2], status: 'NORMAL' },
    { id: 'BAT-01', assetId: 'BAT-01', label: 'BAT-01 Battery Hub', position: [-1.2, 5.2, -1.8], status: 'NORMAL' },
    { id: 'FUEL-01', assetId: 'FUEL-01', label: 'FUEL-01 Fuel Storage', position: [-13.0, 2.8, -3.0], status: 'NORMAL' },
    { id: 'PUMP-01', assetId: 'PUMP-01', label: 'PUMP-01 Water Pump', position: [1.8, 5.2, -1.8], status: 'NORMAL' },
    { id: 'HEATER-01', assetId: 'HEATER-01', label: 'HEATER-01 Heat Exchanger', position: [1.6, 5.2, 1.4], status: 'NORMAL' },
    { id: 'ENV-01', assetId: 'ENV-01', label: 'ENV-01 Weather Station', position: [5.0, 5.2, 0.0], status: 'NORMAL' },
    { id: 'ROOF-MET', label: 'ROOF-MET Radome Array', position: [1.8, 7.6, -1.6], status: 'NORMAL' },
  ],

  infrastructureNodes: [
    {
      id: 'GEN-HALL',
      name: 'Generator Hall (seaward end)',
      category: 'primary',
      position: [-4.6, G.equipY, 0],
      connectedAssetIds: ['GEN-01', 'GEN-02'],
      description: 'Diesel generation bay at the seaward end of the main floor, per the X-ray label.',
    },
    {
      id: 'AHU-A',
      name: 'AHU-A Air Handling Unit',
      category: 'auxiliary',
      position: [1.0, G.roofY, 1.6],
      connectedAssetIds: ['HEATER-01'],
      description: 'Air handling unit distributing fresh/recirculated air (cyan duct legend).',
    },
    {
      id: 'AHU-B',
      name: 'AHU-B Air Handling Unit',
      category: 'auxiliary',
      position: [3.6, G.roofY, -1.6],
      connectedAssetIds: ['HEATER-01'],
      description: 'Second air handling unit serving the laboratory wing.',
    },
    {
      id: 'ELEC-HUB',
      name: 'Electrical Hub / Battery Bank',
      category: 'primary',
      position: [-1.2, G.equipY, -1.8],
      connectedAssetIds: ['BAT-01', 'GEN-01'],
      description: 'Low-voltage distribution hub fed by the generators.',
    },
    {
      id: 'HEAT-XCH',
      name: 'Heat Exchanger Room',
      category: 'primary',
      position: [1.6, G.equipY, 1.4],
      connectedAssetIds: ['HEATER-01', 'GEN-01'],
      description: 'Recovers high-grade waste heat from the generators for hydronic distribution.',
    },
    {
      id: 'ACCOMMODATION',
      name: 'Accommodation Modules (east)',
      category: 'outbuilding',
      position: [13.0, 0, 2.0],
      connectedAssetIds: [],
      description: 'Stacked accommodation container modules on ground support columns (east wing).',
    },
    {
      id: 'LAB-CONTAINERS',
      name: 'Laboratory Containers (west)',
      category: 'outbuilding',
      position: [-13.5, 0, 2.0],
      connectedAssetIds: [],
      description: 'Stacked laboratory container modules toward the seaward side.',
    },
    {
      id: 'GROUND-HELIPAD',
      name: 'Ground Helipad (inland)',
      category: 'outbuilding',
      position: [16.0, 0, -6.0],
      connectedAssetIds: [],
      description: 'Rocky inland helipad with a helicopter, per the orthographic side view.',
    },
    {
      id: 'PRYDZ-BAY',
      name: 'Prydz Bay Shoreline',
      category: 'terrain',
      position: [-22.0, 0, 0],
      connectedAssetIds: [],
      description: 'Sea to the west — the coast the station overlooks.',
    },
  ],

  // ── Utility routes (b.png hydronic + HVAC legend) ─────────────────────────
  utilityRoutes: [
    {
      id: 'bh-waste-heat',
      name: 'High-Grade Waste Heat (Generators → Heat Exchanger)',
      type: 'heating_water',
      color: '#DC2626',
      points: [
        [-4.6, 3.4, -1.2], [-3.0, 3.4, -0.4], [-1.0, 3.4, 0.8], [0.6, 3.4, 1.4], [1.6, 3.4, 1.4],
      ],
      diameter: 0.085,
      flowDirection: 1,
      sourceAssetId: 'GEN-01',
      targetAssetId: 'HEATER-01',
      provenance: 'documented',
    },
    {
      id: 'bh-hydronic',
      name: 'Medium-Temperature Hydronic Water → Radiators',
      type: 'glycol',
      color: '#F97316',
      points: [
        [1.6, 3.2, 1.4], [0.2, 3.2, 2.2], [-2.0, 3.2, 2.2], [-4.0, 3.2, 2.2], [-6.0, 3.2, 2.2],
      ],
      diameter: 0.075,
      flowDirection: 1,
      sourceAssetId: 'HEATER-01',
      targetAssetId: 'GEN-01',
      provenance: 'documented',
    },
    {
      id: 'bh-air-duct',
      name: 'Fresh / Recirculated Air Ducts (AHU → Rooms)',
      type: 'air',
      color: '#06B6D4',
      points: [
        [1.0, 5.6, 1.6], [1.0, 4.6, 0.8], [-1.0, 4.6, 0.0], [-4.0, 4.6, 0.0], [-6.5, 4.6, 0.0],
      ],
      diameter: 0.12,
      flowDirection: 1,
      sourceAssetId: 'HEATER-01',
      targetAssetId: 'GEN-01',
      provenance: 'documented',
    },
    {
      id: 'bh-electrical',
      name: 'Electrical Power Bus',
      type: 'electrical',
      color: '#F59E0B',
      points: [
        [-4.6, 3.0, -1.2], [-3.0, 3.0, -1.8], [-1.2, 3.0, -1.8], [1.0, 3.0, -1.6], [3.6, 3.0, -1.4],
      ],
      diameter: 0.07,
      flowDirection: 1,
      sourceAssetId: 'GEN-01',
      targetAssetId: 'BAT-01',
      provenance: 'documented',
    },
    {
      id: 'bh-potable',
      name: 'Potable / Fresh Water',
      type: 'potable_water',
      color: '#2563EB',
      points: [
        [1.8, 3.1, -1.8], [0.0, 3.1, -2.4], [-3.0, 3.1, -2.4], [-6.0, 3.1, -2.2],
      ],
      diameter: 0.06,
      flowDirection: 1,
      sourceAssetId: 'PUMP-01',
      targetAssetId: 'HEATER-01',
      provenance: 'approximate',
    },
    {
      id: 'bh-fuel',
      name: 'Diesel Fuel Feed',
      type: 'fuel',
      color: '#EAB308',
      points: [
        [-13.0, 0.8, -3.0], [-10.0, 1.4, -2.4], [-7.0, 2.2, -1.6], [-4.8, 2.6, -1.2],
      ],
      diameter: 0.07,
      flowDirection: 1,
      sourceAssetId: 'FUEL-01',
      targetAssetId: 'GEN-01',
      provenance: 'approximate',
    },
    {
      id: 'bh-comms',
      name: 'Sensor & Satellite Data Link',
      type: 'comms',
      color: '#A855F7',
      points: [
        [5.0, 3.4, 0.0], [3.0, 4.2, -1.0], [1.8, 5.4, -1.6],
      ],
      diameter: 0.04,
      flowDirection: -1,
      sourceAssetId: 'ENV-01',
      targetAssetId: 'ROOF-MET',
      provenance: 'approximate',
    },
  ],

  // ── Thermal radiation sources (data-driven heat emitters) ────────────────
  thermalSources: [
    { id: 'GEN-01', type: 'generator', position: [-4.6, G.equipY + 0.6, -1.2], thermalOutput: 1.0, thermalRadius: 8, label: 'Primary Generator 01' },
    { id: 'GEN-02', type: 'generator', position: [-4.6, G.equipY + 0.6, 1.2], thermalOutput: 1.0, thermalRadius: 8, label: 'Secondary Generator 02' },
    { id: 'HEATER-01', type: 'heat_exchanger', position: [1.6, G.equipY + 0.8, 1.4], thermalOutput: 0.8, thermalRadius: 6, label: 'Heat Exchanger' },
    { id: 'PUMP-01', type: 'pump', position: [1.8, G.equipY + 0.5, -1.8], thermalOutput: 0.55, thermalRadius: 4, label: 'Water Pump' },
    { id: 'BAT-01', type: 'electrical', position: [-1.2, G.equipY + 0.7, -1.8], thermalOutput: 0.4, thermalRadius: 3, label: 'Battery / Electrical Hub' },
    { id: 'FUEL-01', type: 'fuel_system', position: [-13.0, 0.9, -3.0], thermalOutput: 0.25, thermalRadius: 4, label: 'Fuel Storage' },
    { id: 'ENV-01', type: 'environmental', position: [5.0, G.equipY + 0.8, 0.0], thermalOutput: 0.15, thermalRadius: 2.5, label: 'Weather Station' },
  ],

  // ── Camera ────────────────────────────────────────────────────────────────
  cameraPresets: {
    aerial: { position: [18, 16, 22], target: [0, 3.0, 0] },
    front: { position: [18, 4.8, 0], target: [0, 3.8, 0] },
    side: { position: [0, 5.0, 24], target: [0, 3.8, 0] },
    infra: { position: [-11, 5.5, -8], target: [-4.5, 2.8, 0] },
    plan: { position: [0, 30, 0.1], target: [0, 0, 0] },
  },

  orbit: { minDistance: 12, maxDistance: 60, target: [0, 3.2, 0] },

  environment: {
    skyColor: '#C4D4DE',
    fogDensity: 0.012,
    groundColor: '#DDE6EC', // snow + exposed rock blend
    gridColor: '#004E64',
  },

  siteProvenance:
    'BHARATI site geometry traced from the station references (b.png 4-panel composite + orthographic front/side views, Prydz Bay, Larsemann Hills). ' +
    'Unit positions are proportional estimates — the references publish no dimensions. ' +
    'Pipeline routing follows the b.png hydronic + HVAC legend and is a documented approximation, not a surveyed engineering layout.',
};
