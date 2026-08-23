import * as THREE from 'three'

/**
 * Shared unit geometries.
 *
 * Every building piece is a unit-sized geometry stretched with the mesh `scale`,
 * so one instance can be reused by every mesh in the scene. They are created once
 * at module load and never disposed — the app keeps them for its whole lifetime,
 * which is what lets us avoid allocating a geometry on every render.
 */

/** Unit cube, centred on the origin. */
export const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1)

/**
 * Isosceles triangular prism with a unit base, unit depth and unit height,
 * centred on its centroid so `position` means the same thing as it does for a box.
 *
 * Footprint looking down the Y axis, apex pointing towards +Z:
 *
 *     -Z   A ________ B      A = (-1/2, -1/3)
 *           \      /         B = ( 1/2, -1/3)
 *            \    /          C = (   0,  2/3)
 *     +Z       \/  C
 *
 * Scaled by [FOUNDATION_SIZE, height, FOUNDATION_SIZE / 2] this becomes a piece
 * whose base spans one full foundation edge and whose apex reaches half a cell
 * beyond it — so a triangle attached to a square never intersects that square.
 *
 * Built with ExtrudeGeometry so face winding, vertex normals and UVs are all
 * generated correctly. A hand-written buffer without a normal attribute renders
 * black under any lit material.
 */
function createTrianglePrismGeometry(): THREE.BufferGeometry {
  // Shape lives in XY; after the rotation below its Y axis becomes world Z.
  // Wound counter-clockwise so ExtrudeGeometry produces outward-facing normals.
  const shape = new THREE.Shape()
  shape.moveTo(-0.5, -1 / 3)
  shape.lineTo(0.5, -1 / 3)
  shape.lineTo(0, 2 / 3)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1,
    bevelEnabled: false,
  })

  // Extrusion runs along +Z; stand the prism up so it runs along +Y instead,
  // then centre it vertically to match the box convention.
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, 0.5, 0)
  geometry.computeVertexNormals()

  return geometry
}

export const TRIANGLE_PRISM_GEOMETRY = createTrianglePrismGeometry()

/** Wireframe outlines used for the selection highlight and the placement preview. */
export const BOX_EDGES_GEOMETRY = new THREE.EdgesGeometry(BOX_GEOMETRY)
export const TRIANGLE_PRISM_EDGES_GEOMETRY = new THREE.EdgesGeometry(TRIANGLE_PRISM_GEOMETRY)

export function getBlockGeometry(isTriangle: boolean): THREE.BufferGeometry {
  return isTriangle ? TRIANGLE_PRISM_GEOMETRY : BOX_GEOMETRY
}

export function getBlockEdgesGeometry(isTriangle: boolean): THREE.BufferGeometry {
  return isTriangle ? TRIANGLE_PRISM_EDGES_GEOMETRY : BOX_EDGES_GEOMETRY
}
