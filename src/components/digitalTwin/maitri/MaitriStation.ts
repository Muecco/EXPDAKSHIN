/**
 * DAKSHIN — MAITRI STATION DIGITAL TWIN (COORDINATOR)
 *
 * Master digital twin model for MAITRI Research Station. Encapsulates the full
 * station-specific 3D content and implements the shared station contract so
 * DigitalTwinPanel can drive it identically to Bharati — while guaranteeing the
 * Maitri model is only ever mounted in the Maitri section (see `layout.stationId`).
 *
 * Content:
 *   1. Site terrain   — rocky scree, frozen lake, meltwater pond, tracks, coal
 *                       heap, boulders, snow patches
 *   2. Module complex — elevated L-shaped module chain, glazed knuckle, window
 *                       bands, tricolour module, stair towers, roof plant
 *   3. Outbuildings   — container fleet, white hut, treatment shelter, utility
 *                       plant house, site loader
 *   4. Interior       — colour-zoned rooms and central corridors (X-Ray)
 *   5. Equipment      — the 7 telemetry assets (unique to Maitri)
 *   6. Utilities      — six-type service conduit network with animated flow
 *   7. Sensor beacons — 8 station-specific markers
 *
 * Vision modes (same geometry, no scene rebuild):
 *   NORMAL       — architectural presentation with full site context
 *   XRAY         — ghosted envelope, revealed interior + undercarriage
 *   CONNECTIVITY — ghosted envelope with the service conduit network and
 *                  interactive upstream/downstream highlighting
 *   HEAT_MAP     — metric-tinted envelope, structure, equipment and terrain
 */

import * as THREE from 'three';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { OperationalStatus, StationId } from '../../../types';
import type { AtmosphericTelemetry } from '../../../services/telemetry/telemetryContracts';
import type {
  HeatMapMetric,
  HeatMapTargets,
  IStationTwin,
  StationLayout,
  TelemetryUpdateItem,
  TwinHandle,
  UtilityRoute,
  VisionMode,
} from '../station/types';
import { UtilityRouteNetwork } from '../station/StationTwinKit';
import { SensorBeaconSet } from '../station/SensorBeaconSet';
import { HeatMapController } from '../station/HeatMapController';
import { XRayController } from '../station/XRayController';
import { ThermalRadiationSystem } from '../station/ThermalRadiationSystem';
import { MAITRI_LAYOUT } from '../station/layouts/maitriLayout';
import { MaitriSiteTerrain } from './SiteTerrain';
import { MaitriModuleComplex } from './ModuleComplex';
import { MaitriContainersAndOutbuildings } from './ContainersAndOutbuildings';
import { MaitriInteriorLayout } from './MaitriInteriorLayout';
import { MaitriEquipment } from './MaitriEquipment';

export class MaitriStation implements IStationTwin {
  public readonly stationId: StationId = 'maitri';
  public readonly layout: StationLayout = MAITRI_LAYOUT;
  public rootGroup: THREE.Group;

  public terrain: MaitriSiteTerrain;
  public complex: MaitriModuleComplex;
  public outbuildings: MaitriContainersAndOutbuildings;
  public interior: MaitriInteriorLayout;
  public equipment: MaitriEquipment;
  public utility: UtilityRouteNetwork;
  public sensors: SensorBeaconSet;

  public xray: XRayController;
  public heatmap: HeatMapController;
  /** Heat actually radiating from this station's machinery (thermal mode). */
  public thermal: ThermalRadiationSystem;

  private currentVisionMode: VisionMode = 'NORMAL';
  private selectedAssetId: string | null = null;
  /** Last known live status per asset, so heat-map tinting can be undone. */
  private lastStatus: Map<string, OperationalStatus> = new Map();
  /** Records operator metric intent; emission itself is telemetry-driven. */
  private lastThermalMetric: HeatMapMetric = 'temperature';

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'MaitriStation_MasterTwin';

    // 1. Site context (terrain, water bodies, tracks, scatter)
    this.terrain = new MaitriSiteTerrain();
    this.rootGroup.add(this.terrain.group);

