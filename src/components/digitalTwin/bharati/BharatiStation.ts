import * as THREE from 'three';
import type { VisionMode, HeatMapMetric, TelemetryUpdateItem } from './types';
import type { MachineAssetId, MachineTelemetry } from '../../../types/digitalTwin';
import type { AtmosphericTelemetry } from '../../../services/telemetry/telemetryContracts';
import { StructuralFramework } from './StructuralFramework';
import { StationBuilding } from './StationBuilding';
import { InteriorLayout } from './InteriorLayout';
import { InfrastructureEquipment } from './InfrastructureEquipment';
import { UtilityNetwork } from './UtilityNetwork';
import { SensorMarkers } from './SensorMarkers';
import { XRayController } from './XRayController';
import { HeatMapController } from './HeatMapController';
import { BharatiSite } from './BharatiSite';
import { ThermalRadiationSystem } from '../station/ThermalRadiationSystem';
import { BHARATI_LAYOUT } from '../station/layouts/bharatiLayout';
import type { OperationalStatus } from '../../../types';

/**
 * BharatiStation
 *
 * Master digital twin coordinator for the BHARATI Antarctic Research Station.
 * Encapsulates the entire 3D architectural model, multi-mode vision shaders,
 * utility connectivity, and real-time telemetry synchronization.
 */
export class BharatiStation {
  public rootGroup: THREE.Group;

  public structure: StructuralFramework;
  public building: StationBuilding;
  public interior: InteriorLayout;
  public equipment: InfrastructureEquipment;
  public utility: UtilityNetwork;
  public sensors: SensorMarkers;

  public xray: XRayController;
  public heatmap: HeatMapController;
  /** Coastal site context (Prydz Bay sea, shoreline, container yards, helipad). */
  public site: BharatiSite;
  /** Heat actually radiating from this station's machinery (thermal mode). */
  public thermal: ThermalRadiationSystem;

  private currentVisionMode: VisionMode = 'NORMAL';
  private selectedAssetId: string | null = null;
  /** Last known live status per asset, so heat-map tinting can be undone. */
  private lastStatus: Map<string, OperationalStatus> = new Map();

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'BharatiStation_MasterTwin';

    // 1. Structural undercarriage & stilts
    this.structure = new StructuralFramework();
    this.rootGroup.add(this.structure.group);

    // 2. Interior rooms, labs & command layout
    this.interior = new InteriorLayout();
    this.rootGroup.add(this.interior.group);

    // 3. Machinery assets & infrastructure
    this.equipment = new InfrastructureEquipment();
    this.rootGroup.add(this.equipment.group);

    // 4. Exterior architectural faceted envelope & roofs
    this.building = new StationBuilding();
    this.rootGroup.add(this.building.group);

    // 5. Utility pipeline routing
    this.utility = new UtilityNetwork();
    this.rootGroup.add(this.utility.group);

    // 6. Sensor beacon markers
    this.sensors = new SensorMarkers();
    this.rootGroup.add(this.sensors.group);

    // 7. Coastal site context (sea, shoreline, container yards, helipad)
    this.site = new BharatiSite();
    this.rootGroup.add(this.site.group);

    // 8. Thermal radiation sources (data-driven from the layout manifest)
    this.thermal = new ThermalRadiationSystem(
      'Bharati_ThermalRadiation',
      BHARATI_LAYOUT.thermalSources
    );
    this.rootGroup.add(this.thermal.group);

    // 9. Mode Controllers
    this.xray = new XRayController(this.building, this.interior, this.structure);
    this.heatmap = new HeatMapController(this.building, this.structure, this.equipment);

