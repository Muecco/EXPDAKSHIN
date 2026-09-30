/**
 * DAKSHIN — STATION-AGNOSTIC X-RAY CONTROLLER
 *
 * Toggles the X-Ray (internal structure) presentation of a station through a
 * small adapter, so the same transition logic serves both MAITRI and BHARATI
 * without the controller knowing either model's internals.
 *
 * Reference behaviour reproduced from the station X-Ray references:
 * - The building envelope becomes translucent (walls, roof, parapet).
 * - Interior partitions, decks, framing and internal equipment stay opaque and
 *   clearly readable.
 * - Site context (terrain, water, container yards, outbuildings) remains
 *   unchanged and fully opaque — it is never ghosted.
 */

export interface XRayTargets {
  /** Envelope (walls / roof / parapet) transparency toggle. */
  setEnvelopeTransparent(enabled: boolean): void;
  /** Interior zone highlighting (partitions, decks, corridors). */
  setInteriorRevealed(enabled: boolean): void;
  /** Optional: sharpen structural metal response while X-Ray is active. */
  setStructureEmphasis?(enabled: boolean): void;
}

export class XRayController {
  private targets: XRayTargets;
  private active = false;

  constructor(targets: XRayTargets) {
    this.targets = targets;
  }

  public setEnabled(enabled: boolean): void {
    this.active = enabled;
    this.targets.setEnvelopeTransparent(enabled);
    this.targets.setInteriorRevealed(enabled);
    this.targets.setStructureEmphasis?.(enabled);
  }

  public isEnabled(): boolean {
    return this.active;
  }
}
