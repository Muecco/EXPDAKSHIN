import React from 'react';
import type { UserRole } from '../../types/commands';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
}

const ROLES: UserRole[] = ['VIEWER', 'OPERATOR', 'ENGINEER', 'ADMIN'];

const ROLE_COLOR: Record<UserRole, string> = {
  VIEWER: '#64748B',
  OPERATOR: '#004E64',
  ENGINEER: '#0369A1',
  ADMIN: '#7C3AED',
};

/**
 * Demo-only role switcher for testing access-gated UI panels.
 *
 * IMPORTANT: This is a frontend demo control only.
 * Real RBAC enforcement must happen in the backend.
 * Hiding/showing UI elements is NOT a security mechanism.
 */
export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '3px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(0, 78, 100, 0.15)',
        boxShadow: '0 2px 6px rgba(0, 78, 100, 0.05)',
      }}
      title="DEMO: Frontend role simulation only — real authorization is enforced by the backend"
    >
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          color: 'var(--text-muted)',
          padding: '0 0.3rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          opacity: 0.7,
        }}
      >
        DEMO ROLE
      </span>
      {ROLES.map((role) => {
        const isActive = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => onChange(role)}
            title={`Switch to ${role} role (demo only)`}
            style={{
              padding: '0.22rem 0.5rem',
              fontSize: '0.65rem',
              fontWeight: isActive ? 800 : 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isActive ? ROLE_COLOR[role] : 'transparent',
              color: isActive ? '#FFFFFF' : ROLE_COLOR[role],
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: 'none',
              letterSpacing: '0.04em',
            }}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
};
