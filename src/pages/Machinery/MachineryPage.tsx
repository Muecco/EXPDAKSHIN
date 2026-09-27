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
} from 'lucide-react';
import type { OperationalStatus } from '../../types';
import type { MachineAssetId } from '../../types/digitalTwin';

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
    </div>
  );
};
