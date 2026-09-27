import type { StationId, OperationalStatus } from './index';

export type MachineAssetId =
  | 'GEN-01'
  | 'GEN-02'
  | 'BAT-01'
  | 'FUEL-01'
  | 'PUMP-01'
  | 'HEATER-01'
  | 'ENV-01';

// ---------------------------------------------------------------------------
// Maintenance Record
// ---------------------------------------------------------------------------

export type MaintenanceState =
  | 'NORMAL'
  | 'DUE'
  | 'OVERDUE'
  | 'IN_PROGRESS';

export interface SparePartHint {
  part_name: string;
  part_code: string;
  /** Availability status — sourced from inventory service when available */
  availability: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
}

export interface MaintenanceRecord {
  state: MaintenanceState;
  /** ISO date string or null if no record */
  last_maintenance: string | null;
  /** ISO date string or null if not scheduled */
  next_maintenance: string | null;
  /** Cumulative powered-on hours */
  operating_hours: number;
  /** Known issue description for current maintenance period */
  known_issue?: string;
  /** Engineer-recommended action */
  recommended_action?: string;
  /** Relevant spare parts for the known issue */
  spare_parts?: SparePartHint[];
  /** DEMO DATA marker — remove when real maintenance service is connected */
  _demo: true;
}

// ---------------------------------------------------------------------------
// Machine Telemetry
// ---------------------------------------------------------------------------

export interface MachineTelemetry {
  asset_id: MachineAssetId;
  station_id: StationId;
  name: string;
  asset_type: 'generator' | 'battery' | 'fuel_system' | 'pump' | 'hvac' | 'environmental';
  status: OperationalStatus;
  temperature: number;  // in Celsius
  vibration: number;    // mm/s RMS
  current: number;      // Amperes
  power: number;        // kW
  fuel: number;         // percentage (also used as state-of-charge for BAT-01)
  efficiency: number;   // percentage
  failure_risk: number; // 0 - 100
  last_update: string;
  possible_issue?: string;
  // Optional fields — show "Not available" in UI if absent
  operating_hours?: number;   // cumulative powered hours
  voltage?: number;           // Volts (battery assets)
  flow_rate?: number;         // L/min (pump assets)
  // Position in 3D scene relative to station origin [x, y, z]
  position: [number, number, number];
  // Maintenance record — optional until maintenance service is connected
  maintenance?: MaintenanceRecord;
}

export interface StationDigitalTwinData {
  station_id: StationId;
  station_name: string;
  calculated_health_pct: number;
  assets: Record<MachineAssetId, MachineTelemetry>;
}

