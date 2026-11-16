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
  return Math.hypot(a[0] - b[0], a[1] - b[1])
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

    const epsilon = 1e-6 * Math.hypot(ax, az)
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
  return Math.hypot(vx - dx * t, vy - dy * t, vz - dz * t)
}

/** Distance between the ray and a segment, sampled finely enough for scoring. */
export function raySegmentDistance(ray: Ray, a: Vec3, b: Vec3, samples = 6): number {
  let best = Infinity
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const d = rayPointDistance(ray, [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ])
    if (d < best) best = d
  }
  return best
}

/** Ray pointing from `from` towards `to`. */
export function rayBetween(from: Vec3, to: Vec3): Ray {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dz = to[2] - from[2]
  const length = Math.hypot(dx, dy, dz)
  return { origin: from, direction: [dx / length, dy / length, dz / length] }
}
