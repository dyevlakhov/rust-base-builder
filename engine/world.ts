import { CELL } from './constants'
import { Bounds, Piece, boundsOf } from './pieces'

/** Cell indices stay well inside this range for any base that fits on screen. */
const KEY_SPAN = 1 << 20
const KEY_OFFSET = KEY_SPAN >> 1

function cellKey(ix: number, iz: number): number {
  return (ix + KEY_OFFSET) * KEY_SPAN + (iz + KEY_OFFSET)
}

/**
 * Uniform grid over the ground plane that buckets pieces by their horizontal
 * bounds. Every query the engine makes is local — "what is near this socket",
 * "what could this piece collide with", "what does this ray pass over" — so
 * this keeps them independent of the size of the base.
 */
export class SpatialHash {
  private readonly cells = new Map<number, string[]>()

  constructor(readonly cellSize = CELL) {}

  cellOf(value: number): number {
    return Math.floor(value / this.cellSize)
  }

  insert(id: string, bounds: Bounds) {
    const x0 = this.cellOf(bounds.minX)
    const x1 = this.cellOf(bounds.maxX)
    const z0 = this.cellOf(bounds.minZ)
    const z1 = this.cellOf(bounds.maxZ)
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const key = cellKey(x, z)
        const bucket = this.cells.get(key)
        if (bucket) bucket.push(id)
        else this.cells.set(key, [id])
      }
    }
  }

  /** Ids in one cell. The array is shared: do not modify it. */
  cell(ix: number, iz: number): readonly string[] | undefined {
    return this.cells.get(cellKey(ix, iz))
  }

  query(minX: number, maxX: number, minZ: number, maxZ: number): Set<string> {
    const found = new Set<string>()
    const x0 = this.cellOf(minX)
    const x1 = this.cellOf(maxX)
    const z0 = this.cellOf(minZ)
    const z1 = this.cellOf(maxZ)
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const bucket = this.cells.get(cellKey(x, z))
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

const origins = new WeakMap<World, { parent: World; patch: Patch }>()

/**
 * The world and patch a world was made from, if it came from `applyPatch`.
 * Lets derived data be updated from the parent's instead of recomputed.
 */
export function originOf(world: World): { parent: World; patch: Patch } | undefined {
  return origins.get(world)
}

export function applyPatch(world: World, patch: Patch): World {
  const next = new Map(world.pieces)
  for (const piece of patch.remove) next.delete(piece.id)
  for (const piece of patch.add) next.set(piece.id, piece)
  const result = createWorld(next.values())
  origins.set(result, { parent: world, patch })
  return result
}

export function invertPatch(patch: Patch): Patch {
  return { remove: patch.add, add: patch.remove }
}

export function isEmptyPatch(patch: Patch): boolean {
  return patch.add.length === 0 && patch.remove.length === 0
}
