import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import {
  Cog,
  Gauge,
  Thermometer,
  Activity,
  AlertTriangle,
  Filter,
  Zap,
  Waves,
  Cpu,
  Sliders,
  Shield,
  Clock,
  Compass,
  Wind,
  Layers,
  Radio,
  BarChart3,
} from 'lucide-react';
import type { OperationalStatus } from '../../types';
import type { MachineAssetId } from '../../types/digitalTwin';
import type { MachineryTelemetryWithBaseline } from '../../services/telemetry/telemetryContracts';

export const MachineryPage: React.FC = () => {
  const { selectedStation } = useStation();
  const { machineryAssets } = useSimulation();

  const [selectedAssetId, setSelectedAssetId] = useState<MachineAssetId>('GEN-01');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OperationalStatus>('ALL');

  if (!selectedStation) return null;

  const assetList = Object.values(machineryAssets);
  const filteredAssets = statusFilter === 'ALL'
    ? assetList
    : assetList.filter((a) => a.status === statusFilter);

  const activeAsset = machineryAssets[selectedAssetId] || assetList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header Banner */}
      <div
        className="frost-card"
        style={{
          padding: '1.5rem 2rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Cog size={22} style={{ color: 'var(--deep-teal)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
              Machinery Diagnostics &amp; Baselines
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Synthetic telemetry streaming against calibrated prototype baselines for {selectedStation.name}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 78, 100, 0.08)',
              border: '1px solid rgba(0, 78, 100, 0.18)',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--deep-teal)',
            }}
          >
            SYNTHETIC MACHINERY SIMULATION
          </div>
        </div>
      </div>

      {/* Asset Selector Strip & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Asset Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filteredAssets.map((a) => {
            const isSelected = a.asset_id === selectedAssetId;
            const isCrit = a.status === 'CRITICAL' || a.status === 'FAILED';
            const isWarn = a.status === 'WARNING' || a.status === 'DEGRADING';

            return (
              <button
                key={a.asset_id}
                onClick={() => setSelectedAssetId(a.asset_id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? '2px solid var(--deep-teal)'
                    : '1px solid rgba(0, 78, 100, 0.15)',
                  backgroundColor: isSelected ? 'var(--deep-teal)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--deep-teal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 78, 100, 0.2)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isCrit ? '#DC2626' : isWarn ? '#D97706' : '#10B981',
                  }}
                />
                {a.asset_id}
              </button>
            );
          })}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <Filter size={14} style={{ color: 'var(--deep-teal)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
          {(['ALL', 'NORMAL', 'WARNING', 'CRITICAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(0, 78, 100, 0.15)',
                backgroundColor: statusFilter === st ? 'rgba(0, 78, 100, 0.15)' : '#FFFFFF',
                color: 'var(--deep-teal)',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Focus Layout */}
      {activeAsset && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.4fr)', gap: '1.75rem' }}>
          {/* Left Column: Asset Detail Card & Explainable Risk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Asset Identity Card */}
            <div
              className="frost-card"
              style={{
                padding: '1.75rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 78, 100, 0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--deep-teal)' }}>
                      {activeAsset.asset_id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor:
                          activeAsset.status === 'CRITICAL' || activeAsset.status === 'FAILED'
                            ? 'rgba(220, 38, 38, 0.15)'
                            : activeAsset.status === 'WARNING' || activeAsset.status === 'DEGRADING'
                            ? 'rgba(217, 119, 6, 0.15)'
                            : 'rgba(5, 150, 105, 0.15)',
                        color:
                          activeAsset.status === 'CRITICAL' || activeAsset.status === 'FAILED'
                            ? '#DC2626'
                            : activeAsset.status === 'WARNING' || activeAsset.status === 'DEGRADING'
                            ? '#D97706'
                            : '#059669',
                      }}
                    >
                      {activeAsset.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-teal)', margin: '0.25rem 0 0 0' }}>
                    {activeAsset.name}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                    TYPE: {activeAsset.asset_type.toUpperCase().replace('_', ' ')}
                  </div>
                </div>

                {/* Health & Risk Circular Pills */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROTOTYPE RISK</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      color:
                        activeAsset.risk.score > 60
                          ? '#DC2626'
                          : activeAsset.risk.score > 30
                          ? '#D97706'
                          : '#059669',
                    }}
                  >
                    {activeAsset.risk.score}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
              </div>

              {/* Operating Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
                <div style={{ background: 'var(--mist-gray-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--deep-teal)', fontWeight: 600 }}>
                    <Thermometer size={14} /> Core Temp
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                    {activeAsset.current_temperature}°C
                  </div>
                </div>

                <div style={{ background: 'var(--mist-gray-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--deep-teal)', fontWeight: 600 }}>
                    <Activity size={14} /> Vibration
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                    {activeAsset.current_vibration} <span style={{ fontSize: '0.75rem' }}>mm/s</span>
                  </div>
                </div>

                <div style={{ background: 'var(--mist-gray-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: 'var(--deep-teal)', fontWeight: 600 }}>
                    <Gauge size={14} /> Efficiency
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                    {activeAsset.current_efficiency}%
                  </div>
                </div>
              </div>

              {activeAsset.possible_issue && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    fontSize: '0.78rem',
                    color: '#B45309',
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: '#DC2626' }}>Diagnostic Issue:</strong> {activeAsset.possible_issue}
                </div>
              )}
            </div>

            {/* Explainable Risk Model Breakdown */}
            <div
              className="frost-card"
              style={{
                padding: '1.75rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 78, 100, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--deep-teal)' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--deep-teal)', margin: 0 }}>
                  Explainable Risk Model
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>Thermal Stress Contribution (30% max)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{activeAsset.risk.temperature_contribution} / 30 pts</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(activeAsset.risk.temperature_contribution / 30) * 100}%`, height: '100%', background: '#EF4444' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>Vibration Amplitude Stress (30% max)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{activeAsset.risk.vibration_contribution} / 30 pts</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(activeAsset.risk.vibration_contribution / 30) * 100}%`, height: '100%', background: '#F59E0B' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>Current / Electrical Load (20% max)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{activeAsset.risk.current_contribution} / 20 pts</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(activeAsset.risk.current_contribution / 20) * 100}%`, height: '100%', background: '#3B82F6' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>Efficiency Deficit (20% max)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{activeAsset.risk.efficiency_contribution} / 20 pts</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0, 78, 100, 0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(activeAsset.risk.efficiency_contribution / 20) * 100}%`, height: '100%', background: '#8B5CF6' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(0, 78, 100, 0.08)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.72rem', color: 'var(--deep-teal)', marginBottom: '0.4rem' }}>
                  Contributing Stress Factors:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activeAsset.risk.contributors.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Baseline vs Current Specification Table */}
          <div
            className="frost-card"
            style={{
              padding: '1.75rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 78, 100, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Gauge size={18} style={{ color: 'var(--deep-teal)' }} />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                    Baseline vs Current Parameter Comparison
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                  }}
                >
                  {activeAsset.baseline.provenance_note}
                </span>
              </div>

              {/* Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid rgba(0, 78, 100, 0.12)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <span>PARAMETER</span>
                  <span>BASELINE</span>
                  <span>CURRENT</span>
                  <span>DEVIATION (Δ)</span>
                </div>

                {/* Temperature */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Core Temperature</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_temperature}°C</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_temperature}°C</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: activeAsset.deviation.temperature_diff > 10 ? '#DC2626' : activeAsset.deviation.temperature_diff > 4 ? '#D97706' : '#059669',
                    }}
                  >
                    {activeAsset.deviation.temperature_diff >= 0 ? '+' : ''}{activeAsset.deviation.temperature_diff}°C
                  </span>
                </div>

                {/* Vibration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0', background: 'rgba(0, 78, 100, 0.02)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Vibration Amplitude</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_vibration} mm/s</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_vibration} mm/s</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: activeAsset.deviation.vibration_diff > 2.0 ? '#DC2626' : activeAsset.deviation.vibration_diff > 0.8 ? '#D97706' : '#059669',
                    }}
                  >
                    {activeAsset.deviation.vibration_diff >= 0 ? '+' : ''}{activeAsset.deviation.vibration_diff} mm/s
                  </span>
                </div>

                {/* Current */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Phase Current</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_current} A</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_current} A</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: activeAsset.deviation.current_diff > 15 ? '#D97706' : '#059669',
                    }}
                  >
                    {activeAsset.deviation.current_diff >= 0 ? '+' : ''}{activeAsset.deviation.current_diff} A
                  </span>
                </div>

                {/* Power */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0', background: 'rgba(0, 78, 100, 0.02)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Active Power</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_power} kW</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_power} kW</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>
                    {activeAsset.deviation.power_diff >= 0 ? '+' : ''}{activeAsset.deviation.power_diff} kW
                  </span>
                </div>

                {/* Efficiency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0' }}>
                  <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Mechanical Efficiency</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_efficiency}%</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_efficiency}%</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: activeAsset.deviation.efficiency_diff < -12 ? '#DC2626' : activeAsset.deviation.efficiency_diff < -5 ? '#D97706' : '#059669',
                    }}
                  >
                    {activeAsset.deviation.efficiency_diff >= 0 ? '+' : ''}{activeAsset.deviation.efficiency_diff}%
                  </span>
                </div>

                {/* Fuel / Energy Consumption */}
                {activeAsset.baseline.baseline_fuel_consumption > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', fontSize: '0.8rem', alignItems: 'center', padding: '0.4rem 0', background: 'rgba(0, 78, 100, 0.02)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Fuel Consumption</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{activeAsset.baseline.baseline_fuel_consumption} L/h</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{activeAsset.current_fuel_consumption} L/h</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        color: activeAsset.deviation.fuel_consumption_diff > 4 ? '#D97706' : '#059669',
                      }}
                    >
                      {activeAsset.deviation.fuel_consumption_diff >= 0 ? '+' : ''}{activeAsset.deviation.fuel_consumption_diff} L/h
                    </span>
                  </div>
                )}
              </div>

              {/* Threshold Specs Accordion */}
              <div style={{ marginTop: '1.5rem', background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.45rem' }}>
                  PROTOTYPE THRESHOLD CONFIGURATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.7rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Temp Warn:</span>{' '}
                    <strong style={{ color: '#D97706' }}>{activeAsset.baseline.thresholds.temp_warn}°C</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Temp Crit:</span>{' '}
                    <strong style={{ color: '#DC2626' }}>{activeAsset.baseline.thresholds.temp_crit}°C</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vib Warn:</span>{' '}
                    <strong style={{ color: '#D97706' }}>{activeAsset.baseline.thresholds.vib_warn} mm/s</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vib Crit:</span>{' '}
                    <strong style={{ color: '#DC2626' }}>{activeAsset.baseline.thresholds.vib_crit} mm/s</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Provenance Notice */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 78, 100, 0.05)',
                border: '1px solid rgba(0, 78, 100, 0.15)',
                fontSize: '0.72rem',
                color: 'var(--deep-teal)',
                lineHeight: 1.5,
              }}
            >
              <strong>Data Provenance Notice:</strong> These baseline values represent prototype mission-control simulation baselines for the Dakshin PC2 demonstration. They provide an explainable benchmark for thermal, mechanical, and electrical variance.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AUXILIARY DEEP DIAGNOSTIC TELEMETRY MATRIX */}
      {activeAsset && (
        <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} style={{ color: 'var(--deep-teal)' }} />
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Sub-System Diagnostic Telemetry Matrix — {activeAsset.asset_id}
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Calibrated industrial telemetry points sampled across thermodynamic, electrical, and fluid circuits.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                12 AUXILIARY CHANNELS ACTIVE
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {getAuxiliaryTelemetry(activeAsset).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(0, 78, 100, 0.08)',
                    backgroundColor: 'rgba(0, 78, 100, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--deep-teal)' }}>
                      <Icon size={14} />
                      {item.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: item.status === 'WARNING' ? '#D97706' : '#059669',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--deep-teal)' }}>
                      {item.value} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.nominal}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: FFT HARMONIC VIBRATION SPECTRUM & SENSOR BUS TABLE */}
      {activeAsset && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(340px, 1.35fr)', gap: '1.75rem' }}>
          {/* FFT Vibration Spectrum Visualizer */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} style={{ color: 'var(--deep-teal)' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Live FFT Vibration Spectrum
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
                ISO 10816-3 (ZONE A)
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
              Real-time Fast Fourier Transform breakdown of harmonic velocity amplitudes against rotational frequency.
            </p>

            {/* Spectrum Bar Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getFftSpectrum(activeAsset).map((peak, idx) => {
                const pct = Math.min(100, (peak.amplitude / 4.5) * 100);
                const isZoneB = peak.amplitude > 2.8;
                return (
                  <div key={idx} style={{ fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>
                        {peak.order} ({peak.freq} Hz) — {peak.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isZoneB ? '#D97706' : 'var(--deep-teal)' }}>
                        {peak.amplitude.toFixed(2)} mm/s RMS
                      </span>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(0, 78, 100, 0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isZoneB ? '#D97706' : '#059669',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ISO Zones Legend */}
            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(0, 78, 100, 0.08)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center', fontSize: '0.65rem' }}>
              <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', background: 'rgba(5, 150, 105, 0.08)', color: '#059669', fontWeight: 800 }}>
                ZONE A: &lt; 2.8 mm/s<br />(Good / Unrestricted)
              </div>
              <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.08)', color: '#D97706', fontWeight: 800 }}>
                ZONE B: 2.8 – 4.5 mm/s<br />(Allowable Operation)
              </div>
              <div style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', fontWeight: 800 }}>
                ZONE C: &gt; 4.5 mm/s<br />(Restricted Operation)
              </div>
            </div>
          </div>

          {/* Raw Sensor Bus & DAQ Acquisition Feed */}
          <div className="frost-card" style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid rgba(0, 78, 100, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={18} style={{ color: 'var(--deep-teal)' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
                  Industrial DAQ Bus Telemetry Channels
                </h4>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669' }}>
                NPL-INDIA TRACEABLE
              </span>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              Primary analog-to-digital converter (ADC) transducer signals directly acquired via station field bus.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 1fr 1.1fr 0.8fr', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0, 78, 100, 0.1)', paddingBottom: '0.35rem' }}>
                <span>CHANNEL</span>
                <span>TRANSDUCER MODEL</span>
                <span>RAW SIGNAL</span>
                <span>CALIBRATED</span>
                <span style={{ textAlign: 'right' }}>RATE</span>
              </div>

              {/* Rows */}
              {getRawSensorChannels(activeAsset).map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 1.6fr 1fr 1.1fr 0.8fr',
                    fontSize: '0.72rem',
                    alignItems: 'center',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid rgba(0, 78, 100, 0.04)',
                    background: i % 2 === 0 ? 'rgba(0, 78, 100, 0.015)' : 'transparent',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>
                    {row.channel}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {row.transducer}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {row.raw}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--deep-teal)' }}>
                    {row.calibrated}
                  </span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                    {row.sampleRate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// COMPLEX SYNTHETIC DATA GENERATORS (PHYSICS-GROUNDED ANTARCTIC TELEMETRY)
// -----------------------------------------------------------------------------

function getAuxiliaryTelemetry(asset: MachineryTelemetryWithBaseline) {
  const id = asset.asset_id;
  const temp = asset.current_temperature;
  const vib = asset.current_vibration;
  const curr = asset.current_current;
  const eff = asset.current_efficiency;

  if (id === 'GEN-01' || id === 'GEN-02') {
    return [
      { name: 'Lube Oil Pressure', value: (4.45 - (temp - 78) * 0.02).toFixed(2), unit: 'bar', nominal: '3.5 – 5.2 bar', status: 'NOMINAL', icon: Gauge },
      { name: 'Lube Oil Temperature', value: (temp + 13.8).toFixed(1), unit: '°C', nominal: '85.0 – 95.0°C', status: temp > 85 ? 'WARNING' : 'NOMINAL', icon: Thermometer },
      { name: 'Coolant Return ΔT', value: (8.4 + (curr / 72) * 2.2).toFixed(1), unit: '°C', nominal: '6.0 – 12.0°C', status: 'NOMINAL', icon: Thermometer },
      { name: 'Turbocharger Boost', value: (1.82 + (curr / 72) * 0.25).toFixed(2), unit: 'bar', nominal: '1.60 – 2.10 bar', status: 'NOMINAL', icon: Zap },
      { name: 'Exhaust Gas Temp (Avg)', value: (390 + (curr / 72) * 35).toFixed(0), unit: '°C', nominal: '380 – 440°C', status: 'NOMINAL', icon: Thermometer },
      { name: 'Alternator Phase U Temp', value: (temp - 12.8).toFixed(1), unit: '°C', nominal: '55.0 – 75.0°C', status: 'NOMINAL', icon: Zap },
      { name: 'Alternator Phase V Temp', value: (temp - 12.1).toFixed(1), unit: '°C', nominal: '55.0 – 75.0°C', status: 'NOMINAL', icon: Zap },
      { name: 'Alternator Phase W Temp', value: (temp - 12.5).toFixed(1), unit: '°C', nominal: '55.0 – 75.0°C', status: 'NOMINAL', icon: Zap },
      { name: 'Grid Frequency', value: (50.0 + (50 - eff * 0.5) * 0.002).toFixed(2), unit: 'Hz', nominal: '49.80 – 50.20 Hz', status: 'NOMINAL', icon: Activity },
      { name: 'Total Harmonic Distortion', value: (1.8 + (vib * 0.2)).toFixed(1), unit: '% THD', nominal: '< 5.0% IEEE 519', status: 'NOMINAL', icon: Activity },
      { name: 'Governor Fuel Rack', value: Math.min(100, Math.max(20, (curr / 85) * 100)).toFixed(1), unit: '%', nominal: '45.0 – 85.0%', status: 'NOMINAL', icon: Sliders },
      { name: 'Next 500h Service Due', value: '124.5', unit: 'hrs remaining', nominal: 'Valve Lash / Injectors', status: 'NOMINAL', icon: Clock },
    ];
  } else if (id === 'BAT-01') {
    return [
      { name: 'State of Charge (SoC)', value: '84.6', unit: '%', nominal: '20.0 – 95.0%', status: 'NOMINAL', icon: Zap },
      { name: 'State of Health (SoH)', value: '98.2', unit: '%', nominal: '> 80.0% Polar Life', status: 'NOMINAL', icon: Shield },
      { name: 'DC Bus Output Voltage', value: (654.2 - (curr * 0.2)).toFixed(1), unit: 'V DC', nominal: '640.0 – 680.0 V', status: 'NOMINAL', icon: Zap },
      { name: 'Cell Voltage Spread Delta', value: (12.4 + vib * 2).toFixed(1), unit: 'mV spread', nominal: '< 25.0 mV Balanced', status: 'NOMINAL', icon: Activity },
      { name: 'Thermal Bath Glycol Flow', value: '14.2', unit: 'L/min', nominal: '12.0 – 16.0 L/min', status: 'NOMINAL', icon: Waves },
      { name: 'Internal String Impedance', value: '1.42', unit: 'mΩ', nominal: '< 2.50 mΩ', status: 'NOMINAL', icon: Cpu },
      { name: 'Isolation Resistance', value: '5.8', unit: 'MΩ', nominal: '> 1.0 MΩ (Safe)', status: 'NOMINAL', icon: Shield },
      { name: 'Cumulative Life Cycles', value: '1,482', unit: 'cycles', nominal: '6,000 Cycle Life', status: 'NOMINAL', icon: Clock },
      { name: 'Max Individual Cell Temp', value: (temp + 2.1).toFixed(1), unit: '°C', nominal: '15.0 – 25.0°C', status: 'NOMINAL', icon: Thermometer },
      { name: 'Round-Trip Efficiency', value: '95.4', unit: '%', nominal: '> 92.0% Nominal', status: 'NOMINAL', icon: Gauge },
      { name: 'Inverter Bridge Temp', value: '38.6', unit: '°C', nominal: '< 55.0°C Liquid Cooled', status: 'NOMINAL', icon: Thermometer },
      { name: 'Float Charge Current', value: (curr * 0.85).toFixed(1), unit: 'A', nominal: 'Dynamic Microgrid C-rate', status: 'NOMINAL', icon: Zap },
    ];
  } else if (id === 'FUEL-01') {
    return [
      { name: 'Bulk Tank Fuel Ullage', value: '68.5', unit: '% full', nominal: '42,500 L / 62,000 L', status: 'NOMINAL', icon: Gauge },
      { name: 'Tank Head Static Pressure', value: '1.04', unit: 'bar', nominal: '0.95 – 1.15 bar', status: 'NOMINAL', icon: Gauge },
      { name: 'Trace Heating Circuit A', value: '4.2', unit: 'A', nominal: '3.8 – 4.6 A Active', status: 'NOMINAL', icon: Zap },
      { name: 'Trace Heating Circuit B', value: '4.1', unit: 'A', nominal: '3.8 – 4.6 A Active', status: 'NOMINAL', icon: Zap },
      { name: 'Coalescing Filter ΔP', value: (0.18 + vib * 0.05).toFixed(2), unit: 'bar', nominal: '< 0.35 bar (Clean)', status: 'NOMINAL', icon: Filter },
      { name: 'Pour Point Safety Margin', value: '+16.2', unit: '°C margin', nominal: '-48.5°C Pour vs Amb', status: 'NOMINAL', icon: Thermometer },
      { name: 'Daily Consumption Burn', value: '684.0', unit: 'L / 24h', nominal: 'Station Power Load', status: 'NOMINAL', icon: Activity },
      { name: 'Fuel Specific Gravity (15°C)', value: '0.818', unit: 'kg/L', nominal: '0.815 – 0.825 Arctic', status: 'NOMINAL', icon: Gauge },
      { name: 'Transfer Pump Suction', value: '1.42', unit: 'bar', nominal: '1.20 – 1.60 bar', status: 'NOMINAL', icon: Waves },
      { name: 'Fuel Viscosity @ 20°C', value: '2.84', unit: 'cSt', nominal: '1.8 – 4.0 cSt ASTM D445', status: 'NOMINAL', icon: Gauge },
      { name: 'Sediment / Water Sensor', value: '0.002', unit: '% vol', nominal: '< 0.05% Safe', status: 'NOMINAL', icon: Shield },
      { name: 'Return Line Header Temp', value: '-2.4', unit: '°C', nominal: 'Thermal Insulated Run', status: 'NOMINAL', icon: Thermometer },
    ];
  } else if (id === 'PUMP-01') {
    return [
      { name: 'VFD Inverter Frequency', value: '48.8', unit: 'Hz', nominal: '40.0 – 55.0 Hz', status: 'NOMINAL', icon: Activity },
      { name: 'Impeller Shaft Speed', value: '1,460', unit: 'RPM', nominal: '1,200 – 1,650 RPM', status: 'NOMINAL', icon: Cog },
      { name: 'Suction Head Pressure', value: '1.82', unit: 'bar', nominal: '1.50 – 2.20 bar', status: 'NOMINAL', icon: Gauge },
      { name: 'Discharge Head Pressure', value: '4.25', unit: 'bar', nominal: '3.80 – 4.80 bar', status: 'NOMINAL', icon: Gauge },
      { name: 'Total Dynamic Head (TDH)', value: '24.8', unit: 'm liquid', nominal: '22.0 – 28.0 m', status: 'NOMINAL', icon: Waves },
      { name: 'Volumetric Flow Rate', value: '42.8', unit: 'm³/h', nominal: '38.0 – 46.0 m³/h', status: 'NOMINAL', icon: Waves },
      { name: 'Mechanical Seal Face Temp', value: (temp + 4.2).toFixed(1), unit: '°C', nominal: '< 65.0°C Safe', status: 'NOMINAL', icon: Thermometer },
      { name: 'Acoustic Cavitation RMS', value: '0.04', unit: 'RMS index', nominal: '< 0.15 (Zero Cav.)', status: 'NOMINAL', icon: Activity },
      { name: 'Glycol Mixture Ratio', value: '60/40', unit: '% PG/Water', nominal: 'Freeze Point -51°C', status: 'NOMINAL', icon: Waves },
      { name: 'Motor Drive End Bearing', value: (temp - 3.2).toFixed(1), unit: '°C', nominal: '< 60.0°C', status: 'NOMINAL', icon: Thermometer },
      { name: 'Non-Drive End Bearing', value: (temp - 5.5).toFixed(1), unit: '°C', nominal: '< 60.0°C', status: 'NOMINAL', icon: Thermometer },
      { name: 'Hydraulic Efficiency', value: (eff * 0.94).toFixed(1), unit: '%', nominal: '> 78.0% Centrifugal', status: 'NOMINAL', icon: Gauge },
    ];
  } else if (id === 'HEATER-01') {
    return [
      { name: 'Habitat Supply Air Flow', value: '1,840', unit: 'CFM', nominal: '1,600 – 2,000 CFM', status: 'NOMINAL', icon: Wind },
      { name: 'Habitat Return Air Flow', value: '1,770', unit: 'CFM', nominal: '1,550 – 1,900 CFM', status: 'NOMINAL', icon: Wind },
      { name: 'Indoor Habitat CO2', value: '485', unit: 'ppm', nominal: '< 800 ppm (Fresh)', status: 'NOMINAL', icon: Activity },
      { name: 'Indoor Relative Humidity', value: '38.2', unit: '% RH', nominal: '30.0 – 50.0% Polar', status: 'NOMINAL', icon: Waves },
      { name: 'Heat Recovery Effectiveness', value: '78.6', unit: '%', nominal: '> 75.0% Dual Wheel', status: 'NOMINAL', icon: Gauge },
      { name: 'Static Duct Pressure', value: '245', unit: 'Pa', nominal: '200 – 300 Pa', status: 'NOMINAL', icon: Gauge },
      { name: 'Louver De-Icing Circuit', value: '120', unit: 'W active', nominal: 'Zero Frost Accretion', status: 'NOMINAL', icon: Zap },
      { name: 'VOC Indoor Contaminants', value: '24', unit: 'ppb', nominal: '< 50 ppb Clean', status: 'NOMINAL', icon: Shield },
      { name: 'Supply Air Temp', value: '22.4', unit: '°C', nominal: '21.0 – 24.0°C Comfort', status: 'NOMINAL', icon: Thermometer },
      { name: 'Exhaust Heat Exchanger Exit', value: '-4.2', unit: '°C', nominal: 'Recovered Heat to Ground', status: 'NOMINAL', icon: Thermometer },
      { name: 'HEPA Filter Pressure Drop', value: '88', unit: 'Pa ΔP', nominal: '< 150 Pa Clean', status: 'NOMINAL', icon: Filter },
      { name: 'Fan Motor Electrical Current', value: (curr * 0.9).toFixed(1), unit: 'A', nominal: 'Electronically Commutated', status: 'NOMINAL', icon: Zap },
    ];
  } else {
    // ENV-01 AWS Mast Array
    return [
      { name: '3D Sonic Wind Vector U', value: '+18.4', unit: 'm/s (East)', nominal: 'Polar Anemometer', status: 'NOMINAL', icon: Wind },
      { name: '3D Sonic Wind Vector V', value: '-6.2', unit: 'm/s (North)', nominal: 'Polar Anemometer', status: 'NOMINAL', icon: Wind },
      { name: '3D Sonic Wind Vector W', value: '+0.4', unit: 'm/s (Updraft)', nominal: 'Turbulence Index', status: 'NOMINAL', icon: Wind },
      { name: 'Station Barometric (QNH)', value: '984.8', unit: 'hPa', nominal: '960 – 1025 hPa', status: 'NOMINAL', icon: Gauge },
      { name: 'Barometric 3h Tendency', value: '-0.8', unit: 'hPa / 3h', nominal: 'Stable Katabatic', status: 'NOMINAL', icon: Activity },
      { name: 'Pyranometer Solar Flux', value: '285.0', unit: 'W/m²', nominal: 'Direct + Diffuse', status: 'NOMINAL', icon: Zap },
      { name: 'Dewpoint / Frost Point', value: '-34.6', unit: '°C', nominal: 'Ambient Sub-zero', status: 'NOMINAL', icon: Thermometer },
      { name: 'Acoustic Snow Depth Sensor', value: '142.4', unit: 'cm accum.', nominal: 'Permafrost Horizon', status: 'NOMINAL', icon: Compass },
      { name: 'Mast Structural Tilt Angle', value: '0.12', unit: 'degrees', nominal: '< 1.50° Ice Foundation', status: 'NOMINAL', icon: Gauge },
      { name: 'Mast De-Icing Heater Power', value: '350', unit: 'W active', nominal: 'Zero Rime Accretion', status: 'NOMINAL', icon: Zap },
      { name: 'Global Horizontal Irradiance', value: '312.0', unit: 'W/m²', nominal: 'Solar Pyranometer', status: 'NOMINAL', icon: Zap },
      { name: 'Atmospheric Visibility', value: '28.5', unit: 'km', nominal: 'Forward Scatter Optical', status: 'NOMINAL', icon: Compass },
    ];
  }
}

function getFftSpectrum(asset: MachineryTelemetryWithBaseline) {
  const vib = asset.current_vibration;
  return [
    { order: '1X', freq: 25.0, label: 'Running Shaft Speed (1500 RPM)', amplitude: Number((vib * 0.58).toFixed(2)) },
    { order: '2X', freq: 50.0, label: 'Electrical Line & Alignment Frequency', amplitude: Number((vib * 0.24).toFixed(2)) },
    { order: '3X', freq: 75.0, label: '3-Cylinder Phase Torque Harmonic', amplitude: Number((vib * 0.12).toFixed(2)) },
    { order: '4X', freq: 100.0, label: 'Blade Pass / 2nd Electrical Harmonic', amplitude: Number((vib * 0.08).toFixed(2)) },
    { order: 'GMF', freq: 375.0, label: 'Gear Mesh Frequency (Flywheel Teeth)', amplitude: Number((vib * 0.16).toFixed(2)) },
    { order: 'BPFO', freq: 1420.0, label: 'Outer Race Bearing Defect Band', amplitude: Number((vib * 0.04).toFixed(2)) },
  ];
}

function getRawSensorChannels(asset: MachineryTelemetryWithBaseline) {
  const id = asset.asset_id;
  const temp = asset.current_temperature;
  const vib = asset.current_vibration;
  const curr = asset.current_current;

  return [
    {
      channel: `${id}-AI-01`,
      transducer: 'Pt100 Class A 4-Wire RTD',
      raw: `${(100 + temp * 0.385).toFixed(2)} Ω`,
      calibrated: `${temp}°C`,
      sampleRate: '10 Hz',
    },
    {
      channel: `${id}-AI-02`,
      transducer: 'PCB Piezotronics 352C33 ICP Accelerometer',
      raw: `${(vib * 10.2).toFixed(1)} mV`,
      calibrated: `${vib} mm/s`,
      sampleRate: '100 Hz',
    },
    {
      channel: `${id}-AI-03`,
      transducer: 'LEM IT 205-S Ultrastab Current Transducer',
      raw: `${(4.0 + (curr / 100) * 16.0).toFixed(2)} mA`,
      calibrated: `${curr} A`,
      sampleRate: '50 Hz',
    },
    {
      channel: `${id}-AI-04`,
      transducer: 'Endress+Hauser Cerabar PMP51 Pressure Sensor',
      raw: '3.82 V DC',
      calibrated: '4.45 bar',
      sampleRate: '10 Hz',
    },
    {
      channel: `${id}-AI-05`,
      transducer: 'Yokogawa ROTAMASS Coriolis Mass Flowmeter',
      raw: '1.42 kHz Pulse',
      calibrated: '42.8 m³/h',
      sampleRate: '20 Hz',
    },
  ];
}

