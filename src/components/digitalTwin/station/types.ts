/**
 * DAKSHIN — SHARED STATION TWIN CONTRACTS
 *
 * Station-agnostic contracts used by the 3D Digital Twin. Each station
 * (MAITRI / BHARATI) owns its own model implementation, layout manifest and
 * utility routes, but implements the same interfaces so that a station model
 * can never be mounted in the wrong section.
 *
 * IMPORTANT:
 * - `stationId` on the layout is the mounting guard used by DigitalTwinPanel.
 * - Positions live in the layout manifest ONLY (single source of truth).
 *   Any other module that needs an asset position must read it from here.
 */

import type * as THREE from 'three';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { OperationalStatus, StationId } from '../../../types';
import type { AtmosphericTelemetry } from '../../../services/telemetry/telemetryContracts';

// ---------------------------------------------------------------------------
// Vision Modes & Camera
// ---------------------------------------------------------------------------

export type VisionMode = 'NORMAL' | 'XRAY' | 'CONNECTIVITY' | 'HEAT_MAP';

export type HeatMapMetric =
  | 'temperature'
  | 'wind'
  | 'power'
  | 'structural'
  | 'fuel';

export type CameraPresetId = 'aerial' | 'front' | 'side' | 'infra' | 'plan';

// ---------------------------------------------------------------------------
// Utility / Pipeline Network
// ---------------------------------------------------------------------------

/**
 * Superset of the conduit vocabularies used by both station layouts.
 * - BHARATI reference legend: high-grade waste heat (heating_water), medium
 *   temperature hydronic (glycol), fresh/recirculated air (air), plus the
 *   station's electrical, potable water and fuel systems.
 * - MAITRI reference legend: heating water, potable water, greywater, fuel,
 *   electrical, electrical conduit.
 */
export type UtilityRouteKind =
  | 'power'
  | 'electrical'
  | 'electrical_conduit'
  | 'heating_water'
  | 'glycol'
  | 'potable_water'
  | 'water'
  | 'greywater'
  | 'fuel'
  | 'comms'
  | 'air'
  | 'incineration';

export interface UtilityRoute {
  id: string;
  name: string;
  type: UtilityRouteKind;
  color: string;
  /** Polyline the pipe follows, in station-local metres. */
  points: [number, number, number][];
  diameter: number;
  flowDirection?: 1 | -1;
  sourceAssetId?: MachineAssetId | string;
  targetAssetId?: MachineAssetId | string;
  /**
   * Routing status disclosure. 'documented' = traced from the station
   * reference views; 'approximate' = plausible engineering routing added for
   * demonstration. Never present an 'approximate' route as surveyed.
   * Optional so station models can adopt it incrementally.
   */
  provenance?: 'documented' | 'approximate';
}

export interface InfrastructureNode {
  id: string;
  name: string;
  category: 'primary' | 'auxiliary' | 'structural' | 'outbuilding' | 'terrain';
  position: [number, number, number];
  connectedAssetIds: (MachineAssetId | string)[];
  description: string;
}

// ---------------------------------------------------------------------------
// Sensor Beacons
// ---------------------------------------------------------------------------

export interface SensorBeaconSpec {
  id: string;
  /** Undefined for non-asset beacons (met mast, water store, …). */
  assetId?: MachineAssetId;
  label: string;
  /** World position of the beacon head in station-local metres. */
  position: [number, number, number];
  /** Initial status before telemetry arrives. */
  status: OperationalStatus;
}

// ---------------------------------------------------------------------------
// Layout Manifest
// ---------------------------------------------------------------------------

export interface StationEnvironment {
  /** Scene clear colour / fog colour. */
  skyColor: string;
  fogDensity: number;
  /** Base ground surface colour (also the snow-accumulation target surface). */
  groundColor: string;
  gridColor: string;
}

