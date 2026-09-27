/**
 * DAKSHIN — EXPLAINABLE PROTOTYPE RISK MODEL
 *
 * Implements the explainable prototype risk model:
 * - 30% Thermal Stress Contribution
 * - 30% Vibration Amplitude Contribution
 * - 20% Electrical Load/Current Contribution
 * - 20% Mechanical/Thermal Efficiency Deficit Contribution
 *
 * Risk Bands:
 *   0  - 30 : NORMAL
 *   31 - 60 : WARNING
 *   61 - 80 : HIGH
 *   81 - 100: CRITICAL
 *
 * NOTE: This is a prototype diagnostic score for mission control decision-support,
 * not a certified probabilistic failure forecast.
 */

import type { MachineryBaseline, RiskBreakdown, RiskState } from './telemetryContracts';

export interface RiskWeights {
  temperatureWeight: number; // 0.30
  vibrationWeight: number;   // 0.30
  currentWeight: number;     // 0.20
  efficiencyWeight: number;  // 0.20
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  temperatureWeight: 0.30,
  vibrationWeight: 0.30,
  currentWeight: 0.20,
  efficiencyWeight: 0.20,
};

export function calculateAssetRisk(
  baseline: MachineryBaseline,
  currentTemp: number,
  currentVib: number,
  currentCurr: number,
  currentEff: number,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): RiskBreakdown {
  const { thresholds } = baseline;
  const contributors: string[] = [];

  // 1. Temperature Stress (0 - 100 scale, weighted to 30)
  let tempFactor = 0;
  if (currentTemp > thresholds.temp_crit) {
    tempFactor = 1.0;
    contributors.push(`Temperature critical: ${currentTemp.toFixed(1)}°C (limit ${thresholds.temp_crit}°C)`);
  } else if (currentTemp > thresholds.temp_warn) {
    tempFactor = 0.5 + 0.5 * ((currentTemp - thresholds.temp_warn) / (thresholds.temp_crit - thresholds.temp_warn));
    contributors.push(`Thermal elevation: ${currentTemp.toFixed(1)}°C (+${(currentTemp - baseline.baseline_temperature).toFixed(1)}°C over baseline)`);
  } else if (currentTemp > baseline.baseline_temperature) {
    tempFactor = 0.2 * ((currentTemp - baseline.baseline_temperature) / Math.max(1, thresholds.temp_warn - baseline.baseline_temperature));
  }
  const tempScore = Math.min(30, Math.round(tempFactor * 100 * weights.temperatureWeight));

  // 2. Vibration Stress (0 - 100 scale, weighted to 30)
  let vibFactor = 0;
  if (currentVib > thresholds.vib_crit) {
    vibFactor = 1.0;
    contributors.push(`Vibration critical: ${currentVib.toFixed(1)} mm/s (limit ${thresholds.vib_crit} mm/s)`);
  } else if (currentVib > thresholds.vib_warn) {
    vibFactor = 0.5 + 0.5 * ((currentVib - thresholds.vib_warn) / (thresholds.vib_crit - thresholds.vib_warn));
    contributors.push(`Vibration variance: ${currentVib.toFixed(1)} mm/s RMS (threshold ${thresholds.vib_warn} mm/s)`);
  } else if (currentVib > baseline.baseline_vibration) {
    vibFactor = 0.2 * ((currentVib - baseline.baseline_vibration) / Math.max(0.1, thresholds.vib_warn - baseline.baseline_vibration));
  }
  const vibScore = Math.min(30, Math.round(vibFactor * 100 * weights.vibrationWeight));

  // 3. Current / Electrical Load Stress (0 - 100 scale, weighted to 20)
  let currFactor = 0;
  if (currentCurr > thresholds.curr_crit) {
    currFactor = 1.0;
    contributors.push(`Current overload: ${currentCurr.toFixed(1)} A (exceeds ${thresholds.curr_crit} A)`);
  } else if (currentCurr > thresholds.curr_warn) {
    currFactor = 0.5 + 0.5 * ((currentCurr - thresholds.curr_warn) / Math.max(1, thresholds.curr_crit - thresholds.curr_warn));
    contributors.push(`High electrical load: ${currentCurr.toFixed(1)} A`);
  } else if (currentCurr > baseline.baseline_current && baseline.baseline_current > 0) {
    currFactor = 0.2 * ((currentCurr - baseline.baseline_current) / Math.max(1, thresholds.curr_warn - baseline.baseline_current));
  }
  const currScore = Math.min(20, Math.round(currFactor * 100 * weights.currentWeight));

  // 4. Efficiency Deficit Stress (0 - 100 scale, weighted to 20)
  let effFactor = 0;
  if (currentEff < thresholds.eff_crit) {
    effFactor = 1.0;
    contributors.push(`Severe efficiency drop: ${currentEff.toFixed(1)}% (critical threshold ${thresholds.eff_crit}%)`);
  } else if (currentEff < thresholds.eff_warn) {
    effFactor = 0.5 + 0.5 * ((thresholds.eff_warn - currentEff) / Math.max(1, thresholds.eff_warn - thresholds.eff_crit));
    contributors.push(`Operating efficiency degraded: ${currentEff.toFixed(1)}% (nominal ${baseline.baseline_efficiency}%)`);
  } else if (currentEff < baseline.baseline_efficiency) {
    effFactor = 0.2 * ((baseline.baseline_efficiency - currentEff) / Math.max(1, baseline.baseline_efficiency - thresholds.eff_warn));
  }
  const effScore = Math.min(20, Math.round(effFactor * 100 * weights.efficiencyWeight));

  // Base mechanical entropy score (baseline wear factor)
  const baseEntropy = Math.min(8, Math.round((100 - baseline.health_score) * 0.1));

  const totalScore = Math.min(100, Math.max(0, tempScore + vibScore + currScore + effScore + baseEntropy));

  let state: RiskState = 'NORMAL';
  if (totalScore >= 80) state = 'CRITICAL';
  else if (totalScore >= 60) state = 'HIGH';
  else if (totalScore >= 30) state = 'WARNING';

  if (contributors.length === 0) {
    contributors.push('Operating within nominal baseline parameters');
  }

  return {
    score: totalScore,
    state,
    temperature_contribution: tempScore,
    vibration_contribution: vibScore,
    current_contribution: currScore,
    efficiency_contribution: effScore,
    contributors,
  };
}
