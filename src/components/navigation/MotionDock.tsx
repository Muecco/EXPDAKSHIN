import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar,
  MountainSnow,
  Box,
  Cog,
  TriangleAlert,
  Activity,
  Wrench,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useStation } from '../../context/StationContext';

export interface MotionDockProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: '/overview', label: 'Overview', icon: Radar },
  { id: '/stations', label: 'Stations', icon: MountainSnow },
  { id: '/digital-twin', label: 'Digital Twin', icon: Box },
  { id: '/machinery', label: 'Machinery', icon: Cog },
  { id: '/alerts', label: 'Alerts', icon: TriangleAlert, badge: 3 },
  { id: '/analytics', label: 'Analytics', icon: Activity },
  { id: '/maintenance', label: 'Maintenance', icon: Wrench },
  { id: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export const MotionDock: React.FC<MotionDockProps> = ({ currentRoute, onRouteChange }) => {
  const { selectedStation, allStations, selectStation, connectionStatus } = useStation();
  const [isStationMenuOpen, setIsStationMenuOpen] = useState(false);

  // ── Hover-collapse state ─────────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // Close station dropdown immediately when dock collapses
    leaveTimerRef.current = setTimeout(() => {
      setIsExpanded(false);
      setIsStationMenuOpen(false);
    }, 300);
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Collapsed pill trigger (always visible when dock is not expanded) ── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="collapsed-pill"
            initial={{ opacity: 0, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.6 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              height: '6px',
              width: '120px',
              borderRadius: '9999px',
              background: 'rgba(0, 78, 100, 0.35)',
              cursor: 'pointer',
              marginBottom: '0px',
            }}
            title="Hover to expand operations dock"
          />
        )}
      </AnimatePresence>

      {/* ── Full Dock (expands on hover) ──────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.nav
            key="full-dock"
            className="glass-dock"
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              borderRadius: 'var(--radius-full)',
              height: '72px',
              padding: '0 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.75rem',
              zIndex: 50,
              width: 'auto',
              maxWidth: '1200px',
              position: 'relative',
            }}
            aria-label="Operations Rail Navigation"
          >
            {/* Left: System Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                paddingLeft: '0.5rem',
                paddingRight: '1.5rem',
                borderRight: '1px solid rgba(0, 78, 100, 0.2)',
                height: '32px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: connectionStatus === 'ONLINE' ? '#10B981' : connectionStatus === 'OFFLINE' ? '#DC2626' : '#F59E0B',
                }}
                className={connectionStatus === 'ONLINE' ? 'status-dot-pulse' : ''}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--deep-teal)',
                  textTransform: 'uppercase',
                }}
              >
                {connectionStatus === 'ONLINE' ? 'SYSTEM ONLINE' : connectionStatus}
              </span>
            </div>

            {/* Center: Navigation Action Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = currentRoute === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={`dock-item ${isActive ? 'active' : ''}`}
                    style={{
                      position: 'relative',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={22} />

                    {/* Notification Pill Badge */}
                    {item.badge !== undefined && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: '-4px',
                          backgroundColor: '#F59E0B',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 800,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          border: '2px solid #E0E5E9',
                        }}
                      >
                        {item.badge}
                      </div>
                    )}

                    {/* Tooltip */}
                    <div
                      className="dock-tooltip"
                      style={{
                        position: 'absolute',
                        top: '-42px',
                        left: '50%',
                        backgroundColor: 'var(--deep-teal)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0, 78, 100, 0.3)',
                        zIndex: 60,
                      }}
                    >
                      {item.label}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'var(--deep-teal)',
                        }}
                      />
                    </div>

                    {/* Active Underline Indicator */}
                    <div
                      className="dock-active-indicator"
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--deep-teal)',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Right: Station Switcher Quick Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '1.5rem',
                borderLeft: '1px solid rgba(0, 78, 100, 0.2)',
                height: '32px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setIsStationMenuOpen(!isStationMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--deep-teal)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  border: '1px solid rgba(0, 78, 100, 0.15)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.65)')}
                title="Switch active station"
                aria-expanded={isStationMenuOpen}
              >
                <span>{selectedStation ? selectedStation.name : 'SELECT STATION'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.8,
                    transform: isStationMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Station Dropdown Menu */}
              {isStationMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    minWidth: '220px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 78, 100, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 30px rgba(0, 78, 100, 0.2)',
                    padding: '0.5rem',
                    zIndex: 70,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      padding: '0.35rem 0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Switch Target Station
                  </div>
                  {Object.values(allStations).map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        selectStation(station.id);
                        setIsStationMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedStation?.id === station.id ? 'rgba(0, 78, 100, 0.1)' : 'transparent',
                        color: 'var(--deep-teal)',
                        fontSize: '0.85rem',
                        fontWeight: selectedStation?.id === station.id ? 800 : 500,
                        marginBottom: '2px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedStation?.id !== station.id) e.currentTarget.style.backgroundColor = 'rgba(0, 78, 100, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedStation?.id !== station.id) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{station.name}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--status-normal)', fontWeight: 700 }}>● ONLINE</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};
