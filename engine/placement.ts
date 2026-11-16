import { PIECES, PieceDef, PieceType, Tier } from './catalog'
import { CELL, ROTATION_STEP, STOREY } from './constants'
import { findCollision } from './collision'
import { Ray, Vec3, direction, normalizeAngle, rayPointDistance, raySegmentDistance } from './math'
import { Piece, PieceSpec, axisOf, deckEdges, inradius, topOf } from './pieces'
import { raycast, intersectGround } from './raycast'
import { MIN_STABILITY, stabilityOf } from './support'
import { World, piecesNear } from './world'

export interface Tool {
  type: PieceType
  tier: Tier
  /** Number of rotate presses. Flips walls; turns free-standing foundations. */
  rotation: number
  /** Snap free-standing foundations to the 3 m world grid. */
  snap: boolean
}

export type PlacementProblem = 'collision' | 'unsupported' | 'unstable'

export interface Placement {
  spec: PieceSpec
  valid: boolean
  problem: PlacementProblem | null
  stability: number
}

/** A socket is considered only when the cursor ray passes this close to the piece it would build. */
const SNAP_DISTANCE = 2

/** How much worse a blocked socket scores than a free one at the same distance. */
const BLOCKED_PENALTY = 1

/** Only the closest few sockets are fully validated each frame. */
const MAX_EVALUATED = 8

// ---------------------------------------------------------------------------
// Sockets
// ---------------------------------------------------------------------------

/**
 * Every position at which a piece of type `def` could attach to `source`.
 *
 *   deck edge  → a neighbouring deck of the same kind, sharing that edge
 *   deck edge  → a wall standing on it
 *   wall top   → another wall standing on it            (full walls)
 *   wall top   → a floor on either side of it           (full and half walls)
 *
 * Because positions come from the source piece rather than from a grid, a
 * triangle can hang off a triangle, a wall can stand on a 60° edge, and pieces
 * follow a foundation that was placed at any angle.
 */
export function socketsOf(
  source: Piece,
  def: PieceDef,
  tool: Pick<Tool, 'tier' | 'rotation'>
): PieceSpec[] {
  const sourceDef = PIECES[source.type]
  const flip = tool.rotation % 2 !== 0 ? Math.PI : 0
  const result: PieceSpec[] = []
  const make = (x: number, y: number, z: number, yaw: number): PieceSpec => ({
    type: def.type,
    tier: tool.tier,
    x,
    y,
    z,
    yaw: normalizeAngle(yaw),
  })

  if (sourceDef.kind === 'wall') {
    if (def.kind === 'foundation' || !sourceDef.carries.includes(def.kind)) return result
    const top = topOf(source)

    if (def.kind === 'wall') {
      result.push(make(source.x, top, source.z, source.yaw + flip))
    } else if (def.kind === 'floor') {
      const r = inradius(def.shape as 'square' | 'triangle')
      for (const normal of [source.yaw, source.yaw + Math.PI]) {
        const [nx, nz] = direction(normal)
        result.push(make(source.x + nx * r, top - def.height, source.z + nz * r, normal))
      }
    }
    return result
  }

  for (const edge of deckEdges(source)) {
    if (def.kind === 'wall') {
      result.push(make(edge.mid[0], edge.y, edge.mid[1], edge.normal + flip))
    } else if (def.kind === sourceDef.kind) {
      const r = inradius(def.shape as 'square' | 'triangle')
      const [nx, nz] = direction(edge.normal)
      result.push(make(edge.mid[0] + nx * r, source.y, edge.mid[1] + nz * r, edge.normal))
    }
  }
  return result
}

