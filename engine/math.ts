/**
 * Small, allocation-light geometry helpers. Plain tuples rather than three.js
 * vectors keep the engine free of rendering dependencies.
 *
 * Yaw convention (the same as three.js `rotation.y`): a yaw of θ turns local +Z
 * into the world direction (sin θ, cos θ) and local +X into (cos θ, −sin θ).
 */

export type Vec2 = readonly [number, number]
export type Vec3 = readonly [number, number, number]

export interface Ray {
  origin: Vec3
  /** Unit length. */
  direction: Vec3
}

export function rotate(x: number, z: number, yaw: number): [number, number] {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [x * c + z * s, -x * s + z * c]
}

export function direction(yaw: number): [number, number] {
  return [Math.sin(yaw), Math.cos(yaw)]
}

/** Into (−π, π]. */
export function normalizeAngle(angle: number): number {
  const tau = Math.PI * 2
  let a = angle % tau
  if (a <= -Math.PI) a += tau
  if (a > Math.PI) a -= tau
  // Collapse values a rounding error away from ±π — including the 4-decimal
  // rounding of saved files — so they compare equal.
  if (Math.PI - Math.abs(a) < 1e-4) return Math.PI
  return a
}

/** True for angles that describe the same line, in either direction. */
export function parallel(a: number, b: number): boolean {
  return Math.abs(Math.sin(a - b)) < 1e-3
}

export function distance2(a: Vec2, b: Vec2): number {
  // Not Math.hypot: it is several times slower in V8, and this is a hot path.
  const dx = a[0] - b[0]
  const dz = a[1] - b[1]
  return Math.sqrt(dx * dx + dz * dz)
}

/**
 * Separating axis test for two convex polygons. Polygons that only touch along
 * an edge or at a corner do not overlap.
 */
export function polygonsOverlap(a: readonly Vec2[], b: readonly Vec2[]): boolean {
  return !hasSeparatingAxis(a, b) && !hasSeparatingAxis(b, a)
}

function hasSeparatingAxis(a: readonly Vec2[], b: readonly Vec2[]): boolean {
  for (let i = 0; i < a.length; i++) {
    const p = a[i]
    const q = a[(i + 1) % a.length]
    const ax = q[1] - p[1]
    const az = p[0] - q[0]

    let minA = Infinity
    let maxA = -Infinity
    for (const v of a) {
      const d = v[0] * ax + v[1] * az
      if (d < minA) minA = d
      if (d > maxA) maxA = d
    }
    let minB = Infinity
    let maxB = -Infinity
    for (const v of b) {
      const d = v[0] * ax + v[1] * az
      if (d < minB) minB = d
      if (d > maxB) maxB = d
    }

    const epsilon = 1e-6 * Math.sqrt(ax * ax + az * az)
    if (maxA <= minB + epsilon || maxB <= minA + epsilon) return true
  }
  return false
}

/** Distance from a point to the ray (only the part in front of its origin). */
export function rayPointDistance(ray: Ray, p: Vec3): number {
  const [ox, oy, oz] = ray.origin
  const [dx, dy, dz] = ray.direction
  const vx = p[0] - ox
  const vy = p[1] - oy
  const vz = p[2] - oz
  const t = Math.max(0, vx * dx + vy * dy + vz * dz)
  const ex = vx - dx * t
  const ey = vy - dy * t
  const ez = vz - dz * t
  return Math.sqrt(ex * ex + ey * ey + ez * ez)
}

/**
 * Shortest distance between the ray and the segment a–b: closest points of the
 * two lines, clamped to the ray's origin and the segment's ends.
 */
export function raySegmentDistance(ray: Ray, a: Vec3, b: Vec3): number {
  const [ox, oy, oz] = ray.origin
  const [dx, dy, dz] = ray.direction
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const uz = b[2] - a[2]
  const wx = ox - a[0]
  const wy = oy - a[1]
  const wz = oz - a[2]

  const uu = ux * ux + uy * uy + uz * uz
  const du = dx * ux + dy * uy + dz * uz
  const dw = dx * wx + dy * wy + dz * wz
  const uw = ux * wx + uy * wy + uz * wz
  if (uu < 1e-12) return rayPointDistance(ray, a)

  // Ray parameter t >= 0 (direction is unit length), segment parameter s in [0, 1].
  const denom = uu - du * du
  let s = denom > 1e-12 ? (uw - du * dw) / denom : 0
  s = Math.min(1, Math.max(0, s))
  let t = du * s - dw
  if (t < 0) {
    t = 0
    s = Math.min(1, Math.max(0, uw / uu))
  }

  const ex = wx + dx * t - ux * s
  const ey = wy + dy * t - uy * s
  const ez = wz + dz * t - uz * s
  return Math.sqrt(ex * ex + ey * ey + ez * ez)
}

/** Ray pointing from `from` towards `to`. */
export function rayBetween(from: Vec3, to: Vec3): Ray {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
  return { origin: from, direction: [dx / length, dy / length, dz / length] }
}
