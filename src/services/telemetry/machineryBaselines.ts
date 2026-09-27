/**
 * DAKSHIN — MACHINERY PROTOTYPE SIMULATION BASELINES
 *
 * NOTE: These baseline specifications are calibrated prototype baselines
 * for demonstration and operational simulation. They are explicitly
 * labeled as "Prototype simulation baseline" and should not be represented
 * as certified manufacturer equipment specifications.
 */

import type { MachineAssetId } from '../../types/digitalTwin';
import type { MachineryBaseline } from './telemetryContracts';

export const PROTOTYPE_MACHINERY_BASELINES: Record<MachineAssetId, MachineryBaseline> = {
  'GEN-01': {
    asset_id: 'GEN-01',
    name: 'Primary Diesel Generator 01',
    asset_type: 'generator',
    nominal_state: 'NORMAL',
    baseline_temperature: 78.0, // °C
    baseline_vibration: 2.2, // mm/s RMS
    baseline_current: 72.0, // A
    baseline_power: 125.0, // kW
    baseline_efficiency: 91.0, // %
    baseline_fuel_consumption: 28.5, // L/h
    baseline_operating_hours: 3840,
    maintenance_interval_hours: 500,
    health_score: 94,
    thresholds: {
      temp_warn: 85.0,
      temp_crit: 95.0,
      vib_warn: 4.5,
      vib_crit: 6.5,
      curr_warn: 85.0,
      curr_crit: 98.0,
      eff_warn: 80.0,
      eff_crit: 70.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'GEN-02': {
    asset_id: 'GEN-02',
    name: 'Secondary Standby Generator',
    asset_type: 'generator',
    nominal_state: 'NORMAL',
    baseline_temperature: 42.0, // °C (standby warm jacket)
    baseline_vibration: 0.8, // mm/s
    baseline_current: 0.0, // Standby idle
    baseline_power: 0.0, // kW
    baseline_efficiency: 98.0, // Cold readiness
    baseline_fuel_consumption: 1.2, // Idle preheater L/h
    baseline_operating_hours: 1200,
    maintenance_interval_hours: 500,
    health_score: 99,
    thresholds: {
      temp_warn: 65.0,
      temp_crit: 85.0,
      vib_warn: 3.5,
      vib_crit: 5.5,
      curr_warn: 75.0,
      curr_crit: 90.0,
      eff_warn: 82.0,
      eff_crit: 72.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'BAT-01': {
    asset_id: 'BAT-01',
    name: 'Station BESS Energy Storage Matrix',
    asset_type: 'battery',
    nominal_state: 'NORMAL',
    baseline_temperature: 19.5, // °C internal thermal bath
    baseline_vibration: 0.1, // mm/s
    baseline_current: 34.0, // Float charge/discharge A
    baseline_power: 45.0, // kW
    baseline_efficiency: 95.5, // %
    baseline_fuel_consumption: 0.0, // N/A
    baseline_operating_hours: 5120,
    maintenance_interval_hours: 2000,
    health_score: 96,
    thresholds: {
      temp_warn: 28.0,
      temp_crit: 38.0,
      vib_warn: 1.0,
      vib_crit: 2.5,
      curr_warn: 65.0,
      curr_crit: 85.0,
      eff_warn: 85.0,
      eff_crit: 75.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'FUEL-01': {
    asset_id: 'FUEL-01',
    name: 'Antarctic Grade Fuel Storage & Feed',
    asset_type: 'fuel_system',
    nominal_state: 'NORMAL',
    baseline_temperature: -4.5, // °C (fuel jacket preheat)
    baseline_vibration: 0.6, // mm/s
    baseline_current: 12.0, // Circulation pump A
    baseline_power: 8.5, // kW
    baseline_efficiency: 96.0, // %
    baseline_fuel_consumption: 0.0,
    baseline_operating_hours: 8760,
    maintenance_interval_hours: 1500,
    health_score: 93,
    thresholds: {
      temp_warn: 12.0,
      temp_crit: 25.0,
      vib_warn: 3.0,
      vib_crit: 5.0,
      curr_warn: 24.0,
      curr_crit: 35.0,
      eff_warn: 80.0,
      eff_crit: 65.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'PUMP-01': {
    asset_id: 'PUMP-01',
    name: 'Closed-Loop Glycol Hydronic Feed',
    asset_type: 'pump',
    nominal_state: 'NORMAL',
    baseline_temperature: 38.0, // °C
    baseline_vibration: 1.8, // mm/s
    baseline_current: 18.5, // A
    baseline_power: 14.0, // kW
    baseline_efficiency: 89.0, // %
    baseline_fuel_consumption: 0.0,
    baseline_operating_hours: 6240,
    maintenance_interval_hours: 750,
    health_score: 91,
    thresholds: {
      temp_warn: 58.0,
      temp_crit: 72.0,
      vib_warn: 4.0,
      vib_crit: 6.2,
      curr_warn: 28.0,
      curr_crit: 38.0,
      eff_warn: 75.0,
      eff_crit: 60.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'HEATER-01': {
    asset_id: 'HEATER-01',
    name: 'Habitat HVAC & Life-Support Exchanger',
    asset_type: 'hvac',
    nominal_state: 'NORMAL',
    baseline_temperature: 22.4, // °C supply air
    baseline_vibration: 0.9, // mm/s blower
    baseline_current: 28.0, // A
    baseline_power: 32.0, // kW thermal electric
    baseline_efficiency: 92.0, // %
    baseline_fuel_consumption: 0.0,
    baseline_operating_hours: 9120,
    maintenance_interval_hours: 1000,
    health_score: 95,
    thresholds: {
      temp_warn: 32.0,
      temp_crit: 45.0,
      vib_warn: 3.2,
      vib_crit: 5.0,
      curr_warn: 45.0,
      curr_crit: 60.0,
      eff_warn: 78.0,
      eff_crit: 65.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },

  'ENV-01': {
    asset_id: 'ENV-01',
    name: 'Automated Weather Station (AWS) Mast Array',
    asset_type: 'environmental',
    nominal_state: 'NORMAL',
    baseline_temperature: -28.0, // Ambient probe °C
    baseline_vibration: 0.4, // Structural mast wind vib
    baseline_current: 2.2, // De-icing heater current A
    baseline_power: 1.8, // kW
    baseline_efficiency: 99.0, // Telemetry packet transmission %
    baseline_fuel_consumption: 0.0,
    baseline_operating_hours: 14200,
    maintenance_interval_hours: 2500,
    health_score: 98,
    thresholds: {
      temp_warn: 10.0,
      temp_crit: 25.0,
      vib_warn: 3.0,
      vib_crit: 5.5,
      curr_warn: 6.0,
      curr_crit: 10.0,
      eff_warn: 85.0,
      eff_crit: 70.0,
    },
    provenance_note: 'Prototype simulation baseline',
  },
};
