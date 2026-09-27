/**
 * DAKSHIN TYPINGS & DATA CONTRACTS
 * Antarctic Operations Remote Control Center (PC2)
 */

export type StationId = 'maitri' | 'bharati';

export type ConnectionStatus =
  | 'ONLINE'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'RECONNECTING'
  | 'SYNCHRONIZING';

export type OperationalStatus =
  | 'NORMAL'
  | 'DEGRADING'
  | 'WARNING'
  | 'CRITICAL'
  | 'FAILED'
  | 'OFFLINE'
  | 'UNKNOWN';

export interface StationConfig {
  id: StationId;
  name: string;
  fullName: string;
  configuredLocation: string;
  coordinates: {
    lat: string;
    long: string;
  };
  elevationMeters: number;
  establishedYear: number;
  timezoneOffset: number; // e.g. +5 for IST / Station standard
  connectionStatus: ConnectionStatus;
  lastSyncTimestamp: string;
  stationHealthPct: number;
  activeAlertCount: number;
  outsideTempCelsius: number;
  windSpeedMps: number;
}
