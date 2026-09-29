import type { HeatMapMetric, TelemetryUpdateItem } from './types';
import type { StationBuilding } from './StationBuilding';
import type { StructuralFramework } from './StructuralFramework';
import type { InfrastructureEquipment } from './InfrastructureEquipment';

export interface HeatMapLegendConfig {
  metric: HeatMapMetric;
  label: string;
  unit: string;
  min: number;
  max: number;
  gradient: { stop: number; color: string; label: string }[];
}

export const HEAT_MAP_CONFIGS: Record<HeatMapMetric, HeatMapLegendConfig> = {
  temperature: {
    metric: 'temperature',
    label: 'SURFACE & EQUIPMENT TEMPERATURE',
    unit: '°C',
    min: -35,
    max: 95,
    gradient: [
      { stop: 0, color: '#1E3A8A', label: '-35°C (Polar ambient)' },
      { stop: 0.35, color: '#0284C7', label: '0°C (Freezing)' },
      { stop: 0.55, color: '#10B981', label: '+22°C (Habitat nominal)' },
      { stop: 0.75, color: '#F59E0B', label: '+60°C (HVAC heat recovery)' },
      { stop: 1.0, color: '#DC2626', label: '+95°C (Turbine exhaust)' },
    ],
  },
  wind: {
    metric: 'wind',
    label: 'AERODYNAMIC WIND PRESSURE & EXPOSURE',
    unit: 'm/s',
    min: 0,
    max: 35,
    gradient: [
      { stop: 0, color: '#1E3A8A', label: '0 m/s (Leeward sheltered wake)' },
      { stop: 0.4, color: '#0284C7', label: '12 m/s (Underside drift)' },
      { stop: 0.7, color: '#F59E0B', label: '22 m/s (Roof terrace sweep)' },
      { stop: 1.0, color: '#DC2626', label: '35 m/s (Windward stagnation peak)' },
    ],
  },
  power: {
    metric: 'power',
    label: 'ELECTRICAL BUS LOAD & CONSUMPTION',
    unit: 'kW',
    min: 0,
    max: 160,
    gradient: [
      { stop: 0, color: '#1E293B', label: '0 kW (Offline / Standby)' },
      { stop: 0.3, color: '#0284C7', label: '40 kW (Base life support)' },
      { stop: 0.6, color: '#F59E0B', label: '90 kW (Medium load)' },
      { stop: 1.0, color: '#DC2626', label: '150 kW (Peak generator draw)' },
    ],
  },
  structural: {
    metric: 'structural',
    label: 'STILT STRESS & FOUNDATION VIBRATION',
    unit: 'mm/s',
    min: 0,
    max: 10,
    gradient: [
      { stop: 0, color: '#10B981', label: '< 1.5 mm/s (Nominal structural state)' },
      { stop: 0.45, color: '#F59E0B', label: '4.5 mm/s (Moderate foundation sway)' },
      { stop: 1.0, color: '#DC2626', label: '> 8.0 mm/s (Critical cavitation resonance)' },
    ],
  },
  fuel: {
    metric: 'fuel',
    label: 'CRYOGENIC FUEL BUFFER CAPACITY',
    unit: '%',
    min: 0,
    max: 100,
    gradient: [
      { stop: 0, color: '#DC2626', label: '< 20% (Emergency reserve threshold)' },
      { stop: 0.4, color: '#F59E0B', label: '50% (Operating level)' },
      { stop: 1.0, color: '#10B981', label: '85 - 100% (Nominal polar bunker)' },
    ],
  },
};

/**
 * HeatMapController
 *
 * Coordinates false-color heat map visualization on Bharati station meshes.
 */
export class HeatMapController {
  private building: StationBuilding;
  private structure: StructuralFramework;
  private equipment: InfrastructureEquipment;
  private currentMetric: HeatMapMetric = 'temperature';
  private isActive: boolean = false;

