import React, { useState, useMemo, useEffect } from 'react';
import { useStation } from '../../context/StationContext';
import { useSimulation } from '../../context/SimulationContext';
import {
  Activity,
  Calendar,
  Thermometer,
  Wind,
  Gauge,
  Droplets,
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCw,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import type { StationId } from '../../types';
import type { AtmosphericVariable, TimeRangeFilter } from '../../services/telemetry/telemetryContracts';
import {
  calculateAtmosphericTrendStats,
  getCardinalDirection,
  DATA_PROVENANCE_INFO,
  DATA_PROVENANCE_STRING,
} from '../../services/telemetry/atmosphericHistoryData';

export const AnalyticsPage: React.FC = () => {
  const { selectedStation, selectStation } = useStation();
  const { fetchAtmosphericHistory, couplingState } = useSimulation();

  const [activeStation, setActiveStation] = useState<StationId>(selectedStation?.id || 'maitri');
  const [selectedVar, setSelectedVar] = useState<AtmosphericVariable>('temperature');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24H');
  const [customStart, setCustomStart] = useState<string>('2026-06-23');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-20');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);

  // Sync activeStation with global station if it changes externally
  useEffect(() => {
    if (selectedStation?.id && selectedStation.id !== activeStation) {
      setActiveStation(selectedStation.id);
    }
  }, [selectedStation?.id]);

  const secondaryStation: StationId = activeStation === 'maitri' ? 'bharati' : 'maitri';

  // Fetch points from historical engine based on active station, range, and custom dates
  const historyPoints = useMemo(() => {
    return fetchAtmosphericHistory(timeRange, customStart, customEnd, activeStation);
  }, [fetchAtmosphericHistory, timeRange, customStart, customEnd, activeStation]);

  // Fetch comparison station points if compareMode is active
  const comparePoints = useMemo(() => {
    if (!compareMode) return [];
    return fetchAtmosphericHistory(timeRange, customStart, customEnd, secondaryStation);
  }, [fetchAtmosphericHistory, compareMode, timeRange, customStart, customEnd, secondaryStation]);

  // Compute statistical summary for active station
  const stats = useMemo(() => {
    return calculateAtmosphericTrendStats(historyPoints, selectedVar, timeRange);
  }, [historyPoints, selectedVar, timeRange]);

  // Compute comparison stats if active
  const compareStats = useMemo(() => {
    if (!compareMode || comparePoints.length === 0) return null;
    return calculateAtmosphericTrendStats(comparePoints, selectedVar, timeRange);
  }, [comparePoints, selectedVar, timeRange, compareMode]);

  const hoveredPoint =
    hoveredPointIndex !== null && historyPoints[hoveredPointIndex]
      ? historyPoints[hoveredPointIndex]
      : null;

  const compareHoveredPoint =
    hoveredPointIndex !== null && comparePoints[hoveredPointIndex]
      ? comparePoints[hoveredPointIndex]
      : null;

  // SVG Chart Geometry
  const chartWidth = 920;
  const chartHeight = 250;
  const padding = { top: 25, right: 35, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const pointsData = useMemo(() => {
    if (historyPoints.length === 0) {
      return { path: '', areaPath: '', coords: [], comparePath: '', compareCoords: [], minVal: 0, maxVal: 100 };
    }

    const primaryValues = historyPoints.map((p) => p[selectedVar] as number);
    const secondaryValues = comparePoints.map((p) => p[selectedVar] as number);
    const allValues = compareMode && secondaryValues.length > 0 ? [...primaryValues, ...secondaryValues] : primaryValues;

    let minVal = Math.min(...allValues);
    let maxVal = Math.max(...allValues);
    if (minVal === maxVal) {
      minVal -= 5;
      maxVal += 5;
    }
    const valRange = maxVal - minVal;

    const coords = historyPoints.map((p, idx) => {
      const x = padding.left + (idx / Math.max(1, historyPoints.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (((p[selectedVar] as number) - minVal) / valRange) * innerHeight;
      return { x, y, val: p[selectedVar] as number, timestamp: p.timestamp, point: p };
    });

    const path = coords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    const areaPath =
      coords.length > 0
        ? `${path} L ${coords[coords.length - 1].x},${padding.top + innerHeight} L ${coords[0].x},${padding.top + innerHeight} Z`
        : '';

    // Secondary comparison line coords and path
    let comparePath = '';
    const compareCoords = comparePoints.map((p, idx) => {
      const x = padding.left + (idx / Math.max(1, comparePoints.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - (((p[selectedVar] as number) - minVal) / valRange) * innerHeight;
      return { x, y, val: p[selectedVar] as number, timestamp: p.timestamp, point: p };
    });

    if (compareCoords.length > 0) {
      comparePath = compareCoords.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
      }, '');
    }

    return { path, areaPath, coords, comparePath, compareCoords, minVal, maxVal };
  }, [historyPoints, comparePoints, compareMode, selectedVar, innerWidth, innerHeight, padding]);

  const varConfig: Record<
    AtmosphericVariable,
    { label: string; icon: React.ReactNode; unit: string; color: string; compareColor: string }
  > = {
    temperature: {
      label: 'Temperature',
      icon: <Thermometer size={14} />,
      unit: '°C',
      color: '#004E64',
      compareColor: '#D97706',
    },
    wind_speed: {
      label: 'Wind Velocity',
      icon: <Wind size={14} />,
      unit: 'm/s',
      color: '#0284C7',
      compareColor: '#DC2626',
    },
    pressure: {
      label: 'Pressure',
      icon: <Gauge size={14} />,
      unit: 'hPa',
      color: '#7C3AED',
      compareColor: '#059669',
    },
    humidity: {
      label: 'Humidity',
      icon: <Droplets size={14} />,
      unit: '%',
      color: '#059669',
      compareColor: '#2563EB',
    },
    wind_direction: {
      label: 'Wind Direction',
      icon: <Compass size={14} />,
      unit: '°',
      color: '#D97706',
      compareColor: '#0284C7',
    },
  };

  const activeProvenance = DATA_PROVENANCE_INFO[activeStation];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Page Title & Provenance Banner */}
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
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <Activity size={22} style={{ color: 'var(--deep-teal)' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
              Atmospheric Trends &amp; Systems Analytics
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Authentic 90-day polar meteorological observations &amp; thermodynamic environment-load coupling.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 78, 100, 0.08)',
              border: '1px solid rgba(0, 78, 100, 0.18)',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--deep-teal)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title={DATA_PROVENANCE_STRING}
          >
            <Sparkles size={13} />
            HISTORICAL-DATA-DRIVEN SIMULATION
          </div>

          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: compareMode ? '1px solid #D97706' : '1px solid rgba(0, 78, 100, 0.2)',
              backgroundColor: compareMode ? 'rgba(217, 119, 6, 0.12)' : '#FFFFFF',
              color: compareMode ? '#D97706' : 'var(--deep-teal)',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowRightLeft size={13} />
            {compareMode ? 'Comparing: MAITRI vs BHARATI' : 'Compare Stations'}
          </button>
        </div>
      </div>

      {/* Primary Section: Atmospheric Intelligence & Trends Graph */}
      <div
        className="frost-card"
        style={{
          padding: '1.75rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Controls Bar: Station, Variable, Time Range */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Station Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATION:</span>
            {(['maitri', 'bharati'] as StationId[]).map((stId) => {
              const active = activeStation === stId;
              return (
                <button
                  key={stId}
                  onClick={() => {
                    setActiveStation(stId);
                    selectStation(stId);
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    border: active ? '1px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                    backgroundColor: active ? 'var(--deep-teal)' : 'var(--mist-gray-light)',
                    color: active ? '#FFFFFF' : 'var(--deep-teal)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {stId.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Variable Selector */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(Object.keys(varConfig) as AtmosphericVariable[]).map((v) => {
              const active = selectedVar === v;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVar(v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: active ? `1px solid ${varConfig[v].color}` : '1px solid rgba(0, 78, 100, 0.12)',
                    backgroundColor: active ? varConfig[v].color : '#FFFFFF',
                    color: active ? '#FFFFFF' : 'var(--deep-teal)',
                    cursor: 'pointer',
                  }}
                >
                  {varConfig[v].icon}
                  {varConfig[v].label}
                </button>
              );
            })}
          </div>

          {/* Time Range Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {(['24H', '7D', '1M', '3M', 'CUSTOM'] as TimeRangeFilter[]).map((r) => {
              const active = timeRange === r;
              return (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    border: active ? '1px solid var(--deep-teal)' : '1px solid rgba(0, 78, 100, 0.15)',
                    backgroundColor: active ? 'var(--deep-teal)' : '#FFFFFF',
                    color: active ? '#FFFFFF' : 'var(--deep-teal)',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Range Input Bar if selected */}
        {timeRange === 'CUSTOM' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: 'var(--mist-gray-light)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', flexWrap: 'wrap' }}>
            <Calendar size={15} style={{ color: 'var(--deep-teal)' }} />
            <span style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>Custom Historical Interval:</span>
            <input
              type="date"
              value={customStart}
              min="2026-06-23"
              max="2026-09-20"
              onChange={(e) => setCustomStart(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 78, 100, 0.2)', fontSize: '0.75rem' }}
            />
            <span>to</span>
            <input
              type="date"
              value={customEnd}
              min="2026-06-23"
              max="2026-09-20"
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 78, 100, 0.2)', fontSize: '0.75rem' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              Available Archive: 23 Jun 2026 – 20 Sep 2026 (90 Days, 2160 Hourly Observations).
            </span>
          </div>
        )}

        {/* Statistical Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.85rem' }}>
          {/* Current Value */}
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Current Value ({activeStation.toUpperCase()})
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 900, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
              {historyPoints.length > 0 ? (
                <>
                  {stats.current} <span style={{ fontSize: '0.85rem' }}>{stats.unit}</span>
                  {selectedVar === 'wind_direction' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                      ({getCardinalDirection(stats.current)})
                    </span>
                  )}
                </>
              ) : (
                '—'
              )}
            </div>
            {compareMode && compareStats && (
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {secondaryStation.toUpperCase()}: {compareStats.current} {compareStats.unit}
              </div>
            )}
          </div>

          {/* Minimum */}
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Minimum ({activeStation.toUpperCase()})
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 900, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
              {historyPoints.length > 0 ? (
                <>
                  {stats.min} <span style={{ fontSize: '0.85rem' }}>{stats.unit}</span>
                </>
              ) : (
                '—'
              )}
            </div>
            {compareMode && compareStats && (
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {secondaryStation.toUpperCase()}: {compareStats.min} {compareStats.unit}
              </div>
            )}
          </div>

          {/* Maximum */}
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Maximum ({activeStation.toUpperCase()})
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 900, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
              {historyPoints.length > 0 ? (
                <>
                  {stats.max} <span style={{ fontSize: '0.85rem' }}>{stats.unit}</span>
                </>
              ) : (
                '—'
              )}
            </div>
            {compareMode && compareStats && (
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {secondaryStation.toUpperCase()}: {compareStats.max} {compareStats.unit}
              </div>
            )}
          </div>

          {/* Period Average */}
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Period Average {selectedVar === 'wind_direction' ? '(Circular)' : ''}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 900, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
              {historyPoints.length > 0 ? (
                <>
                  {stats.avg} <span style={{ fontSize: '0.85rem' }}>{stats.unit}</span>
                  {selectedVar === 'wind_direction' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                      ({getCardinalDirection(stats.avg)})
                    </span>
                  )}
                </>
              ) : (
                '—'
              )}
            </div>
            {compareMode && compareStats && (
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {secondaryStation.toUpperCase()}: {compareStats.avg} {compareStats.unit}
              </div>
            )}
          </div>

          {/* Trend Direction */}
          <div style={{ background: 'var(--mist-gray-light)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.08)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Trend Direction
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
              {stats.trend_direction === 'rising' ? (
                <>
                  <TrendingUp size={18} style={{ color: '#DC2626' }} />
                  <span>RISING</span>
                </>
              ) : stats.trend_direction === 'falling' ? (
                <>
                  <TrendingDown size={18} style={{ color: '#0284C7' }} />
                  <span>FALLING</span>
                </>
              ) : stats.trend_direction === 'veering' ? (
                <>
                  <RotateCw size={18} style={{ color: '#D97706' }} />
                  <span>VEERING (CW)</span>
                </>
              ) : stats.trend_direction === 'backing' ? (
                <>
                  <RotateCcw size={18} style={{ color: '#7C3AED' }} />
                  <span>BACKING (CCW)</span>
                </>
              ) : (
                <>
                  <Minus size={18} style={{ color: '#059669' }} />
                  <span>STABLE</span>
                </>
              )}
            </div>
            {compareMode && compareStats && (
              <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {secondaryStation.toUpperCase()}: {compareStats.trend_direction.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Interactive SVG Trend Chart */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto', background: '#FAFCFD', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
          {historyPoints.length === 0 ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={36} color="#DC2626" />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--deep-teal)' }}>
                NO DATA AVAILABLE FOR SELECTED PERIOD
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
                The selected date interval contains zero archived records. Please choose a range within the authentic 90-day archive (23 Jun 2026 – 20 Sep 2026).
              </div>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              {/* Grid horizontal guides */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + innerHeight * ratio;
                const val = (pointsData.maxVal - ratio * (pointsData.maxVal - pointsData.minVal)).toFixed(1);
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="rgba(0, 78, 100, 0.08)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill for Primary Station */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={varConfig[selectedVar].color} stopOpacity="0.20" />
                  <stop offset="100%" stopColor={varConfig[selectedVar].color} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {pointsData.areaPath && !compareMode && (
                <path d={pointsData.areaPath} fill="url(#areaGradient)" />
              )}

              {/* Secondary Comparison Station Polyline Path (Dashed) */}
              {compareMode && pointsData.comparePath && (
                <path
                  d={pointsData.comparePath}
                  fill="none"
                  stroke={varConfig[selectedVar].compareColor}
                  strokeWidth="2.2"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Primary Active Station Polyline Path (Solid) */}
              {pointsData.path && (
                <path
                  d={pointsData.path}
                  fill="none"
                  stroke={varConfig[selectedVar].color}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points markers: only draw circles if few points or on hovered point to prevent visual clutter */}
              {pointsData.coords.map((pt, i) => {
                const isHovered = hoveredPointIndex === i;
                const showDot = pointsData.coords.length <= 32 || isHovered;
                if (!showDot) return null;

                return (
                  <circle
                    key={`p-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 2.5}
                    fill={isHovered ? varConfig[selectedVar].color : '#FFFFFF'}
                    stroke={varConfig[selectedVar].color}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {/* Comparison hovered point marker */}
              {compareMode &&
                hoveredPointIndex !== null &&
                pointsData.compareCoords[hoveredPointIndex] && (
                  <circle
                    cx={pointsData.compareCoords[hoveredPointIndex].x}
                    cy={pointsData.compareCoords[hoveredPointIndex].y}
                    r={5.5}
                    fill={varConfig[selectedVar].compareColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                )}

              {/* Hover vertical crosshair */}
              {hoveredPointIndex !== null && pointsData.coords[hoveredPointIndex] && (
                <line
                  x1={pointsData.coords[hoveredPointIndex].x}
                  y1={padding.top}
                  x2={pointsData.coords[hoveredPointIndex].x}
                  y2={padding.top + innerHeight}
                  stroke="var(--deep-teal)"
                  strokeDasharray="2 2"
                  strokeWidth="1.2"
                />
              )}

              {/* Invisible full-height hover hit-areas across time points */}
              {pointsData.coords.map((pt, i) => {
                const colWidth = innerWidth / Math.max(1, pointsData.coords.length);
                return (
                  <rect
                    key={`hit-${i}`}
                    x={pt.x - colWidth / 2}
                    y={padding.top}
                    width={colWidth}
                    height={innerHeight}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHoveredPointIndex(i)}
                  />
                );
              })}

              {/* X-axis date labels */}
              {pointsData.coords.length > 0 &&
                [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const idx = Math.min(
                    pointsData.coords.length - 1,
                    Math.round(ratio * (pointsData.coords.length - 1))
                  );
                  const pt = pointsData.coords[idx];
                  if (!pt) return null;
                  const d = new Date(pt.timestamp);
                  const label =
                    timeRange === '24H'
                      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                  return (
                    <text
                      key={ratio}
                      x={pt.x}
                      y={padding.top + innerHeight + 18}
                      textAnchor={ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'}
                      fontSize="9.5"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {label}
                    </text>
                  );
                })}
            </svg>
          )}

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(8px)',
                padding: '0.65rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 78, 100, 0.2)',
                boxShadow: '0 4px 18px rgba(0, 78, 100, 0.12)',
                fontSize: '0.72rem',
                color: 'var(--deep-teal)',
                minWidth: '220px',
                zIndex: 10,
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                {new Date(hoveredPoint.timestamp).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Primary station value */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontWeight: 700, color: varConfig[selectedVar].color }}>
                  {activeStation.toUpperCase()}:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 900 }}>
                  {hoveredPoint[selectedVar]} {varConfig[selectedVar].unit}
                  {selectedVar === 'wind_direction' && ` (${hoveredPoint.wind_direction_cardinal})`}
                </span>
              </div>

              {/* Secondary comparison station value if active */}
              {compareMode && compareHoveredPoint && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', color: varConfig[selectedVar].compareColor }}>
                  <span style={{ fontWeight: 700 }}>{secondaryStation.toUpperCase()}:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 900 }}>
                    {compareHoveredPoint[selectedVar]} {varConfig[selectedVar].unit}
                    {selectedVar === 'wind_direction' && ` (${compareHoveredPoint.wind_direction_cardinal})`}
                  </span>
                </div>
              )}

              <div style={{ marginTop: '0.35rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(0, 78, 100, 0.08)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.68rem' }}>
                <span>Wind: {hoveredPoint.wind_speed} m/s ({hoveredPoint.wind_direction_cardinal})</span>
                <span>{hoveredPoint.weather_state}</span>
              </div>
            </div>
          )}
        </div>

        {/* Provenance note & Metadata Box */}
        <div
          style={{
            background: 'var(--mist-gray-light)',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 78, 100, 0.1)',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--deep-teal)' }}>
              Data Provenance &amp; Instrument Record:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Total Verified Observations: {activeProvenance.totalRecords} Hours
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.2rem' }}>
            <div>
              <strong>Station:</strong> {activeProvenance.stationName}
            </div>
            <div>
              <strong>Climate Regime:</strong> {activeProvenance.climateRegime}
            </div>
            <div>
              <strong>Coordinates:</strong> {activeProvenance.coordinates} ({activeProvenance.elevation})
            </div>
            <div>
              <strong>Archive Interval:</strong> {activeProvenance.archivePeriod}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Section: Environment -> Machinery Physical Coupling Architecture */}
      <div
        className="frost-card"
        style={{
          padding: '1.75rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 78, 100, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} style={{ color: 'var(--deep-teal)' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--deep-teal)', margin: 0 }}>
              Environment → Machinery Physical Coupling Architecture
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--deep-teal)' }}>
            PROTOTYPE SIMULATION RELATIONSHIP
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          In the Antarctic biome, machinery telemetry does not operate in isolation. Sub-zero temperatures drive heating loads, which cascade directly into electrical demand, diesel generation, and bearing stress.
        </p>

        {/* 5 Sequential Coupling Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>
              STAGE 1: AMBIENT TEMP
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--deep-teal)' }}>
              {couplingState.outside_temp}°C
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Surface Antarctic temperature at {selectedStation?.name || activeStation.toUpperCase()}
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>
              STAGE 2: HEATING DEMAND
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: couplingState.heating_demand_pct > 80 ? '#DC2626' : 'var(--deep-teal)' }}>
              {couplingState.heating_demand_pct}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Glycol loop &amp; life-support thermal load
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>
              STAGE 3: STATION LOAD
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--deep-teal)' }}>
              {couplingState.station_electrical_load_kw} kW
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Electrical bus power draw
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>
              STAGE 4: GEN LOAD / FUEL
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: couplingState.generator_load_pct > 85 ? '#DC2626' : 'var(--deep-teal)' }}>
              {couplingState.generator_load_pct}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Burn rate: {couplingState.total_fuel_consumption_rate} L/h
            </div>
          </div>

          <div style={{ background: 'var(--mist-gray-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 78, 100, 0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--deep-teal)', marginBottom: '0.25rem' }}>
              STAGE 5: STRESS INDEX
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: couplingState.machinery_stress_index > 60 ? '#DC2626' : couplingState.machinery_stress_index > 35 ? '#D97706' : '#059669' }}>
              {couplingState.machinery_stress_index} / 100
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Overall station risk: {couplingState.overall_risk_score}
            </div>
          </div>
        </div>

        <div style={{ padding: '0.85rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0, 78, 100, 0.05)', border: '1px solid rgba(0, 78, 100, 0.12)', fontSize: '0.78rem', color: 'var(--deep-teal)', fontStyle: 'italic' }}>
          <strong>Active Simulation State:</strong> {couplingState.active_coupling_text}
        </div>
      </div>
    </div>
  );
};
