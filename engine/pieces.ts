import { PIECES, PieceShape, PieceType, Tier } from './catalog'
import {
  CELL,
  DECK_INSET,
  TRIANGLE_CIRCUMRADIUS,
  TRIANGLE_INRADIUS,
  WALL_END_CLEARANCE,
  WALL_SIDE_CLEARANCE,
  WALL_THICKNESS,
} from './constants'
import { Vec2, Vec3, normalizeAngle, rotate } from './math'

/**
 * A placed building piece. Immutable: every change produces a new object, which
 * is what lets the renderer skip pieces that did not change and lets history
 * keep old versions around for free.
 *
 * - `x`, `z`: centre of a square, centroid of a triangle, midpoint of a wall
 * - `y`: bottom of the piece
 * - `yaw`: rotation about the vertical axis
 */
export interface Piece {
  readonly id: string
  readonly type: PieceType
  readonly tier: Tier
  readonly x: number
  readonly y: number
  readonly z: number
  readonly yaw: number
}

export type PieceSpec = Omit<Piece, 'id'>

/**
 * An edge of a deck piece, where walls stand and neighbouring decks attach.
 * `normal` is the yaw of the outward normal; `y` is the deck's top surface.
 */
export interface Edge {
  mid: Vec2
  normal: number
  y: number
}

const HALF = CELL / 2
const HALF_WALL = WALL_THICKNESS / 2

/**
 * Local footprints, counter-clockwise when seen from above.
 *
 * Triangles are equilateral and point their apex along local +Z, with the base
 * edge facing local −Z. Squares and triangles both have an edge whose outward
 * normal is local −Z (yaw π), which is the edge every attachment is made by:
 * a deck attached to an edge with outward normal θ is given yaw θ, so that its
 * own −Z edge faces back onto the edge it attached to.
 */
const LOCAL_FOOTPRINTS: Record<PieceShape, readonly Vec2[]> = {
  square: [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
  ],
  triangle: [
    [-HALF, -TRIANGLE_INRADIUS],
    [HALF, -TRIANGLE_INRADIUS],
    [0, TRIANGLE_CIRCUMRADIUS],
  ],
  wall: [
    [-HALF, -HALF_WALL],
    [HALF, -HALF_WALL],
    [HALF, HALF_WALL],
    [-HALF, HALF_WALL],
  ],
}

const LOCAL_EDGE_NORMALS: Record<'square' | 'triangle', readonly number[]> = {
  square: [Math.PI, Math.PI / 2, 0, -Math.PI / 2],
  triangle: [Math.PI, Math.PI / 3, -Math.PI / 3],
}

/** Centre to edge midpoint. */
export function inradius(shape: 'square' | 'triangle'): number {
  return shape === 'square' ? HALF : TRIANGLE_INRADIUS
}

function insetFootprint(shape: 'square' | 'triangle'): readonly Vec2[] {
  const scale = (inradius(shape) - DECK_INSET) / inradius(shape)
  return LOCAL_FOOTPRINTS[shape].map(([x, z]) => [x * scale, z * scale] as const)
}

const LOCAL_COLLISION: Record<PieceShape, readonly Vec2[]> = {
  square: insetFootprint('square'),
  triangle: insetFootprint('triangle'),
  wall: [
    [-(HALF - WALL_END_CLEARANCE), -(HALF_WALL - WALL_SIDE_CLEARANCE)],
    [HALF - WALL_END_CLEARANCE, -(HALF_WALL - WALL_SIDE_CLEARANCE)],
    [HALF - WALL_END_CLEARANCE, HALF_WALL - WALL_SIDE_CLEARANCE],
    [-(HALF - WALL_END_CLEARANCE), HALF_WALL - WALL_SIDE_CLEARANCE],
  ],
}

export function localFootprint(shape: PieceShape): readonly Vec2[] {
  return LOCAL_FOOTPRINTS[shape]
}

function toWorld(spec: PieceSpec, local: readonly Vec2[]): Vec2[] {
  return local.map(([x, z]) => {
    const [rx, rz] = rotate(x, z, spec.yaw)
    return [spec.x + rx, spec.z + rz] as const
  })
}

/** The visual footprint, in world space. */
export function footprint(spec: PieceSpec): Vec2[] {
  return toWorld(spec, LOCAL_FOOTPRINTS[PIECES[spec.type].shape])
}

/** The shrunken footprint used for overlap tests. */
export function collisionFootprint(spec: PieceSpec): Vec2[] {
  return toWorld(spec, LOCAL_COLLISION[PIECES[spec.type].shape])
}

export function topOf(spec: PieceSpec): number {
  return spec.y + PIECES[spec.type].height
}

/** Edges of a deck piece at its top surface. Walls have none. */
export function deckEdges(spec: PieceSpec): Edge[] {
  const { shape } = PIECES[spec.type]
  if (shape === 'wall') return []

  const r = inradius(shape)
  const y = topOf(spec)
  return LOCAL_EDGE_NORMALS[shape].map((localNormal) => {
    const normal = normalizeAngle(localNormal + spec.yaw)
    return {
      mid: [spec.x + Math.sin(normal) * r, spec.z + Math.cos(normal) * r] as const,
      normal,
      y,
    }
  })
}

/** Bottom and top of the piece's vertical axis, used to score how close the cursor is. */
export function axisOf(spec: PieceSpec): [Vec3, Vec3] {
  return [
    [spec.x, spec.y, spec.z],
    [spec.x, topOf(spec), spec.z],
  ]
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export function boundsOf(spec: PieceSpec): Bounds {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const [x, z] of footprint(spec)) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  return { minX, maxX, minY: spec.y, maxY: topOf(spec), minZ, maxZ }
}
