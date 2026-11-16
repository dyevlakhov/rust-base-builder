import { CELL } from './constants'
import { Bounds, Piece, boundsOf } from './pieces'

/**
 * Uniform grid over the ground plane that buckets pieces by their horizontal
 * bounds. Every query the engine makes is local — "what is near this socket",
 * "what could this piece collide with" — so this keeps them independent of the
 * size of the base.
 */
export class SpatialHash {
  private readonly cells = new Map<string, string[]>()

  constructor(private readonly cellSize = CELL) {}

  private range(min: number, max: number): [number, number] {
    return [Math.floor(min / this.cellSize), Math.floor(max / this.cellSize)]
  }

  insert(id: string, bounds: Bounds) {
    const [x0, x1] = this.range(bounds.minX, bounds.maxX)
    const [z0, z1] = this.range(bounds.minZ, bounds.maxZ)
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const key = `${x},${z}`
        const bucket = this.cells.get(key)
        if (bucket) bucket.push(id)
        else this.cells.set(key, [id])
      }
    }
  }

  query(minX: number, maxX: number, minZ: number, maxZ: number): Set<string> {
    const found = new Set<string>()
    const [x0, x1] = this.range(minX, maxX)
    const [z0, z1] = this.range(minZ, maxZ)
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const bucket = this.cells.get(`${x},${z}`)
        if (bucket) for (const id of bucket) found.add(id)
      }
    }
    return found
  }
}

/**
 * An immutable snapshot of the base. Changes go through `applyPatch`, which
 * returns a new world; the old one stays valid, so derived data can be cached
 * per world object and history is just a list of patches.
 */
export interface World {
  readonly pieces: ReadonlyMap<string, Piece>
  readonly hash: SpatialHash
}

export function createWorld(pieces: Iterable<Piece> = []): World {
  const map = new Map<string, Piece>()
  const hash = new SpatialHash()
  for (const piece of pieces) {
    map.set(piece.id, piece)
    hash.insert(piece.id, boundsOf(piece))
  }
  return { pieces: map, hash }
}

export const EMPTY_WORLD = createWorld()

/** Pieces whose horizontal bounds come within `margin` of the given box. */
export function piecesNear(
  world: World,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  margin = 0
): Piece[] {
  const result: Piece[] = []
  for (const id of world.hash.query(minX - margin, maxX + margin, minZ - margin, maxZ + margin)) {
    const piece = world.pieces.get(id)
    if (piece) result.push(piece)
  }
  return result
}

// ---------------------------------------------------------------------------
// Patches
// ---------------------------------------------------------------------------

/** A reversible change: pieces taken out, then pieces put in. */
export interface Patch {
  readonly remove: readonly Piece[]
  readonly add: readonly Piece[]
}

export function applyPatch(world: World, patch: Patch): World {
  const next = new Map(world.pieces)
  for (const piece of patch.remove) next.delete(piece.id)
  for (const piece of patch.add) next.set(piece.id, piece)
  return createWorld(next.values())
}

export function invertPatch(patch: Patch): Patch {
  return { remove: patch.add, add: patch.remove }
}

export function isEmptyPatch(patch: Patch): boolean {
  return patch.add.length === 0 && patch.remove.length === 0
}
