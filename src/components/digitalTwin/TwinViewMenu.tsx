/**
 * DAKSHIN — TWIN VIEW MENU
 *
 * Consolidates the secondary 3D-viewer controls behind ONE chip so the viewport
 * header stays clean:
 *   · Camera framing presets
 *   · Antarctic weather presets (plus LIVE = follow the simulation)
 *   · Demo role switcher (UI visibility gate only — real RBAC is a backend concern)
 *
 * The primary control remains the VISION mode selector in the toolbar; this menu
 * deliberately holds everything that is set-once-rather-than-often.
 */

import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { CameraPresetId } from './station/types';
import type { UserRole } from '../../types/commands';
import type { WeatherState } from '../../types/weather';

interface TwinViewMenuProps {
  weatherState: WeatherState;
  weatherOverride: boolean;
  onWeatherPreset: (state: WeatherState) => void;
  onWeatherLive: () => void;
  onCameraPreset: (preset: CameraPresetId) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const CAMERA_PRESETS: CameraPresetId[] = ['aerial', 'front', 'side', 'infra', 'plan'];

const WEATHER_OPTIONS: { id: WeatherState; label: string }[] = [
  { id: 'CLEAR', label: 'CLEAR' },
  { id: 'LIGHT_SNOW', label: 'LIGHT' },
  { id: 'MODERATE_SNOW', label: 'MOD' },
  { id: 'HEAVY_SNOW', label: 'HEAVY' },
  { id: 'BLIZZARD', label: 'BLIZZARD' },
];

const ROLES: UserRole[] = ['VIEWER', 'OPERATOR', 'ENGINEER', 'ADMIN'];

const chipBase: React.CSSProperties = {
  padding: '0.22rem 0.5rem',
  fontSize: '0.64rem',
  fontWeight: 700,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  border: '1px solid rgba(0, 78, 100, 0.14)',
  backgroundColor: 'transparent',
  color: 'var(--deep-teal)',
  letterSpacing: '0.03em',
};

const chipActive: React.CSSProperties = {
  ...chipBase,
  backgroundColor: 'var(--deep-teal)',
  color: '#FFFFFF',
  border: '1px solid var(--deep-teal)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.58rem',
  fontWeight: 800,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  minWidth: '58px',
};

export const TwinViewMenu: React.FC<TwinViewMenuProps> = ({
  weatherState,
  weatherOverride,
  onWeatherPreset,
  onWeatherLive,
  onCameraPreset,
  role,
  onRoleChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCamera, setLastCamera] = useState<CameraPresetId>('aerial');

  return (
    <div style={{ position: 'relative' }}>
      {/* Single trigger chip */}
      <button
        onClick={() => setIsOpen((open) => !open)}
        title="Camera, weather and role controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.7rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: isOpen ? 'var(--deep-teal)' : 'rgba(255, 255, 255, 0.94)',
          color: isOpen ? '#FFFFFF' : 'var(--deep-teal)',
          border: '1px solid rgba(0, 78, 100, 0.15)',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0, 78, 100, 0.06)',
        }}
      >
        <SlidersHorizontal size={13} />
        VIEW
      </button>

      {/* Click-away backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 29 }}
        />
      )}

      {/* Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            zIndex: 30,
            minWidth: '280px',
            padding: '0.75rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(0, 78, 100, 0.16)',
            boxShadow: '0 12px 32px rgba(0, 78, 100, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...sectionLabel, minWidth: 0 }}>Viewer settings</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close viewer settings"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Camera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={sectionLabel}>Camera</span>
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setLastCamera(preset);
                  onCameraPreset(preset);
                }}
                style={lastCamera === preset ? chipActive : chipBase}
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Weather */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={sectionLabel}>Weather</span>
            <button
              onClick={onWeatherLive}
              title="Follow the live simulated atmospheric conditions"
              style={weatherOverride ? chipBase : chipActive}
            >
              LIVE
            </button>
            {WEATHER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onWeatherPreset(option.id)}
                title={`Set ${option.label} conditions (weather preset override)`}
                style={
                  weatherOverride && weatherState === option.id ? chipActive : chipBase
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Demo role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={sectionLabel}>Role</span>
            {ROLES.map((roleOption) => (
              <button
                key={roleOption}
                onClick={() => onRoleChange(roleOption)}
                title={`Switch to ${roleOption} role (demo only — real authorisation is enforced by the backend)`}
                style={role === roleOption ? chipActive : chipBase}
              >
                {roleOption}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Drag to orbit · scroll to zoom · right-drag to pan · click machinery to inspect.
          </div>
        </div>
      )}
    </div>
  );
};
