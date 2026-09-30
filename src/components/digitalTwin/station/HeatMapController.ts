/**
 * DAKSHIN — STATION-AGNOSTIC HEAT MAP CONTROLLER
 *
 * Owns the heat-map legend definitions (single source of truth for both
 * stations) and applies a selected metric to a station's surfaces through the
 * `HeatMapTargets` adapter, so no station-specific class knowledge is needed.
 *
 * Metrics: temperature, wind exposure, power draw, structural condition, fuel.
 *
 * NOTE: colours and thresholds are calibrated prototype values for mission
 * control decision support, not certified instrumentation scales. Where live
 * readings are unavailable the caller passes simulated values.
 */

import type { HeatMapLegendConfig, HeatMapMetric, HeatMapTargets, TelemetryUpdateItem } from './types';

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
      { stop: 0.75, color: '#F59E0B', label: '+60°C (Heat recovery)' },
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
    label: 'FUEL BUFFER CAPACITY',
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

export class HeatMapController {
  private targets: HeatMapTargets;
  private currentMetric: HeatMapMetric = 'temperature';
  private isActive = false;

  constructor(targets: HeatMapTargets) {
    this.targets = targets;
  }

  /**
   * Applies a heat-map metric across the station envelope, structure and
   * equipment materials.
   *
   * @param metric          Selected metric
   * @param assets          Live (or simulated) telemetry per asset
   * @param atmosphericTemp Simulated/site ambient temperature (°C)
   * @param windSpeed       Simulated/site wind speed (m/s)
   */
  public applyMetric(
    metric: HeatMapMetric,
    assets: Record<string, TelemetryUpdateItem>,
    atmosphericTemp: number,
    windSpeed: number
  ): void {
    this.currentMetric = metric;
    this.isActive = true;

    const values = Object.values(assets);

    switch (metric) {
      case 'temperature': {
        // Exterior follows the ambient temperature trend
        const exterior = atmosphericTemp < -25 ? '#1E3A8A' : '#0284C7';
        this.targets.setEnvelopeColor(exterior);
        this.targets.setStructureColor('#1E3A8A');

        values.forEach((asset) => {
          const temp = asset.temperature ?? asset.current_temperature ?? 20;
          let hex = '#10B981'; // nominal 20-30°C
          if (temp > 75) hex = '#DC2626';
          else if (temp > 50) hex = '#F59E0B';
          else if (temp < 0) hex = '#1E3A8A';
          this.targets.setEquipmentColor(asset.asset_id, hex, 0.4);
        });
        break;
      }

      case 'wind': {
        // Stagnation pressure on the windward face scales with wind speed
        const peak = windSpeed > 20 ? '#DC2626' : windSpeed > 10 ? '#F59E0B' : '#0284C7';
        this.targets.setEnvelopeColor(peak);
        this.targets.setStructureColor('#D97706');
        break;
      }

      case 'power': {
        this.targets.setEnvelopeColor('#334155');
        this.targets.setStructureColor('#1E293B');

        values.forEach((asset) => {
          const power = asset.power ?? asset.current_power ?? 0;
          let hex = '#1E293B';
          if (power > 100) hex = '#DC2626';
          else if (power > 40) hex = '#F59E0B';
          else if (power > 0) hex = '#0284C7';
          this.targets.setEquipmentColor(asset.asset_id, hex, 0.4);
        });
        break;
      }

      case 'structural': {
        this.targets.setEnvelopeColor('#475569');
        this.targets.setStructureColor('#10B981');

        values.forEach((asset) => {
          const vibration = asset.vibration ?? asset.current_vibration ?? 0.5;
          let hex = '#10B981';
          if (vibration > 6.0) hex = '#DC2626';
          else if (vibration > 3.0) hex = '#F59E0B';
          this.targets.setEquipmentColor(asset.asset_id, hex, 0.4);
        });
        break;
      }

      case 'fuel': {
        this.targets.setEnvelopeColor('#334155');
        this.targets.setStructureColor('#1E293B');

        values.forEach((asset) => {
          const fuel = asset.fuel ?? asset.current_fuel;
          if (fuel === undefined) return;
          let hex = '#10B981';
          if (fuel < 20) hex = '#DC2626';
          else if (fuel < 50) hex = '#F59E0B';
          this.targets.setEquipmentColor(asset.asset_id, hex, 0.4);
        });
        break;
      }
    }
  }

  /** Restores normal station colours. */
  public clear(): void {
    this.isActive = false;
    this.targets.setEnvelopeColor(null);
    this.targets.setStructureColor(null);
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