    // 2. Elevated module complex
    this.complex = new MaitriModuleComplex();
    this.rootGroup.add(this.complex.group);

    // 3. Outbuildings & container fleet
    this.outbuildings = new MaitriContainersAndOutbuildings();
    this.rootGroup.add(this.outbuildings.group);

    // 4. Interior layout (revealed in X-Ray)
    this.interior = new MaitriInteriorLayout();
    this.rootGroup.add(this.interior.group);

    // 5. Telemetry equipment (Maitri plant, Maitri positions)
    this.equipment = new MaitriEquipment(this.layout);
    this.rootGroup.add(this.equipment.group);

    // 6. Service conduit network
    this.utility = new UtilityRouteNetwork(
      'Maitri_UtilityNetwork',
      this.layout.utilityRoutes as UtilityRoute[]
    );
    this.rootGroup.add(this.utility.group);

    // 7. Sensor beacons
    this.sensors = new SensorBeaconSet('Maitri_SensorMarkers', this.layout.sensorBeacons);
    this.rootGroup.add(this.sensors.group);

    // 8. Thermal radiation sources (data-driven from the layout manifest)
    this.thermal = new ThermalRadiationSystem(
      'Maitri_ThermalRadiation',
      this.layout.thermalSources
    );
    this.rootGroup.add(this.thermal.group);

    // Mode controllers — bound to this station's surfaces only
    this.xray = new XRayController({
      setEnvelopeTransparent: (enabled: boolean) => this.complex.setEnvelopeTransparent(enabled),
      setInteriorRevealed: (enabled: boolean) => this.interior.setXRayMode(enabled),
      setStructureEmphasis: (enabled: boolean) => this.complex.setStructureEmphasis(enabled),
    });

    const heatTargets: HeatMapTargets = {
      setEnvelopeColor: (hex: string | null) => this.complex.setEnvelopeColor(hex),
      setStructureColor: (hex: string | null) => this.complex.setStructureColor(hex),
      setEquipmentColor: (assetId: string, hex: string, intensity: number) => {
        const material = this.equipment.assetMaterials.get(assetId);
        if (!material) return;
        material.color.set(hex);
        material.emissive.set(hex);
        material.emissiveIntensity = intensity;
      },
      equipmentMaterials: this.equipment.assetMaterials,
    };
    this.heatmap = new HeatMapController(heatTargets);