/** A foundation standing on its own, under the cursor. */
export function freeFoundation(point: Vec3, tool: Tool): PieceSpec {
  const def = PIECES[tool.type]
  let [x, , z] = point

  if (tool.snap) {
    if (def.shape === 'square') {
      // Cell centres sit on odd multiples of half a cell: 1.5, 4.5, ...
      x = Math.round((x - CELL / 2) / CELL) * CELL + CELL / 2
      z = Math.round((z - CELL / 2) / CELL) * CELL + CELL / 2
    } else {
      x = Math.round(x * 2) / 2
      z = Math.round(z * 2) / 2
    }
  }

  return {
    type: tool.type,
    tier: tool.tier,
    x,
    y: 0,
    z,
    yaw: normalizeAngle(tool.rotation * ROTATION_STEP),
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Whether `spec` can be built in `world`, and if not, why. */
export function evaluatePlacement(world: World, spec: PieceSpec, ignoreId?: string): Placement {
  const stability = stabilityOf(world, spec, ignoreId)

  if (findCollision(world, spec, ignoreId)) {
    return { spec, valid: false, problem: 'collision', stability }
  }
  if (stability <= 0) return { spec, valid: false, problem: 'unsupported', stability }
  if (stability < MIN_STABILITY) return { spec, valid: false, problem: 'unstable', stability }

  return { spec, valid: true, problem: null, stability }
}

// ---------------------------------------------------------------------------
// Solving
// ---------------------------------------------------------------------------

/** Sockets live on pieces up to this far from the piece they would build. */
const SOURCE_REACH = CELL * 1.5

const topCache = new WeakMap<World, number>()

/** Height of the tallest piece, plus room for one more storey on top. */
function buildCeiling(world: World): number {
  let top = topCache.get(world)
  if (top === undefined) {
    top = 0
    for (const piece of world.pieces.values()) top = Math.max(top, topOf(piece))
    top += STOREY + SNAP_DISTANCE
    topCache.set(world, top)
  }
  return top
}

/**
 * Pieces that could offer a socket the ray passes near: those around any point
 * of the ray up to what it hit. Searching only around the hit point is not
 * enough — aiming into the empty air above a wall puts the hit on the ground
 * far behind the base. Stretches of the ray above anything that could be built
 * are skipped.
 */
function sourcesAlong(world: World, ray: Ray, length: number): Piece[] {
  const found = new Map<string, Piece>()
  const ceiling = buildCeiling(world)
  const [ox, oy, oz] = ray.origin
  const [dx, dy, dz] = ray.direction

  // Only the part of the ray below the ceiling can pass near a socket.
  let start = 0
  let end = length
  if (oy > ceiling) {
    if (dy >= 0) return []
    start = (oy - ceiling) / -dy
  } else if (dy > 0) {
    end = Math.min(end, (ceiling - oy) / dy)
  }
  if (start > end) return []

  const steps = Math.ceil((end - start) / CELL)
  for (let i = 0; i <= steps; i++) {
    const t = Math.min(start + i * CELL, end)
    const x = ox + dx * t
    const z = oz + dz * t
    for (const piece of piecesNear(world, x, x, z, z, SOURCE_REACH)) found.set(piece.id, piece)
  }
  return [...found.values()]
}

/**
 * Turn the cursor ray into a placement.
 *
 * 1. Raycast the world to find what the cursor is on.
 * 2. Collect every socket on the pieces around that point.
 * 3. Score each by how close the ray passes to the piece it would build, so
 *    the ghost lands where the user is looking — on any storey, from any angle.
 * 4. Validate the closest few and keep the best, preferring free sockets.
 *
 * With no socket in reach a foundation stands on its own on the ground; any
 * other piece is shown where the cursor is, marked as unsupported.
 *
 * This is the single code path for the ghost, the click that builds, and the
 * tests, so what is shown is always exactly what gets built.
 */
export function solvePlacement(world: World, ray: Ray, tool: Tool): Placement | null {
  const hit = raycast(world, ray)
  if (!hit) return null

  const def = PIECES[tool.type]
  const [px, , pz] = hit.point

  const scored: { spec: PieceSpec; score: number }[] = []
  for (const source of sourcesAlong(world, ray, hit.t)) {
    // No socket lands further than SOURCE_REACH from its source, so a source
    // the ray passes far from cannot offer anything within SNAP_DISTANCE.
    if (rayPointDistance(ray, [source.x, topOf(source), source.z]) > SOURCE_REACH + SNAP_DISTANCE) {
      continue
    }
    for (const spec of socketsOf(source, def, tool)) {
      const [bottom, top] = axisOf(spec)
      const score = raySegmentDistance(ray, bottom, top)
      if (score < SNAP_DISTANCE) scored.push({ spec, score })
    }
  }
  scored.sort((a, b) => a.score - b.score)

  let best: Placement | null = null
  let bestScore = Infinity
  for (const { spec, score } of scored.slice(0, MAX_EVALUATED)) {
    const placement = evaluatePlacement(world, spec)
    const total = score + (placement.valid ? 0 : BLOCKED_PENALTY)
    if (total < bestScore) {
      best = placement
      bestScore = total
    }
  }
  if (best) return best

  if (def.kind === 'foundation') {
    const ground = hit.pieceId === null ? hit : intersectGround(ray)
    return ground ? evaluatePlacement(world, freeFoundation(ground.point, tool)) : null
  }

  return {
    spec: {
      type: tool.type,
      tier: tool.tier,
      x: px,
      y: hit.point[1],
      z: pz,
      yaw: normalizeAngle(tool.rotation * ROTATION_STEP),
    },
    valid: false,
    problem: 'unsupported',
    stability: 0,
  }
}