export interface CameraPresetSpec {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * Data-driven thermal emitter definition (consumed by ThermalRadiationSystem).
 * A machine declares how much heat it produces and over what radius, so the
 * thermal view needs no per-machine bespoke effect code.
 */
export interface ThermalSourceSpec {
  id: string;
  type: string;
  /** World position of the machine's thermal centre. */
  position: [number, number, number];
  /** Rated thermal output factor, 0 – 1. */
  thermalOutput: number;
  /** Thermal influence radius in metres (intensity falls off within it). */
  thermalRadius: number;
  /** Human-readable label for the UI legend. */
  label: string;
}

export interface StationLayout {
  /** Mounting guard — a layout must never be used for another station. */
  stationId: StationId;
  /** Approximate real-world footprint (metres) used for camera framing. */
  footprint: { lengthX: number; depthZ: number; heightY: number };
  assetPositions: Record<MachineAssetId, [number, number, number]>;
  /** Station-specific display names for the 7 telemetry assets. */
  assetLabels: Record<MachineAssetId, string>;
  sensorBeacons: SensorBeaconSpec[];
  infrastructureNodes: InfrastructureNode[];
  utilityRoutes: UtilityRoute[];
  /** Machinery heat emitters driving thermal radiation mode. */
  thermalSources: ThermalSourceSpec[];
  cameraPresets: Record<CameraPresetId, CameraPresetSpec>;
  orbit: { minDistance: number; maxDistance: number; target: [number, number, number] };
  environment: StationEnvironment;
  /** Shown in the UI so simulated/approximate content is never hidden. */
  siteProvenance: string;
}

// ---------------------------------------------------------------------------
// Telemetry Update Shape (structural subset of MachineryTelemetryWithBaseline)
// ---------------------------------------------------------------------------

export interface TelemetryUpdateItem {
  asset_id: MachineAssetId;
  status: OperationalStatus;
  temperature?: number;
  current_temperature?: number;
  vibration?: number;
  current_vibration?: number;
  power?: number;
  current_power?: number;
  fuel?: number;
  current_fuel?: number;
}

// ---------------------------------------------------------------------------
// Heat Map Legend
// ---------------------------------------------------------------------------

export interface HeatMapLegendConfig {
  metric: HeatMapMetric;
  label: string;
  unit: string;
  min: number;
  max: number;
  gradient: { stop: number; color: string; label: string }[];
}

// ---------------------------------------------------------------------------
// Station Twin Handle
// ---------------------------------------------------------------------------

/**
 * Runtime interface used by DigitalTwinPanel. Both `MaitriStation` and
 * `BharatiStation` satisfy it structurally, so the panel can drive whichever
 * model is active without branching on station identity.
 */
export interface TwinHandle {
  readonly rootGroup: THREE.Group;
  initializeTelemetry(assets: Record<MachineAssetId, MachineTelemetry>): void;
  setVisionMode(
    mode: VisionMode,
    metric?: HeatMapMetric,
    assets?: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ): void;
  selectAsset(assetId: string | null): void;
  updateTelemetry(
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ): void;
  update(dt: number, time: number): void;
  dispose(): void;
  /** Optional — used to register raycast-selectable asset groups. */
  getAssetGroups?(): Map<string, THREE.Group>;
  /** Optional — declared by station models that own a layout manifest. */
  getLayout?(): StationLayout;
}

/** Full contract a station-specific model class should implement. */
export interface IStationTwin extends TwinHandle {
  readonly layout: StationLayout;
  getAssetGroups(): Map<string, THREE.Group>;
  getLayout(): StationLayout;
}

// ---------------------------------------------------------------------------
// Heat Map Targets (adapter implemented by each station model)
// ---------------------------------------------------------------------------

export interface HeatMapTargets {
  /** Exterior envelope / cladding colour. `null` restores the normal colour. */
  setEnvelopeColor(hex: string | null): void;
  /** Structural undercarriage colour. `null` restores the normal colour. */
  setStructureColor(hex: string | null): void;
  /** Tints one equipment asset directly (bypassing its status colour). */
  setEquipmentColor(assetId: string, hex: string, emissiveIntensity: number): void;
  /** Equipment material registry, keyed by asset id. */
  equipmentMaterials: Map<string, THREE.MeshStandardMaterial>;
}