    this.setVisionMode('NORMAL');
  }

  // ── Telemetry binding ───────────────────────────────────────────────────

  /** Seeds asset status and beacon colours from station telemetry. */
  public initializeTelemetry(assets: Record<MachineAssetId, MachineTelemetry>): void {
    this.equipment.initializeEquipment(assets);
    (Object.keys(assets) as MachineAssetId[]).forEach((assetId) => {
      this.sensors.updateStatus(assetId, assets[assetId].status);
      this.lastStatus.set(assetId, assets[assetId].status);
    });
  }

  /** Reactive per-tick telemetry update (no scene rebuild). */
  public updateTelemetry(
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ): void {
    Object.values(assets).forEach((asset) => {
      this.lastStatus.set(asset.asset_id, asset.status);
      this.equipment.updateAssetStatus(asset.asset_id, asset.status);
      this.sensors.updateStatus(asset.asset_id, asset.status);
    });

    if (this.currentVisionMode === 'HEAT_MAP') {
      // Re-derive every machine's heat emission from the live plant state
      this.thermal.applyTelemetry(assets, atmospheric?.temperature ?? -28.4);
    }
  }

  // ── Vision modes ────────────────────────────────────────────────────────

  public setVisionMode(
    mode: VisionMode,
    metric?: HeatMapMetric,
    assets?: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ): void {
    this.currentVisionMode = mode;

    switch (mode) {
      case 'NORMAL':
        this.xray.setEnabled(false);
        this.clearHeatMap();
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        break;

      case 'XRAY':
        this.xray.setEnabled(true);
        this.clearHeatMap();
        // Conduits stay hidden so the interior layout reads cleanly
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        break;

      case 'CONNECTIVITY':
        // Ghosted envelope so every service conduit is visible in situ
        this.xray.setEnabled(true);
        this.clearHeatMap();
        this.utility.setVisibility(true);
        this.utility.highlightAssetConnections(this.selectedAssetId);
        this.sensors.setVisibility(true);
        break;

      case 'HEAT_MAP':
        // THERMAL RADIATION mode.
        // Heat visibly emanates from the machines themselves — a hot core, an
        // additive aura, ground radiation fall-off, travelling heat waves and
        // drift particles. This deliberately replaces the earlier flat surface
        // tint: the building is not simply painted red.
        this.xray.setEnabled(false);
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        this.lastThermalMetric = metric ?? this.lastThermalMetric;
        this.heatmap.clear();
        this.terrain.setThermalTint(null);
        this.terrain.setWaterThermalTint(null);
        this.thermal.setModeProgress(1);
        this.thermal.applyTelemetry(assets ?? {}, atmospheric?.temperature ?? -28.4);
        break;
    }
  }

  /** Switches the active heat-map metric while already in HEAT_MAP mode. */
  public setHeatMapMetric(
    metric: HeatMapMetric,
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ): void {
    if (this.currentVisionMode !== 'HEAT_MAP') return;
    // Emission is data-driven from live machine temperature; the metric only
    // records operator intent (and drives the legend).
    this.lastThermalMetric = metric;
    this.thermal.applyTelemetry(assets, atmospheric?.temperature ?? -28.4);
  }

  private clearHeatMap(): void {
    // Leaving thermal mode fades the radiation field out and restores colours
    this.thermal.setModeProgress(0);
    this.heatmap.clear();
    this.terrain.setThermalTint(null);
    this.terrain.setWaterThermalTint(null);
    // Restore each asset's true live status colour after a heat-map tint
    this.equipment.assetMaterials.forEach((_material, assetId) => {
      this.equipment.updateAssetStatus(assetId, this.lastStatus.get(assetId) ?? 'NORMAL');
    });
  }

  // ── Interaction ─────────────────────────────────────────────────────────

  /** Highlights the conduits connected to the selected asset. */
  public selectAsset(assetId: string | null): void {
    this.selectedAssetId = assetId;
    if (this.currentVisionMode === 'CONNECTIVITY') {
      this.utility.highlightAssetConnections(assetId);
    }
  }

  // ── Animation ───────────────────────────────────────────────────────────

  public update(dt: number, time: number): void {
    if (this.currentVisionMode === 'CONNECTIVITY') {
      this.utility.update(dt);
    }
    this.thermal.update(dt, time);
    this.sensors.update(time);
  }

  // ── Introspection ───────────────────────────────────────────────────────

  public getVisionMode(): VisionMode {
    return this.currentVisionMode;
  }

  public getAssetGroups(): Map<string, THREE.Group> {
    return this.equipment.assetGroups;
  }

  public getLayout(): StationLayout {
    return this.layout;
  }

  /** Number of service conduits configured for Maitri (UI provenance use). */
  public getRouteCount(): number {
    return this.utility.getRouteCount();
  }

  /** Number of colour-zoned interior rooms defined for Maitri. */
  public getRoomCount(): number {
    return this.interior.getRoomCount();
  }

  /** Number of configured thermal emitters (UI provenance). */
  public getThermalSourceCount(): number {
    return this.thermal.getSourceCount();
  }

  /** Operator-selected thermal metric (drives the thermal legend). */
  public getThermalMetric(): HeatMapMetric {
    return this.lastThermalMetric;
  }

  public dispose(): void {
    this.thermal.dispose();
    this.terrain.dispose();
    this.complex.dispose();
    this.outbuildings.dispose();
    this.interior.dispose();
    this.equipment.dispose();
    this.utility.dispose();
    this.sensors.dispose();
  }
}

/** Compile-time guard: the Maitri model satisfies the shared twin contract. */
export type MaitriStationSatisfiesTwinHandle = MaitriStation extends TwinHandle ? true : false;
