/**
 * DAKSHIN — Mock Command Service
 * PC2 Remote Control Center
 *
 * ⚠️  FRONTEND DEMONSTRATION ONLY ⚠️
 *
 * This service simulates the full command lifecycle locally.
 * It is intentionally NOT connected to the backend or PC1.
 *
 * FUTURE REPLACEMENT:
 *   Replace `simulateCommand()` with:
 *     const res = await fetch('/api/commands', { method: 'POST', body: JSON.stringify(req) });
 *   and poll or subscribe to CommandFeedback via WebSocket.
 *
 * The command ID and all request shapes are already production-compatible.
 */

import type { CommandRequest, CommandFeedback, CommandStatus } from '../types/commands';

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

function generateCommandId(): string {
  return `CMD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function createCommandRequest(
  params: Omit<CommandRequest, 'command_id' | 'timestamp'>
): CommandRequest {
  return {
    ...params,
    command_id: generateCommandId(),
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Validation Rules
// ---------------------------------------------------------------------------

interface ValidationResult {
  accepted: boolean;
  reason?: string;
}

function validateCommand(req: CommandRequest): ValidationResult {
  // DEMO validation — mirrors what the backend/PC1 would check

  // Can't start something that's already running
  if (req.command_type === 'START') {
    // In demo mode, we don't have real state — always accept START
    return { accepted: true };
  }

  if (req.command_type === 'STOP') {
    // Demonstrate rejection: GEN-02 in maitri is NORMAL (standby) with 0 power
    // Stopping it while GEN-01 is already in WARNING would be rejected in a real system
    if (req.asset_id === 'GEN-02' && req.station_id === 'maitri') {
      // Allow the stop but with a warning note
      return { accepted: true };
    }
    return { accepted: true };
  }

  return { accepted: false, reason: 'Unknown command type.' };
}

// ---------------------------------------------------------------------------
// State Machine Callback
// ---------------------------------------------------------------------------

export type CommandProgressCallback = (feedback: CommandFeedback) => void;

// ---------------------------------------------------------------------------
// Main Submit Function
// FRONTEND DEMO: simulates PC2 → backend → MQTT → PC1 → feedback loop
// ---------------------------------------------------------------------------

export async function submitCommand(
  req: CommandRequest,
  onProgress: CommandProgressCallback
): Promise<CommandFeedback> {
  const base = {
    command_id: req.command_id,
    station_id: req.station_id,
    asset_id: req.asset_id,
  };

  const emit = (status: CommandStatus, message: string): CommandFeedback => {
    const fb: CommandFeedback = { ...base, status, message, timestamp: new Date().toISOString() };
    onProgress(fb);
    return fb;
  };

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Step 1 — Requested
  emit('REQUESTED', `Command ${req.command_type} submitted for ${req.asset_id}. [DEMO]`);
  await delay(420);

  // Step 2 — Validating (simulates backend safety check)
  emit('VALIDATING', `Validating preconditions for ${req.command_type} on ${req.asset_id}…`);
  await delay(820);

  // Run validation rules
  const validation = validateCommand(req);

  if (!validation.accepted) {
    return emit(
      'REJECTED',
      validation.reason ?? `${req.command_type} rejected by safety validation.`
    );
  }

  // Step 3 — Executing (simulates MQTT dispatch to PC1)
  emit(
    'EXECUTING',
    `Command forwarded to ${req.station_id.toUpperCase()} edge node. Awaiting actuator confirmation… [DEMO — no real PC1 connection]`
  );
  await delay(1400);

  // Step 4 — Completed
  return emit(
    'COMPLETED',
    `${req.command_type} completed on ${req.asset_id}. State updated in digital twin. [DEMO]`
  );
}

// ---------------------------------------------------------------------------
// Command Log (in-memory, scoped to session)
// Replace with backend event store during integration phase
// ---------------------------------------------------------------------------

const _commandLog: CommandFeedback[] = [];

export function recordCommandFeedback(fb: CommandFeedback): void {
  _commandLog.unshift(fb); // newest first
  if (_commandLog.length > 50) _commandLog.pop();
}

export function getCommandLog(
  assetId?: string,
  limit = 5
): CommandFeedback[] {
  const filtered = assetId
    ? _commandLog.filter((f) => f.asset_id === assetId)
    : _commandLog;
  return filtered.slice(0, limit);
}
