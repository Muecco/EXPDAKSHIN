/**
 * DAKSHIN — STATION LAYOUT REGISTRY
 *
 * Resolves the layout manifest for a station. Returns `null` for a station
 * whose manifest has not been produced yet, so callers can fall back to their
 * legacy defaults instead of inventing coordinates.
 */

import type { StationId } from '../../../../types';
import type { StationLayout } from '../types';
import { MAITRI_LAYOUT } from './maitriLayout';
import { BHARATI_LAYOUT } from './bharatiLayout';

export function getStationLayout(stationId: StationId): StationLayout | null {
  if (stationId === 'maitri') return MAITRI_LAYOUT;
  if (stationId === 'bharati') return BHARATI_LAYOUT;
  return null;
}

export { MAITRI_LAYOUT, BHARATI_LAYOUT };
