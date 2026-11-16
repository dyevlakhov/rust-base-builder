import { VERTICAL_TOLERANCE } from './constants'
import { polygonsOverlap } from './math'
import { Piece, PieceSpec, boundsOf, collisionFootprint, topOf } from './pieces'
import { World, piecesNear } from './world'

/**
 * Pieces are convex prisms: a footprint polygon swept between a bottom and a
 * top. Two collide when their vertical spans overlap and their (shrunken, see
 * `DECK_INSET`) footprints overlap. Openings in doorways and frames are
 * ignored — nothing can be built inside them anyway.
 */
export function findCollision(world: World, spec: PieceSpec, ignoreId?: string): Piece | null {
  const bounds = boundsOf(spec)
  const top = topOf(spec)
  let footprint: ReturnType<typeof collisionFootprint> | null = null

  for (const other of piecesNear(world, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ)) {
    if (other.id === ignoreId) continue
    if (spec.y >= topOf(other) - VERTICAL_TOLERANCE) continue
    if (top <= other.y + VERTICAL_TOLERANCE) continue

    footprint ??= collisionFootprint(spec)
    if (polygonsOverlap(footprint, collisionFootprint(other))) return other
  }

  return null
}
