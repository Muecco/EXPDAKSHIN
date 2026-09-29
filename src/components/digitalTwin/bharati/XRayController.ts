import type { StationBuilding } from './StationBuilding';
import type { InteriorLayout } from './InteriorLayout';
import type { StructuralFramework } from './StructuralFramework';

/**
 * XRayController
 *
 * Manages smooth, in-place transitions between Normal architectural vision
 * and X-Ray transparent vision without resetting the camera or recreating the scene.
 */
export class XRayController {
  private building: StationBuilding;
  private interior: InteriorLayout;
  private structure: StructuralFramework;
  private active: boolean = false;

  constructor(
    building: StationBuilding,
    interior: InteriorLayout,
    structure: StructuralFramework
  ) {
    this.building = building;
    this.interior = interior;
    this.structure = structure;
  }

  public setEnabled(enabled: boolean) {
    this.active = enabled;
    this.building.setXRayMode(enabled);
    this.interior.setXRayMode(enabled);
    if (enabled) {
      this.structure.materials.steelStilt.metalness = 0.95;
      this.structure.materials.steelTruss.metalness = 0.9;
    } else {
      this.structure.materials.steelStilt.metalness = 0.8;
      this.structure.materials.steelTruss.metalness = 0.75;
    }
  }

  public isEnabled(): boolean {
    return this.active;
  }
}
