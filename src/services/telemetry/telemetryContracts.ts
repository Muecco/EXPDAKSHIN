/**
 * DAKSHIN TELEMETRY CONTRACTS & ADAPTER INTERFACES
 *
 * Defines the unified data contracts for:
 * 1. Atmospheric Telemetry & Historical Trends
 * 2. Machinery Baselines & Live Telemetry
 * 3. Multi-variable Explainable Risk Scores
 * 4. Simulation Alerts & Event Timelines
 * 5. Simulation Scenarios & Control States
 *
 * NOTE: This contract represents the exact schema that future MQTT / WebSocket
 * ingestion will deliver from PC1 to PC2.
 */

import type { StationId, OperationalStatus, ConnectionStatus } from '../../types';
import type { MachineAssetId, MaintenanceRecord } from '../../types/digitalTwin';
import type { WeatherState } from '../../types/weather';

// ---------------------------------------------------------------------------
// Atmospheric Contracts
// ---------------------------------------------------------------------------

export type AtmosphericVariable =
  | 'temperature'
  | 'wind_speed'
  | 'wind_direction'
  | 'pressure'
  | 'humidity';

export interface AtmosphericDataPoint {
  timestamp: string; // ISO format or UTC time string
  temperature: number; // Celsius
  wind_speed: number; // m/s
  wind_direction: number; // degrees 0-360
  wind_direction_cardinal: string; // e.g. "ESE", "S", "WSW"
  pressure: number; // hPa
  humidity: number; // %
  weather_state: WeatherState;
  is_synthetic?: boolean; // True if synthetic extension based on historical patterns
}

export interface AtmosphericTelemetry extends AtmosphericDataPoint {
  station_id: StationId;
  provenance: string; // "Historical-data-driven simulation — IMD Antarctic Meteorological Record"
}

export type TimeRangeFilter = '24H' | '7D' | '1M' | '3M' | 'CUSTOM';

export interface AtmosphericTrendStats {
  variable: AtmosphericVariable;
  current: number;
  min: number;
  max: number;
  avg: number;
  unit: string;
  trend_direction: 'rising' | 'falling' | 'stable' | 'veering' | 'backing';
  time_range: TimeRangeFilter;
  sample_count: number;
}

// ---------------------------------------------------------------------------
// Machinery Baseline & Telemetry Contracts
// ---------------------------------------------------------------------------

export type RiskState = 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface RiskBreakdown {
  score: number; // 0 - 100
  state: RiskState;
  temperature_contribution: number; // 0 - 30
  vibration_contribution: number; // 0 - 30
  current_contribution: number; // 0 - 20
  efficiency_contribution: number; // 0 - 20
  contributors: string[]; // Explainable bullet points
}

export interface MachineryBaseline {
  asset_id: MachineAssetId;
  name: string;
  asset_type: 'generator' | 'battery' | 'fuel_system' | 'pump' | 'hvac' | 'environmental';
  nominal_state: OperationalStatus;
  baseline_temperature: number; // °C
  baseline_vibration: number; // mm/s
  baseline_current: number; // A
  baseline_power: number; // kW
  baseline_efficiency: number; // %
  baseline_fuel_consumption: number; // L/h or %/h
  baseline_operating_hours: number;
  maintenance_interval_hours: number;
  health_score: number; // 0 - 100
  thresholds: {
    temp_warn: number;
    temp_crit: number;
    vib_warn: number;
    vib_crit: number;
    curr_warn: number;
    curr_crit: number;
    eff_warn: number;
    eff_crit: number;
  };
  provenance_note: string; // "Prototype simulation baseline"
}

export interface MachineryDeviation {
  temperature_diff: number; // current - baseline
  vibration_diff: number;
  current_diff: number;
  power_diff: number;
  efficiency_diff: number;
  fuel_consumption_diff: number;
}

