import { Ray, Vec3 } from './math'
import { Piece, boundsOf, footprint, topOf } from './pieces'
import { World } from './world'

export interface Hit {
  /** Distance along the ray. */
  t: number
  point: Vec3
  normal: Vec3
  /** `null` when the ray hit the ground. */
  pieceId: string | null
}

/**
 * First thing the ray hits: a piece, or the ground plane at y = 0.
 *
 * Picking goes through the engine rather than through three.js meshes, so the
 * placement logic sees exactly the shapes it reasons about, and the renderer is
 * free to draw pieces however it likes (instanced, merged, with openings).
 */
export function raycast(world: World, ray: Ray, maxDistance = 2000): Hit | null {
  let best: Hit | null = null

  for (const piece of world.pieces.values()) {
    const limit = best ? best.t : maxDistance
    const hit = intersectPiece(piece, ray, limit)
    if (hit) best = hit
  }

  const ground = intersectGround(ray)
  if (ground && ground.t < (best ? best.t : maxDistance)) best = ground

  return best
}

export function intersectGround(ray: Ray): Hit | null {
  const [ox, oy, oz] = ray.origin
  const [dx, dy, dz] = ray.direction
  if (dy >= -1e-9) return null
  const t = -oy / dy
  if (t < 0) return null
  return { t, point: [ox + dx * t, 0, oz + dz * t], normal: [0, 1, 0], pieceId: null }
}

/** Slab test against the bounding box, to skip the exact test for most pieces. */
function hitsBounds(piece: Piece, ray: Ray, limit: number): boolean {
  const b = boundsOf(piece)
  const min = [b.minX, b.minY, b.minZ]
  const max = [b.maxX, b.maxY, b.maxZ]
  let t0 = 0
  let t1 = limit
  for (let axis = 0; axis < 3; axis++) {
    const o = ray.origin[axis]
    const d = ray.direction[axis]
    if (Math.abs(d) < 1e-12) {
      if (o < min[axis] || o > max[axis]) return false
      continue
    }
    let near = (min[axis] - o) / d
    let far = (max[axis] - o) / d
    if (near > far) [near, far] = [far, near]
    t0 = Math.max(t0, near)
    t1 = Math.min(t1, far)
    if (t0 > t1) return false
  }
  return true
}

/**
 * Exact ray / convex prism intersection (Cyrus–Beck clipping against the top,
 * the bottom and one vertical plane per footprint edge).
 */
function intersectPiece(piece: Piece, ray: Ray, limit: number): Hit | null {
  if (!hitsBounds(piece, ray, limit)) return null

  const [ox, oy, oz] = ray.origin
  const [dx, dy, dz] = ray.direction
  let tEnter = -Infinity
  let tExit = Infinity
  let enterNormal: Vec3 = [0, 1, 0]

  const clip = (nx: number, ny: number, nz: number, offset: number): boolean => {
    // Inside the half-space when n · p <= offset.
    const denom = nx * dx + ny * dy + nz * dz
    const start = nx * ox + ny * oy + nz * oz
    if (Math.abs(denom) < 1e-12) return start <= offset
    const t = (offset - start) / denom
    if (denom < 0) {
      if (t > tEnter) {
        tEnter = t
        enterNormal = [nx, ny, nz]
      }
    } else if (t < tExit) {
      tExit = t
    }
    return tEnter <= tExit
  }

  if (!clip(0, 1, 0, topOf(piece))) return null
  if (!clip(0, -1, 0, -piece.y)) return null

  const polygon = footprint(piece)
  for (let i = 0; i < polygon.length; i++) {
    const [ax, az] = polygon[i]
    const [bx, bz] = polygon[(i + 1) % polygon.length]
    // Footprints are counter-clockwise seen from above (+Y), which in the
    // x/z plane makes (dz, −dx) of each edge point outwards.
    let nx = bz - az
    let nz = -(bx - ax)
    const length = Math.hypot(nx, nz)
    nx /= length
    nz /= length
    // Guard against winding mistakes: the normal must point away from the centre.
    if (nx * (ax - piece.x) + nz * (az - piece.z) < 0) {
      nx = -nx
      nz = -nz
    }
    if (!clip(nx, 0, nz, nx * ax + nz * az)) return null
  }

  if (tEnter < 0 || tEnter > limit || tEnter > tExit) return null
  return {
    t: tEnter,
    point: [ox + dx * tEnter, oy + dy * tEnter, oz + dz * tEnter],
    normal: enterNormal,
    pieceId: piece.id,
  }
}