    // Default to NORMAL mode
    this.setVisionMode('NORMAL');
  }

  /**
   * Initializes all assets and sensor positions with station telemetry
   */
  public initializeTelemetry(assets: Record<MachineAssetId, MachineTelemetry>) {
    this.equipment.initializeEquipment(assets);
    this.sensors.initializeMarkers(assets);
    (Object.keys(assets) as MachineAssetId[]).forEach((id) => this.lastStatus.set(id, assets[id].status));
  }

  /**
   * Switch Vision Mode: NORMAL, XRAY, CONNECTIVITY, or HEAT_MAP
   */
  public setVisionMode(mode: VisionMode, _metric?: HeatMapMetric, assets?: Record<string, TelemetryUpdateItem>, atmospheric?: AtmosphericTelemetry) {
    this.currentVisionMode = mode;

    switch (mode) {
      case 'NORMAL':
        this.building.setThermalMode(false);
        this.equipment.setThermalMode(false);
        this.xray.setEnabled(false);
        this.clearHeatMap();
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        break;

      case 'XRAY':
        this.building.setThermalMode(false);
        this.equipment.setThermalMode(false);
        this.xray.setEnabled(true);
        this.clearHeatMap();
        // In X-Ray mode, internal pipelines and machinery are 100% visible inside the transparent station
        this.utility.setVisibility(true);
        this.utility.highlightAssetConnections(null);
        this.sensors.setVisibility(true);
        break;

      case 'CONNECTIVITY':
        this.building.setThermalMode(false);
        this.equipment.setThermalMode(false);
        // See-through walls so every pipeline link is visible in situ
        this.xray.setEnabled(true);
        this.clearHeatMap();
        this.utility.setVisibility(true);
        this.utility.highlightAssetConnections(this.selectedAssetId);
        this.sensors.setVisibility(true);
        break;

      case 'HEAT_MAP':
        // THERMAL RADIATION mode — heat visibly emanates from the machines
        // themselves (hot core + aura + ground field + travelling heat waves + plumes)
        this.xray.setEnabled(false);
        this.building.setThermalMode(true);
        this.equipment.setThermalMode(true);
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        this.heatmap.clear();
        this.thermal.setModeProgress(1);
        this.thermal.applyTelemetry(assets ?? {}, atmospheric?.temperature ?? -31.8);
        break;
    }
  }

  private clearHeatMap(): void {
    this.thermal.setModeProgress(0);
    this.building.setThermalMode(false);
    this.equipment.setThermalMode(false);
    this.heatmap.clear();
    this.equipment.assetMaterials.forEach((_m, assetId) => {
      this.equipment.updateAssetStatus(assetId, this.lastStatus.get(assetId) ?? 'NORMAL');
    });
  }

  /**
   * Sets heat map metric while in HEAT_MAP mode
   */
  public setHeatMapMetric(
    _metric: HeatMapMetric,
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ) {
    if (this.currentVisionMode === 'HEAT_MAP') {
      // Emission is data-driven from live machine temperature
      this.thermal.applyTelemetry(assets, atmospheric?.temperature ?? -31.8);
    }
  }

  /**
   * Selects an equipment node: highlights directly connected infrastructure & pipeline paths
   */
  public selectAsset(assetId: string | null) {
    this.selectedAssetId = assetId;

    if (this.currentVisionMode === 'CONNECTIVITY') {
      this.utility.highlightAssetConnections(assetId);
    }
  }

  /**
   * Real-time reactive updates from the central simulation engine
   */
  public updateTelemetry(
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ) {
    Object.values(assets).forEach((asset) => {
      this.lastStatus.set(asset.asset_id, asset.status);
      this.equipment.updateAssetStatus(asset.asset_id, asset.status);
      this.sensors.updateStatus(asset.asset_id, asset.status);
    });

    if (this.currentVisionMode === 'HEAT_MAP') {
      // Re-derive every machine's heat emission from the live plant state
      this.thermal.applyTelemetry(assets, atmospheric?.temperature ?? -31.8);
    }
  }

  /**
   * Per-frame animation tick
   */
  public update(dt: number, time: number) {
    if (this.currentVisionMode === 'CONNECTIVITY' || this.currentVisionMode === 'XRAY') {
      this.utility.update(dt);
    }
    this.thermal.update(dt, time);
    this.site.update(dt, time);
    this.sensors.update(time);
  }

  public getVisionMode(): VisionMode {
    return this.currentVisionMode;
  }

  /**
   * Asset mesh registry, keyed by asset id. Required by the shared station twin
   * contract so DigitalTwinPanel can register raycast targets generically.
   */
  public getAssetGroups(): Map<string, THREE.Group> {
    return this.equipment.assetGroups;
  }

  /** Number of configured thermal emitters (UI provenance). */
  public getThermalSourceCount(): number {
    return this.thermal.getSourceCount();
  }

  public dispose() {
    this.thermal.dispose();
    this.site.dispose();
    this.structure.dispose();
    this.building.dispose();
    this.interior.dispose();
    this.equipment.dispose();
    this.utility.dispose();
    this.sensors.dispose();
  }
}
