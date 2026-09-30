import type { MachineAssetId } from '../../../types/digitalTwin';

export type VisionMode = 'NORMAL' | 'XRAY' | 'CONNECTIVITY' | 'HEAT_MAP';

export type HeatMapMetric =
  | 'temperature'
  | 'wind'
  | 'power'
  | 'structural'
  | 'fuel';

export type CameraPresetId =
  | 'aerial'
  | 'front'
  | 'side'
  | 'infra'
  | 'plan';

export interface UtilityRoute {
  id: string;
  name: string;
  type: 'power' | 'glycol' | 'water' | 'fuel' | 'comms' | 'wastewater' | 'air';
  color: string;
  points: [number, number, number][];
  diameter: number;
  flowDirection?: 1 | -1;
  sourceAssetId?: MachineAssetId;
  targetAssetId?: MachineAssetId | string;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  category: 'primary' | 'auxiliary' | 'structural';
  position: [number, number, number];
  connectedAssetIds: (MachineAssetId | string)[];
  description: string;
}

export interface TelemetryUpdateItem {
  asset_id: MachineAssetId;
  status: any;
  temperature?: number;
  current_temperature?: number;
  vibration?: number;
  current_vibration?: number;
  power?: number;
  current_power?: number;
  fuel?: number;
  current_fuel?: number;
}
