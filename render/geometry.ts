import * as THREE from 'three'
import {
  CELL,
  PIECES,
  PieceDef,
  PieceType,
  WALL_THICKNESS,
  inradius,
  localFootprint,
} from '@/engine'

/**
 * Meshes for every piece type, built once and shared by every piece of that
 * type. Origins follow the engine: x/z at the piece's centre (centroid for
 * triangles, midpoint for walls), y = 0 at its bottom.
 *
 * Everything is extruded from a 2D outline, so openings are real holes, edges
 * get a small bevel that catches the light, and UVs come out in metres — a
 * texture tiles at its real-world size on every face, whatever the piece's
 * proportions.
 */

const BEVEL = 0.025

/** Width of the rim around the hole in a floor frame. */
const FLOOR_FRAME_RIM = 0.45

const DOOR = { width: 1.2, height: 2.25 }
const WINDOW = { width: 1.0, bottom: 1.35, top: 2.3 }
const WALL_FRAME = { width: 2.4, height: 2.6 }

function extrude(shape: THREE.Shape, depth: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    depth: depth - BEVEL * 2,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    // A negative offset keeps the outline where it was instead of growing it.
    bevelOffset: -BEVEL,
    bevelSegments: 1,
    curveSegments: 1,
  })
}

function polygonPath<T extends THREE.Path>(
  path: T,
  points: readonly (readonly [number, number])[]
): T {
  path.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) path.lineTo(x, y)
  path.closePath()
  return path
}

/** Square or triangle slab: outline in the ground plane, extruded upwards. */
function deckGeometry(def: PieceDef): THREE.BufferGeometry {
  const shapeKind = def.shape as 'square' | 'triangle'
  // Shape space (sx, sy) = local (x, −z); rotating −90° about X then maps the
  // extrusion direction onto +Y and sy back onto +Z.
  const outline = localFootprint(shapeKind).map(([x, z]) => [x, -z] as const)
  const shape = polygonPath(new THREE.Shape(), outline)

  if (def.opening === 'floor-frame') {
    const r = inradius(shapeKind)
    const scale = (r - FLOOR_FRAME_RIM) / r
    shape.holes.push(
      polygonPath(
        new THREE.Path(),
        outline.map(([x, y]) => [x * scale, y * scale] as const)
      )
    )
  }

  const geometry = extrude(shape, def.height)
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, BEVEL, 0)
  return geometry
}

/** Wall outline in its own plane (x along the wall, y up), extruded through its thickness. */
function wallOutline(def: PieceDef): THREE.Shape {
  const half = CELL / 2
  const h = def.height

  switch (def.opening) {
    case 'door': {
      const w = DOOR.width / 2
      return polygonPath(new THREE.Shape(), [
        [-half, 0],
        [-w, 0],
        [-w, DOOR.height],
        [w, DOOR.height],
        [w, 0],
        [half, 0],
        [half, h],
        [-half, h],
      ])
    }
    case 'wall-frame': {
      const w = WALL_FRAME.width / 2
      return polygonPath(new THREE.Shape(), [
        [-half, 0],
        [-w, 0],
        [-w, WALL_FRAME.height],
        [w, WALL_FRAME.height],
        [w, 0],
        [half, 0],
        [half, h],
        [-half, h],
      ])
    }
    case 'window': {
      const shape = polygonPath(new THREE.Shape(), [
        [-half, 0],
        [half, 0],
        [half, h],
        [-half, h],
      ])
      const w = WINDOW.width / 2
      shape.holes.push(
        polygonPath(new THREE.Path(), [
          [-w, WINDOW.bottom],
          [-w, WINDOW.top],
          [w, WINDOW.top],
          [w, WINDOW.bottom],
        ])
      )
      return shape
    }
    default:
      return polygonPath(new THREE.Shape(), [
        [-half, 0],
        [half, 0],
        [half, h],
        [-half, h],
      ])
  }
}

function wallGeometry(def: PieceDef): THREE.BufferGeometry {
  const geometry = extrude(wallOutline(def), WALL_THICKNESS)
  geometry.translate(0, 0, -(WALL_THICKNESS - BEVEL * 2) / 2)
  return geometry
}

const geometries = new Map<PieceType, THREE.BufferGeometry>()
const edges = new Map<PieceType, THREE.BufferGeometry>()

export function pieceGeometry(type: PieceType): THREE.BufferGeometry {
  let geometry = geometries.get(type)
  if (!geometry) {
    const def = PIECES[type]
    geometry = def.kind === 'wall' ? wallGeometry(def) : deckGeometry(def)
    geometry.computeBoundingSphere()
    geometries.set(type, geometry)
  }
  return geometry
}

/** Hard edges only, for selection and hover outlines. */
export function pieceEdges(type: PieceType): THREE.BufferGeometry {
  let geometry = edges.get(type)
  if (!geometry) {
    geometry = new THREE.EdgesGeometry(pieceGeometry(type), 30)
    edges.set(type, geometry)
  }
  return geometry
}
