import { PIECES, Tier } from './catalog'
import { evaluatePlacement } from './placement'
import { Piece, PieceSpec } from './pieces'
import { MIN_STABILITY, computeStability } from './support'
import { Patch, World, applyPatch } from './world'

/**
 * Commands turn an intent into a `Patch`, or `null` when the intent is not
 * allowed. They are the only way the base changes, so every rule is enforced
 * here regardless of which part of the UI asked.
 */

let counter = 0

/** Unique across reloads and `clear`, because it carries a timestamp. */
export function newPieceId(): string {
  counter += 1
  return `p${Date.now().toString(36)}${counter.toString(36)}`
}

export function placeCommand(world: World, spec: PieceSpec): Patch | null {
  if (!evaluatePlacement(world, spec).valid) return null
  return { remove: [], add: [{ ...spec, id: newPieceId() }] }
}

/**
 * Remove a piece together with everything that only it was holding up — the
 * same collapse Rust performs. Pieces that were already unstable before (from
 * an old save, say) are left alone rather than swept up with it.
 */
export function removeCommand(world: World, id: string): Patch | null {
  const target = world.pieces.get(id)
  if (!target) return null

  const before = computeStability(world)
  const after = computeStability(applyPatch(world, { remove: [target], add: [] }))

  const collapsed: Piece[] = []
  for (const piece of world.pieces.values()) {
    if (piece.id === id || PIECES[piece.type].kind === 'foundation') continue
    const was = before.get(piece.id) ?? 0
    const now = after.get(piece.id) ?? 0
    if (was >= MIN_STABILITY && now < MIN_STABILITY) collapsed.push(piece)
  }

  return { remove: [target, ...collapsed], add: [] }
}

export function setTierCommand(world: World, ids: readonly string[], tier: Tier): Patch | null {
  const remove: Piece[] = []
  const add: Piece[] = []
  for (const id of ids) {
    const piece = world.pieces.get(id)
    if (!piece || piece.tier === tier) continue
    remove.push(piece)
    add.push({ ...piece, tier })
  }
  return add.length > 0 ? { remove, add } : null
}

export function clearCommand(world: World): Patch | null {
  return world.pieces.size > 0 ? { remove: [...world.pieces.values()], add: [] } : null
}

/** Replace the whole base, e.g. when importing a file. */
export function replaceCommand(world: World, pieces: readonly Piece[]): Patch {
  return { remove: [...world.pieces.values()], add: pieces }
}