  constructor(
    building: StationBuilding,
    structure: StructuralFramework,
    equipment: InfrastructureEquipment
  ) {
    this.building = building;
    this.structure = structure;
    this.equipment = equipment;
  }

  public applyMetric(
    metric: HeatMapMetric,
    assets: Record<string, TelemetryUpdateItem>,
    atmosphericTemp: number,
    windSpeed: number
  ) {
    this.currentMetric = metric;
    this.isActive = true;

    if (metric === 'temperature') {
      // Windward / exterior is cold, conditioned by atmospheric temperature
      const exteriorHex = atmosphericTemp < -25 ? '#1E3A8A' : '#0284C7';
      this.building.setHeatMapColor(exteriorHex);
      this.structure.setHeatMapColor('#1E3A8A');

      // Update equipment to their thermal status
      Object.values(assets).forEach((asset) => {
        const temp = asset.temperature ?? asset.current_temperature ?? 20;
        let hex = '#10B981'; // 20-30°C nominal
        if (temp > 75) hex = '#DC2626'; // Hot generator / overheating pump
        else if (temp > 50) hex = '#F59E0B'; // Warm pump / heater
        else if (temp < 0) hex = '#1E3A8A'; // Subzero fuel tank
        this.equipment.updateAssetStatus(asset.asset_id, asset.status);
        const mat = this.equipment.assetMaterials.get(asset.asset_id);
        if (mat) {
          mat.color.set(hex);
          mat.emissive.set(hex);
          mat.emissiveIntensity = 0.4;
        }
      });
    } else if (metric === 'wind') {
      // Stagnation pressure scales with wind speed
      const peakColor = windSpeed > 20 ? '#DC2626' : '#F59E0B';
      this.building.setHeatMapColor(peakColor);
      this.structure.setHeatMapColor('#D97706');
    } else if (metric === 'power') {
      this.building.setHeatMapColor('#334155');
      this.structure.setHeatMapColor('#1E293B');

      Object.values(assets).forEach((asset) => {
        const pow = asset.power ?? asset.current_power ?? 0;
        let hex = '#1E293B';
        if (pow > 100) hex = '#DC2626';
        else if (pow > 40) hex = '#F59E0B';
        else if (pow > 0) hex = '#0284C7';
        const mat = this.equipment.assetMaterials.get(asset.asset_id);
        if (mat) {
          mat.color.set(hex);
          mat.emissive.set(hex);
          mat.emissiveIntensity = 0.4;
        }
      });
    } else if (metric === 'structural') {
      // Highlights vibration spots (PUMP-01 has 8.4 mm/s vibration -> RED)
      this.building.setHeatMapColor('#475569');
      this.structure.setHeatMapColor('#10B981'); // Stilts nominal

      Object.values(assets).forEach((asset) => {
        const vib = asset.vibration ?? asset.current_vibration ?? 0.5;
        let hex = '#10B981';
        if (vib > 6.0) hex = '#DC2626';
        else if (vib > 3.0) hex = '#F59E0B';
        const mat = this.equipment.assetMaterials.get(asset.asset_id);
        if (mat) {
          mat.color.set(hex);
          mat.emissive.set(hex);
          mat.emissiveIntensity = 0.4;
        }
      });
    } else if (metric === 'fuel') {
      this.building.setHeatMapColor('#334155');
      this.structure.setHeatMapColor('#1E293B');

      // FUEL-01 is 81% -> Green / Gold
      const fuelMat = this.equipment.assetMaterials.get('FUEL-01');
      if (fuelMat) {
        fuelMat.color.set('#10B981');
        fuelMat.emissive.set('#10B981');
        fuelMat.emissiveIntensity = 0.4;
      }
    }
  }

  public clear() {
    this.isActive = false;
    this.building.setHeatMapColor(null);
    this.structure.setHeatMapColor(null);
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getActiveMetric(): HeatMapMetric {
    return this.currentMetric;
  }

  public getLegendConfig(): HeatMapLegendConfig {
    return HEAT_MAP_CONFIGS[this.currentMetric];
  }
}
