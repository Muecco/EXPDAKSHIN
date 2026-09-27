import React, { useState, useCallback } from 'react';
import {
  X,
  Activity,
  Thermometer,
  Zap,
  Gauge,
  Droplets,
  Battery,
  Wrench,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Loader,
  Package,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
} from 'lucide-react';
import type { MachineTelemetry } from '../../types/digitalTwin';
import type { UserRole, CommandType } from '../../types/commands';
import type { CommandFeedback } from '../../types/commands';
import { PROTOTYPE_MACHINERY_BASELINES } from '../../services/telemetry/machineryBaselines';
import { calculateAssetRisk } from '../../services/telemetry/riskModel';
import {
  ASSET_COMMANDS,
  COMMAND_ROLES,
  MAINTENANCE_ROLES,
} from '../../types/commands';
import {
  submitCommand,
  createCommandRequest,
  recordCommandFeedback,
  getCommandLog,
} from '../../services/commands';
import { CommandConfirmModal } from './CommandConfirmModal';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssetDetailPanelProps {
  asset: MachineTelemetry;
  userRole: UserRole;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maintenanceStateColor(state: string): string {
  switch (state) {
    case 'NORMAL': return '#059669';
    case 'DUE': return '#D97706';
    case 'OVERDUE': return '#DC2626';
    case 'IN_PROGRESS': return '#0369A1';
    default: return '#94A3B8';
  }
}

function availabilityColor(avail: string): string {
  switch (avail) {
    case 'AVAILABLE': return '#059669';
    case 'LOW_STOCK': return '#D97706';
    case 'OUT_OF_STOCK': return '#DC2626';
    default: return '#94A3B8';
  }
}

function commandStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return '#059669';
    case 'REJECTED':
    case 'FAILED': return '#DC2626';
    case 'EXECUTING': return '#0369A1';
    case 'VALIDATING': return '#D97706';
    default: return '#94A3B8';
  }
}

function commandStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle size={12} />;
    case 'REJECTED':
    case 'FAILED': return <AlertTriangle size={12} />;
    case 'EXECUTING':
    case 'VALIDATING':
    case 'REQUESTED': return <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />;
    default: return null;
  }
}

const fmt = (v: number | undefined, unit: string, decimals = 1): string =>
  v !== undefined ? `${v.toFixed(decimals)} ${unit}` : 'Not available';

const fmtInt = (v: number | undefined, unit: string): string =>
  v !== undefined ? `${Math.round(v)} ${unit}` : 'Not available';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const TelemetryRow: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
  alert?: boolean;
}> = ({ label, value, icon, alert }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.35rem 0',
      borderBottom: '1px solid rgba(0, 78, 100, 0.07)',
    }}
  >
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.73rem',
        color: 'var(--text-muted)',
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </span>
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: alert ? '#DC2626' : 'var(--deep-teal)',
      }}
    >
      {value}
    </span>
  </div>
);

