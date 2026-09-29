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

  private currentVisionMode: VisionMode = 'NORMAL';
  private selectedAssetId: string | null = null;

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

    // 7. Mode Controllers
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
  }

  /**
   * Switch Vision Mode: NORMAL, XRAY, CONNECTIVITY, or HEAT_MAP
   */
  public setVisionMode(mode: VisionMode, metric?: HeatMapMetric, assets?: Record<string, TelemetryUpdateItem>, atmospheric?: AtmosphericTelemetry) {
    this.currentVisionMode = mode;

    switch (mode) {
      case 'NORMAL':
        this.xray.setEnabled(false);
        this.heatmap.clear();
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        break;

      case 'XRAY':
        this.xray.setEnabled(true);
        this.heatmap.clear();
        this.utility.setVisibility(true);
        this.sensors.setVisibility(true);
        break;

      case 'CONNECTIVITY':
        // In connectivity mode, make shell translucent so all pipeline links are visible
        this.xray.setEnabled(true);
        this.heatmap.clear();
        this.utility.setVisibility(true);
        this.utility.highlightAssetConnections(this.selectedAssetId);
        this.sensors.setVisibility(true);
        break;

      case 'HEAT_MAP':
        this.xray.setEnabled(false);
        this.utility.setVisibility(false);
        this.sensors.setVisibility(true);
        if (metric && assets) {
          const temp = atmospheric?.temperature ?? -31.8;
          const wind = atmospheric?.wind_speed ?? 18.0;
          this.heatmap.applyMetric(metric, assets, temp, wind);
        }
        break;
    }
  }

  /**
   * Sets heat map metric while in HEAT_MAP mode
   */
  public setHeatMapMetric(
    metric: HeatMapMetric,
    assets: Record<string, TelemetryUpdateItem>,
    atmospheric?: AtmosphericTelemetry
  ) {
    if (this.currentVisionMode === 'HEAT_MAP') {
      const temp = atmospheric?.temperature ?? -31.8;
      const wind = atmospheric?.wind_speed ?? 18.0;
      this.heatmap.applyMetric(metric, assets, temp, wind);
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
      this.equipment.updateAssetStatus(asset.asset_id, asset.status);
      this.sensors.updateStatus(asset.asset_id, asset.status);
    });

    if (this.currentVisionMode === 'HEAT_MAP') {
      const metric = this.heatmap.getActiveMetric();
      const temp = atmospheric?.temperature ?? -31.8;
      const wind = atmospheric?.wind_speed ?? 18.0;
      this.heatmap.applyMetric(metric, assets, temp, wind);
    }
  }

  /**
   * Per-frame animation tick
   */
  public update(dt: number, time: number) {
    if (this.currentVisionMode === 'CONNECTIVITY' || this.currentVisionMode === 'XRAY') {
      this.utility.update(dt);
    }
    this.sensors.update(time);
  }

  public getVisionMode(): VisionMode {
    return this.currentVisionMode;
  }

  public dispose() {
    this.structure.dispose();
    this.building.dispose();
    this.interior.dispose();
    this.equipment.dispose();
    this.utility.dispose();
    this.sensors.dispose();
  }
}
