/**
 * DAKSHIN — SEE-THROUGH WALL CONTROLLER (GLASS X-RAY / PIPELINE VISION)
 *
 * Renders building envelopes as glass-like, see-through surfaces so the
 * station interior reads through them. This is a deliberate step beyond the
 * earlier simple opacity fade: it uses transparent physical materials with a
 * subtle fresnel tint plus thin luminous edge highlights, so you can see into
 * the building while its shape is still preserved.
 *
 * Opacity hierarchy (matching the X-ray reference):
 *   Exterior walls  → ~0.14 – 0.2 (glass)
 *   Structural      → ~0.6 – 0.8
 *   Interior / kit  → fully opaque
 *   Edge highlights → crisp thin outline so the volume never disappears
 */

import * as THREE from 'three';

export class SeeThroughController {
  /** Materials ghosted in see-through mode (walls / roof / trim). */
  private wallMaterials: THREE.MeshPhysicalMaterial[] = [];
  /** Backup of the original material per ghosted mesh. */
  private originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  /** Meshes currently ghosted. */
  private ghosted: THREE.Mesh[] = [];
  /** Edge highlight meshes added in see-through mode. */
  private edges: THREE.Object3D[] = [];
  /** Structural materials boosted toward 0.6–0.8 opacity in see-through mode. */
  private structureMaterials: { material: THREE.MeshStandardMaterial; normalOpacity: number }[] = [];

  private active = false;

  /** Registers a standard material as a structural element. */
  public registerStructure(material: THREE.MeshStandardMaterial): void {
    this.structureMaterials.push({ material, normalOpacity: material.opacity });
  }

  /**
   * Ghosts a set of meshes into glass. The original material is preserved and
   * restored when see-through is disabled.
   */
  public ghostMeshes(meshes: THREE.Mesh[]): void {
    meshes.forEach((mesh) => {
      if (this.originals.has(mesh)) return;

      this.originals.set(mesh, mesh.material);
      const ghost = new THREE.MeshPhysicalMaterial({
        color: '#9CC7E4',
        roughness: 0.08,
        metalness: 0.12,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        transmission: 0.4,
        ior: 1.2,
        clearcoat: 0.35,
        clearcoatRoughness: 0.5,
        side: THREE.DoubleSide,
      });
      mesh.material = ghost;
      mesh.renderOrder = 1;
      this.wallMaterials.push(ghost);
      this.ghosted.push(mesh);

      // Crisp luminous edge highlight so the volume never disappears
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 25),
        new THREE.LineBasicMaterial({ color: '#A8D8F0', transparent: true, opacity: 0.7 })
      );
      edge.position.copy(mesh.position);
      edge.rotation.copy(mesh.rotation);
      edge.scale.copy(mesh.scale);
      mesh.parent?.add(edge);
      this.edges.push(edge);
    });
  }

  /** Toggles see-through (glass) mode on or off. */
  public setEnabled(enabled: boolean): void {
    if (enabled === this.active) return;
    this.active = enabled;

    if (enabled) {
      // Boost structural elements toward the 0.6–0.8 band
      this.structureMaterials.forEach(({ material }) => {
        material.transparent = true;
        material.opacity = 0.72;
        material.metalness = 0.92;
      });
    } else {
      // Restore original materials
      this.ghosted.forEach((mesh) => {
        const original = this.originals.get(mesh);
        if (original) mesh.material = original;
        mesh.renderOrder = 0;
      });
      this.wallMaterials.forEach((m) => m.dispose());
      this.wallMaterials = [];
      this.ghosted = [];
      this.originals.clear();

      // Remove edge highlights
      this.edges.forEach((edge) => {
        edge.parent?.remove(edge);
        if (edge instanceof THREE.LineSegments) {
          edge.geometry.dispose();
          (edge.material as THREE.Material).dispose();
        }
      });
      this.edges = [];

      // Restore structural opacity
      this.structureMaterials.forEach(({ material, normalOpacity }) => {
        material.transparent = false;
        material.opacity = normalOpacity;
        material.metalness = 0.8;
      });
    }
  }

  /** Ghosts a fresh set of meshes (call after building them) and enables. */
  public apply(meshes: THREE.Mesh[]): void {
    this.setEnabled(false);
    this.ghostMeshes(meshes);
    this.setEnabled(true);
  }

  public isEnabled(): boolean {
    return this.active;
  }

  public dispose(): void {
    this.setEnabled(false);
  }
}
