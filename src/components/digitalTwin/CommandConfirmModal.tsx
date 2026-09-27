import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { MachineTelemetry } from '../../types/digitalTwin';

interface CommandConfirmModalProps {
  asset: MachineTelemetry;
  commandType: 'STOP';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Compact confirmation dialog for disruptive commands (STOP).
 * Uses CSS transitions for fade-in — no new animation library required.
 * Matches existing Dakshin visual language: deep teal, mist gray, frost glass.
 */
export const CommandConfirmModal: React.FC<CommandConfirmModalProps> = ({
  asset,
  commandType,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const warnings: Record<string, string> = {
    generator:
      'Stopping this generator may affect station power distribution. Ensure the secondary bus can carry the load.',
    pump:
      'Stopping this pump will interrupt fluid transfer. Verify downstream systems can handle the interruption.',
    hvac:
      'Stopping the heat exchanger will reduce habitat thermal regulation. Monitor ambient temperatures.',
    battery:
      'Disconnecting the battery bank removes the UPS buffer from the power bus.',
    fuel_system: '',
    environmental:
      'Stopping the environmental monitor will pause air quality and life-support data collection.',
  };

  const warningText = warnings[asset.asset_type] || 'Confirm this command before proceeding.';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 30, 40, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 9000,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
          zIndex: 9001,
          overflow: 'hidden',
          animation: 'slideUp 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(220, 38, 38, 0.06)',
            borderBottom: '1px solid rgba(220, 38, 38, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} style={{ color: '#DC2626' }} />
            <span
              id="confirm-modal-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#DC2626',
              }}
            >
              {commandType} {asset.asset_id}?
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '2px',
            }}
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--deep-teal)',
              marginBottom: '0.5rem',
            }}
          >
            {asset.name}
          </div>

          {warningText && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: '0 0 1.25rem 0',
                padding: '0.65rem 0.75rem',
                background: 'rgba(220, 38, 38, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(220, 38, 38, 0.1)',
              }}
            >
              {warningText}
            </p>
          )}

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚠ DEMO MODE — No real command will be sent to PC1
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.7rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 78, 100, 0.2)',
                backgroundColor: 'transparent',
                color: 'var(--deep-teal)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '0.7rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}
            >
              REQUEST {commandType}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
};