const SectionHeader: React.FC<{ label: string; icon: React.ReactNode }> = ({ label, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.68rem',
      fontWeight: 800,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '0.5rem',
      paddingBottom: '0.35rem',
      borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
    }}
  >
    {icon}
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  asset,
  userRole,
  onClose,
}) => {
  const canCommand = COMMAND_ROLES.includes(userRole);
  const canMaintenance = MAINTENANCE_ROLES.includes(userRole);
  const commandableTypes = ASSET_COMMANDS[asset.asset_type] ?? [];
  const hasCommands = commandableTypes.length > 0 && canCommand;

  // Command state machine
  const [commandInProgress, setCommandInProgress] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<CommandFeedback | null>(null);
  const [commandLog, setCommandLog] = useState<CommandFeedback[]>(() =>
    getCommandLog(asset.asset_id)
  );
  const [confirmCmd, setConfirmCmd] = useState<'STOP' | null>(null);

  // UI expand states
  const [maintenanceExpanded, setMaintenanceExpanded] = useState(true);
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const issueCommand = useCallback(
    async (cmdType: CommandType) => {
      setCommandInProgress(true);
      setLatestFeedback(null);

      const req = createCommandRequest({
        station_id: asset.station_id,
        asset_id: asset.asset_id,
        command_type: cmdType,
        requested_by: `${userRole}_DEMO`,
      });

      const finalFb = await submitCommand(req, (fb) => {
        recordCommandFeedback(fb);
        setLatestFeedback({ ...fb });
        setCommandLog(getCommandLog(asset.asset_id));
      });

      recordCommandFeedback(finalFb);
      setLatestFeedback({ ...finalFb });
      setCommandLog(getCommandLog(asset.asset_id));
      setCommandInProgress(false);
    },
    [asset, userRole]
  );

  const handleCommandClick = (cmdType: CommandType) => {
    if (cmdType === 'STOP') {
      setConfirmCmd('STOP');
    } else {
      issueCommand(cmdType);
    }
  };

  const handleConfirmStop = () => {
    setConfirmCmd(null);
    issueCommand('STOP');
  };

  const m = asset.maintenance;
  const baseline = PROTOTYPE_MACHINERY_BASELINES[asset.asset_id as keyof typeof PROTOTYPE_MACHINERY_BASELINES];
  const riskBreakdown = baseline
    ? calculateAssetRisk(baseline, asset.temperature, asset.vibration, asset.current, asset.efficiency)
    : null;

  return (
    <>
      {/* Confirmation Modal */}
      {confirmCmd && (
        <CommandConfirmModal
          asset={asset}
          commandType={confirmCmd}
          onConfirm={handleConfirmStop}
          onCancel={() => setConfirmCmd(null)}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '340px',
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(0, 78, 100, 0.15)',
          boxShadow: '-8px 0 32px rgba(0, 78, 100, 0.12)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'panelSlideIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '0.9rem 1.1rem',
            background: 'var(--deep-teal)',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {asset.asset_id}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor:
                      asset.status === 'CRITICAL' || asset.status === 'FAILED'
                        ? 'rgba(220, 38, 38, 0.85)'
                        : asset.status === 'WARNING' || asset.status === 'DEGRADING'
                        ? 'rgba(217, 119, 6, 0.85)'
                        : 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  {asset.status}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.82, marginTop: '0.2rem', fontWeight: 600 }}>
                {asset.name}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                {asset.asset_type.toUpperCase().replace('_', ' ')} · Last sync: {asset.last_update}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
              aria-label="Close asset detail"
            >
              <X size={15} />
            </button>
          </div>

          {/* Health / Risk Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              marginTop: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 700, marginBottom: '0.2rem' }}>
                STATION HEALTH
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${100 - asset.failure_risk}%`,
                    height: '100%',
                    background:
                      asset.failure_risk > 60
                        ? '#DC2626'
                        : asset.failure_risk > 30
                        ? '#D97706'
                        : '#10B981',
                    borderRadius: '99px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {100 - asset.failure_risk}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', opacity: 0.65, fontWeight: 700, marginBottom: '0.2rem' }}>
                FAILURE RISK
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${asset.failure_risk}%`,
                    height: '100%',
                    background:
                      asset.failure_risk > 60
                        ? '#DC2626'
                        : asset.failure_risk > 30
                        ? '#D97706'
                        : '#10B981',
                    borderRadius: '99px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, marginTop: '0.2rem', color: asset.failure_risk > 60 ? '#FCA5A5' : '#FFFFFF' }}>
                {asset.failure_risk}%
              </div>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* ── LIVE TELEMETRY ─────────────────────────────────────────────── */}
          <section>
            <SectionHeader label="Live Telemetry" icon={<Activity size={12} />} />

            {/* Common fields */}
            <TelemetryRow
              label="Temperature"
              value={fmt(asset.temperature, '°C')}
              icon={<Thermometer size={12} />}
              alert={asset.temperature > 80}
            />
            <TelemetryRow
              label="Power"
              value={fmt(asset.power, 'kW')}
              icon={<Zap size={12} />}
            />
            <TelemetryRow
              label="Current"
              value={fmt(asset.current, 'A', 0)}
              icon={<Activity size={12} />}
            />
            <TelemetryRow
              label="Efficiency"
              value={`${asset.efficiency}%`}
              icon={<Gauge size={12} />}
              alert={asset.efficiency < 70}
            />
            <TelemetryRow
              label="Vibration"
              value={fmt(asset.vibration, 'mm/s')}
              icon={<Activity size={12} />}
              alert={asset.vibration > 4.5}
            />

            {/* Type-specific telemetry */}
            {(asset.asset_type === 'generator') && (
              <>
                <TelemetryRow
                  label="Fuel Level"
                  value={`${asset.fuel}%`}
                  icon={<Droplets size={12} />}
                  alert={asset.fuel < 20}
                />
                <TelemetryRow
                  label="Operating Hours"
                  value={fmtInt(asset.operating_hours, 'h')}
                  icon={<Clock size={12} />}
                />
              </>
            )}

            {asset.asset_type === 'battery' && (
              <>
                <TelemetryRow
                  label="State of Charge"
                  value={`${asset.fuel}%`}
                  icon={<Battery size={12} />}
                  alert={asset.fuel < 20}
                />
                <TelemetryRow
                  label="Voltage"
                  value={fmt(asset.voltage, 'V')}
                  icon={<Zap size={12} />}
                />
              </>
            )}

            {asset.asset_type === 'fuel_system' && (
              <>
                <TelemetryRow
                  label="Fuel Level"
                  value={`${asset.fuel}%`}
                  icon={<Droplets size={12} />}
                  alert={asset.fuel < 20}
                />
                <TelemetryRow
                  label="Tank Status"
                  value={asset.status}
                  icon={<ShieldCheck size={12} />}
                />
              </>
            )}

            {asset.asset_type === 'pump' && (
              <>
                <TelemetryRow
                  label="Flow Rate"
                  value={fmt(asset.flow_rate, 'L/min')}
                  icon={<Droplets size={12} />}
                  alert={(asset.flow_rate ?? 999) < 20}
                />
                <TelemetryRow
                  label="Operating Hours"
                  value={fmtInt(asset.operating_hours, 'h')}
                  icon={<Clock size={12} />}
                />
              </>
            )}

            {asset.asset_type === 'hvac' && (
              <TelemetryRow
                label="Operating Hours"
                value={fmtInt(asset.operating_hours, 'h')}
                icon={<Clock size={12} />}
              />
            )}

            {asset.asset_type === 'environmental' && (
              <TelemetryRow
                label="Operating Hours"
                value={fmtInt(asset.operating_hours, 'h')}
                icon={<Clock size={12} />}
              />
            )}

            {/* Possible Issue */}
            {asset.possible_issue && (
              <div
                style={{
                  marginTop: '0.65rem',
                  padding: '0.55rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(220, 38, 38, 0.06)',
                  border: '1px solid rgba(220, 38, 38, 0.18)',
                  fontSize: '0.71rem',
                  color: '#B45309',
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: '#DC2626' }}>Diagnostic:</strong> {asset.possible_issue}
              </div>
            )}
          </section>

          {/* ── BASELINE VS CURRENT COMPARISON ───────────────────────────────── */}
          {baseline && (
            <section>
              <SectionHeader label="Baseline vs Current (Deviations)" icon={<Gauge size={12} />} />
              <div
                style={{
                  backgroundColor: 'var(--mist-gray-light)',
                  border: '1px solid rgba(0, 78, 100, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid rgba(0, 78, 100, 0.08)',
                    paddingBottom: '0.3rem',
                  }}
                >
                  <span>PARAMETER</span>
                  <span>BASELINE</span>
                  <span>CURRENT</span>
                  <span>DEV (Δ)</span>
                </div>

                {/* Temperature Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr', fontSize: '0.68rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--deep-teal)' }}>Temperature</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{baseline.baseline_temperature}°C</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{asset.temperature.toFixed(1)}°C</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: asset.temperature - baseline.baseline_temperature > 10 ? 'var(--status-critical)' : asset.temperature - baseline.baseline_temperature > 4 ? 'var(--status-warning)' : 'var(--status-normal)',
                    }}
                  >
                    {asset.temperature >= baseline.baseline_temperature ? '+' : ''}{(asset.temperature - baseline.baseline_temperature).toFixed(1)}°C
                  </span>
                </div>

                {/* Vibration Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr', fontSize: '0.68rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--deep-teal)' }}>Vibration</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{baseline.baseline_vibration} mm/s</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{asset.vibration.toFixed(1)} mm/s</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: asset.vibration - baseline.baseline_vibration > 2.0 ? 'var(--status-critical)' : asset.vibration - baseline.baseline_vibration > 1.0 ? 'var(--status-warning)' : 'var(--status-normal)',
                    }}
                  >
                    {asset.vibration >= baseline.baseline_vibration ? '+' : ''}{(asset.vibration - baseline.baseline_vibration).toFixed(1)}
                  </span>
                </div>

                {/* Current / Load Row */}
                {baseline.baseline_current > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr', fontSize: '0.68rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--deep-teal)' }}>Current</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{baseline.baseline_current} A</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{asset.current.toFixed(0)} A</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: asset.current - baseline.baseline_current > 15 ? 'var(--status-warning)' : 'var(--status-normal)',
                      }}
                    >
                      {asset.current >= baseline.baseline_current ? '+' : ''}{(asset.current - baseline.baseline_current).toFixed(0)} A
                    </span>
                  </div>
                )}

                {/* Efficiency Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr', fontSize: '0.68rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--deep-teal)' }}>Efficiency</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{baseline.baseline_efficiency}%</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{asset.efficiency.toFixed(0)}%</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: baseline.baseline_efficiency - asset.efficiency > 15 ? 'var(--status-critical)' : baseline.baseline_efficiency - asset.efficiency > 6 ? 'var(--status-warning)' : 'var(--status-normal)',
                    }}
                  >
                    {asset.efficiency >= baseline.baseline_efficiency ? '+' : ''}{(asset.efficiency - baseline.baseline_efficiency).toFixed(0)}%
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ── EXPLAINABLE RISK BREAKDOWN ────────────────────────────────────── */}
          {riskBreakdown && (
            <section>
              <SectionHeader label="Prototype Risk Model & Contributors" icon={<AlertTriangle size={12} />} />
              <div
                style={{
                  backgroundColor: 'var(--mist-gray-light)',
                  border: '1px solid rgba(0, 78, 100, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--deep-teal)' }}>
                    Risk Score: <strong style={{ fontSize: '0.9rem' }}>{riskBreakdown.score} / 100</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        riskBreakdown.state === 'CRITICAL'
                          ? 'rgba(220, 38, 38, 0.15)'
                          : riskBreakdown.state === 'HIGH' || riskBreakdown.state === 'WARNING'
                          ? 'rgba(217, 119, 6, 0.15)'
                          : 'rgba(5, 150, 105, 0.15)',
                      color:
                        riskBreakdown.state === 'CRITICAL'
                          ? '#DC2626'
                          : riskBreakdown.state === 'HIGH' || riskBreakdown.state === 'WARNING'
                          ? '#D97706'
                          : '#059669',
                    }}
                  >
                    {riskBreakdown.state}
                  </span>
                </div>

                {/* 4 Factor Contribution Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.66rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span>Thermal Stress (30% max)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{riskBreakdown.temperature_contribution} pts</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${(riskBreakdown.temperature_contribution / 30) * 100}%`, height: '100%', background: '#EF4444' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span>Vibration Stress (30% max)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{riskBreakdown.vibration_contribution} pts</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${(riskBreakdown.vibration_contribution / 30) * 100}%`, height: '100%', background: '#F59E0B' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span>Current / Electrical Load (20% max)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{riskBreakdown.current_contribution} pts</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${(riskBreakdown.current_contribution / 20) * 100}%`, height: '100%', background: '#3B82F6' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span>Efficiency Deficit (20% max)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{riskBreakdown.efficiency_contribution} pts</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${(riskBreakdown.efficiency_contribution / 20) * 100}%`, height: '100%', background: '#8B5CF6' }} />
                    </div>
                  </div>
                </div>

                {/* Contributing factors bullets */}
                <div style={{ borderTop: '1px solid rgba(0, 78, 100, 0.08)', paddingTop: '0.45rem', fontSize: '0.67rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>Contributing Stress Factors:</div>
                  <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-secondary)' }}>
                    {riskBreakdown.contributors.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* ── DATA PROVENANCE BANNER ───────────────────────────────────────── */}
          <div
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 78, 100, 0.04)',
              border: '1px solid rgba(0, 78, 100, 0.12)',
              fontSize: '0.65rem',
              color: 'var(--deep-teal)',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: '0.15rem' }}>DATA PROVENANCE NOTICE</div>
            <div>
              Telemetry generated via <strong>Synthetic Machinery Simulation</strong> against prototype baselines. Risk model is an explainable weighted operational stress index, not a certified manufacturer forecast.
            </div>
          </div>

          {/* ── OPERATING CONTROLS ──────────────────────────────────────────── */}
          <section>
            <SectionHeader label="Operating Controls" icon={<Gauge size={12} />} />

            {!canCommand && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  padding: '0.65rem 0.75rem',
                  background: 'var(--mist-gray-light)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(0, 78, 100, 0.1)',
                }}
              >
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '0.3rem', color: 'var(--deep-teal)' }} />
                {userRole === 'VIEWER'
                  ? 'VIEWER role — read-only access. Switch to OPERATOR or higher to issue commands.'
                  : 'Insufficient role for operational commands.'}
              </div>
            )}

            {canCommand && commandableTypes.length === 0 && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  padding: '0.65rem 0.75rem',
                  background: 'var(--mist-gray-light)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(0, 78, 100, 0.1)',
                }}
              >
                No operational commands defined for{' '}
                <strong>{asset.asset_type.replace('_', ' ')}</strong> assets.
              </div>
            )}

            {hasCommands && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {commandableTypes.includes('START') && (
                    <button
                      id={`btn-start-${asset.asset_id}`}
                      onClick={() => handleCommandClick('START')}
                      disabled={commandInProgress}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(5, 150, 105, 0.35)',
                        backgroundColor: commandInProgress
                          ? 'rgba(5, 150, 105, 0.08)'
                          : 'rgba(5, 150, 105, 0.12)',
                        color: '#059669',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: commandInProgress ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Play size={13} />
                      START
                    </button>
                  )}
                  {commandableTypes.includes('STOP') && (
                    <button
                      id={`btn-stop-${asset.asset_id}`}
                      onClick={() => handleCommandClick('STOP')}
                      disabled={commandInProgress}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        backgroundColor: commandInProgress
                          ? 'rgba(220, 38, 38, 0.06)'
                          : 'rgba(220, 38, 38, 0.1)',
                        color: '#DC2626',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: commandInProgress ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Square size={13} />
                      STOP
                    </button>
                  )}
                </div>

                {/* Command status feedback strip */}
                {latestFeedback && (
                  <div
                    style={{
                      padding: '0.55rem 0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${commandStatusColor(latestFeedback.status)}18`,
                      border: `1px solid ${commandStatusColor(latestFeedback.status)}44`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: commandStatusColor(latestFeedback.status), marginTop: '1px', flexShrink: 0 }}>
                      {commandStatusIcon(latestFeedback.status)}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: commandStatusColor(latestFeedback.status),
                          letterSpacing: '0.04em',
                        }}
                      >
                        {latestFeedback.status}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.1rem' }}>
                        {latestFeedback.message}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ⚠ DEMO MODE — Commands do not reach PC1
                </div>
              </>
            )}
          </section>

          {/* ── MAINTENANCE ─────────────────────────────────────────────────── */}
          <section>
            <button
              onClick={() => setMaintenanceExpanded((e) => !e)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  paddingBottom: '0.35rem',
                  borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wrench size={12} />
                  Maintenance
                </span>
                {maintenanceExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>

            {maintenanceExpanded && (
              <>
                {!m ? (
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Maintenance record not available.
                  </div>
                ) : (
                  <>
                    {/* State badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${maintenanceStateColor(m.state)}18`,
                        border: `1px solid ${maintenanceStateColor(m.state)}44`,
                        marginBottom: '0.65rem',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: maintenanceStateColor(m.state),
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: maintenanceStateColor(m.state),
                          letterSpacing: '0.04em',
                        }}
                      >
                        {m.state}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        DEMO
                      </span>
                    </div>

                    <TelemetryRow
                      label="Last Maintenance"
                      value={m.last_maintenance ?? 'No record'}
                      icon={<Clock size={12} />}
                    />
                    <TelemetryRow
                      label="Next Scheduled"
                      value={m.next_maintenance ?? 'Not scheduled'}
                      icon={<Clock size={12} />}
                    />
                    <TelemetryRow
                      label="Operating Hours"
                      value={fmtInt(m.operating_hours, 'h')}
                      icon={<Clock size={12} />}
                    />

                    {m.known_issue && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          padding: '0.55rem 0.7rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(217, 119, 6, 0.07)',
                          border: '1px solid rgba(217, 119, 6, 0.22)',
                          fontSize: '0.71rem',
                          color: '#92400E',
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>Known Issue:</strong> {m.known_issue}
                      </div>
                    )}

                    {m.recommended_action && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.7rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(3, 105, 161, 0.06)',
                          border: '1px solid rgba(3, 105, 161, 0.15)',
                          fontSize: '0.71rem',
                          color: '#0369A1',
                          lineHeight: 1.45,
                        }}
                      >
                        <strong>Recommended:</strong> {m.recommended_action}
                      </div>
                    )}

                    {/* Maintenance actions — ENGINEER+ only */}
                    {canMaintenance && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                        <button
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(3, 105, 161, 0.3)',
                            backgroundColor: 'rgba(3, 105, 161, 0.08)',
                            color: '#0369A1',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                          }}
                          title="Mark maintenance as started — DEMO, no backend record written"
                        >
                          MARK STARTED
                        </button>
                        <button
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            backgroundColor: 'rgba(5, 150, 105, 0.08)',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                          }}
                          title="Mark maintenance as completed — DEMO, no backend record written"
                        >
                          MARK COMPLETED
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>

          {/* ── INVENTORY / SPARE PARTS ─────────────────────────────────────── */}
          {m?.spare_parts && m.spare_parts.length > 0 && (
            <section>
              <button
                onClick={() => setInventoryExpanded((e) => !e)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    paddingBottom: '0.35rem',
                    borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={12} />
                    Inventory / Spare Parts
                  </span>
                  {inventoryExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>
              </button>

              {inventoryExpanded &&
                m.spare_parts.map((part) => (
                  <div
                    key={part.part_code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.45rem 0',
                      borderBottom: '1px solid rgba(0, 78, 100, 0.07)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--deep-teal)' }}>
                        {part.part_name}
                      </div>
                      <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {part.part_code}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: `${availabilityColor(part.availability)}18`,
                        color: availabilityColor(part.availability),
                        border: `1px solid ${availabilityColor(part.availability)}44`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {part.availability.replace('_', ' ')}
                    </span>
                  </div>
                ))}
            </section>
          )}

          {/* ── RECENT COMMAND ACTIVITY ─────────────────────────────────────── */}
          <section>
            <button
              onClick={() => setActivityExpanded((e) => !e)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  paddingBottom: '0.35rem',
                  borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={12} />
                  Command Activity
                  {commandLog.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        padding: '0.05rem 0.3rem',
                        borderRadius: '99px',
                        backgroundColor: 'rgba(0, 78, 100, 0.15)',
                        color: 'var(--deep-teal)',
                      }}
                    >
                      {commandLog.length}
                    </span>
                  )}
                </span>
                {activityExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>

            {activityExpanded && (
              <>
                {commandLog.length === 0 ? (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    No commands issued this session.
                  </div>
                ) : (
                  commandLog.map((fb, i) => (
                    <div
                      key={`${fb.command_id}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.35rem 0',
                        borderBottom: '1px solid rgba(0, 78, 100, 0.07)',
                      }}
                    >
                      <span style={{ color: commandStatusColor(fb.status), marginTop: '1px', flexShrink: 0 }}>
                        {commandStatusIcon(fb.status)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: commandStatusColor(fb.status),
                          }}
                        >
                          {fb.status}
                        </div>
                        <div
                          style={{
                            fontSize: '0.62rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={fb.message}
                        >
                          {fb.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </section>

          {/* Spacer */}
          <div style={{ height: '1rem' }} />
        </div>
      </div>

      <style>{`
        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateX(24px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        @keyframes spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
      `}</style>
    </>
  );
};