export interface MachineryTelemetryWithBaseline {
  asset_id: MachineAssetId;
  station_id: StationId;
  name: string;
  asset_type: 'generator' | 'battery' | 'fuel_system' | 'pump' | 'hvac' | 'environmental';
  status: OperationalStatus;
  current_temperature: number;
  current_vibration: number;
  current_current: number;
  current_power: number;
  current_efficiency: number;
  current_fuel: number; // % level
  current_fuel_consumption: number; // L/h
  operating_hours: number;
  position: [number, number, number];
  maintenance?: MaintenanceRecord;
  baseline: MachineryBaseline;
  deviation: MachineryDeviation;
  risk: RiskBreakdown;
  last_update: string;
  data_source: string; // "Synthetic Machinery Simulation"
  possible_issue?: string;
}

// ---------------------------------------------------------------------------
// Environment -> Machinery Coupling Chain
// ---------------------------------------------------------------------------

export interface CouplingChainState {
  outside_temp: number; // °C
  heating_demand_pct: number; // 0 - 100%
  station_electrical_load_kw: number; // kW
  generator_load_pct: number; // 0 - 100%
  total_fuel_consumption_rate: number; // L/h
  machinery_stress_index: number; // 0 - 100
  overall_risk_score: number; // 0 - 100
  active_coupling_text: string;
}

// ---------------------------------------------------------------------------
// Alerts & Incident Center Contracts
// ---------------------------------------------------------------------------

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertSource =
  | 'ATMOSPHERIC_SIMULATION'
  | 'MACHINERY_SIMULATION'
  | 'SYSTEM'
  | 'COMMUNICATION';

export interface SimulationAlert {
  alert_id: string;
  timestamp: string;
  station_id: StationId;
  asset_id?: MachineAssetId;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: AlertSource;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_at?: string;
}

// ---------------------------------------------------------------------------
// Event Timeline
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  event_id: string;
  timestamp: string;
  station_id: StationId;
  asset_id?: MachineAssetId;
  category: 'SCENARIO' | 'ATMOSPHERIC' | 'MACHINERY' | 'ALERT' | 'SYSTEM';
  title: string;
  description: string;
  severity?: AlertSeverity;
}

// ---------------------------------------------------------------------------
// Scenario Contracts
// ---------------------------------------------------------------------------

export type AtmosphericScenarioId =
  | 'NORMAL_WEATHER'
  | 'EXTREME_COLD'
  | 'HIGH_WIND'
  | 'HEAVY_SNOW'
  | 'BLIZZARD';

export type MachineryScenarioId =
  | 'NORMAL_MACHINERY'
  | 'GENERATOR_VIBRATION'
  | 'GENERATOR_OVERHEAT'
  | 'GENERATOR_OVERLOAD'
  | 'PUMP_DEGRADATION'
  | 'HEATER_FAILURE'
  | 'BATTERY_LOW';

export type CombinedScenarioId =
  | 'ANTARCTIC_EXTREME_EVENT'
  | 'CASCADING_LOAD_EVENT'
  | 'MULTI_ASSET_DEGRADATION';

export type ScenarioId =
  | AtmosphericScenarioId
  | MachineryScenarioId
  | CombinedScenarioId;

export interface SimulationScenarioDefinition {
  id: ScenarioId;
  name: string;
  category: 'atmospheric' | 'machinery' | 'combined';
  description: string;
  badge_label: string;
}

// ---------------------------------------------------------------------------
// Telemetry Provider Adapter Interface
// ---------------------------------------------------------------------------

export interface ITelemetryProvider {
  getAtmosphericTelemetry(stationId: StationId): AtmosphericTelemetry;
  getAtmosphericHistory(stationId: StationId, range: TimeRangeFilter, start?: string, end?: string): AtmosphericDataPoint[];
  getMachineryTelemetry(stationId: StationId): Record<MachineAssetId, MachineryTelemetryWithBaseline>;
  getCouplingChainState(stationId: StationId): CouplingChainState;
  getAlerts(stationId: StationId): SimulationAlert[];
  getTimelineEvents(stationId: StationId): TimelineEvent[];
  getConnectionStatus(): ConnectionStatus;
  isSimulationActive(): boolean;
  triggerScenario(scenarioId: ScenarioId, stationId: StationId): void;
  resetSimulation(stationId?: StationId): void;
  toggleRemoteLinkOffline(offline: boolean): void;
  acknowledgeAlert(alertId: string): void;
}
