import { PIECES, PieceKind } from './catalog'
import { CELL, EPS } from './constants'
import { distance2, parallel } from './math'
import { Edge, Piece, PieceSpec, deckEdges, topOf } from './pieces'
import { World, piecesNear } from './world'

/**
 * Structural stability, modelled on Rust's.
 *
 * Foundations stand on the ground at 100%. Every other piece takes the best
 * stability among the pieces holding it up, multiplied by a factor for how it
 * is held: resting straight down on something costs little, hanging sideways
 * off a neighbour costs a lot. Pieces below `MIN_STABILITY` cannot be built and
 * fall when what holds them up is removed.
 *
 * The factors are an approximation chosen to reproduce the familiar limits —
 * a floor overhangs a couple of tiles, towers lose stability storey by storey —
 * rather than datamined values.
 */
export const MIN_STABILITY = 0.1

const SUPPORT_FACTOR: Record<PieceKind, Partial<Record<PieceKind, number>>> = {
  // supporter kind → supported kind → factor
  foundation: { wall: 1 },
  floor: { wall: 0.9, floor: 0.5 },
  wall: { wall: 0.9, floor: 1 },
}

export interface Support {
  piece: Piece
  factor: number
}

function sameEdge(a: Edge, b: Edge): boolean {
  return Math.abs(a.y - b.y) < EPS && distance2(a.mid, b.mid) < EPS && parallel(a.normal, b.normal)
}

/** The edge a wall stands on (bottom) or carries (top). */
function wallEdge(wall: PieceSpec, at: 'bottom' | 'top'): Edge {
  return { mid: [wall.x, wall.z], normal: wall.yaw, y: at === 'bottom' ? wall.y : topOf(wall) }
}

/** Edges through which `piece` can be held up. */
function supportedEdges(piece: PieceSpec): Edge[] {
  return PIECES[piece.type].kind === 'wall' ? [wallEdge(piece, 'bottom')] : deckEdges(piece)
}

/** Edges through which `piece` holds up a piece of kind `kind`. */
function supporterEdges(piece: PieceSpec, kind: PieceKind): Edge[] {
  const def = PIECES[piece.type]
  if (def.kind !== 'wall') return deckEdges(piece)
  return kind !== 'foundation' && def.carries.includes(kind) ? [wallEdge(piece, 'top')] : []
}

/** Every piece that holds `spec` up, with the factor it holds it at. */
export function findSupports(world: World, spec: PieceSpec, ignoreId?: string): Support[] {
  const kind = PIECES[spec.type].kind
  if (kind === 'foundation') return []

  const own = supportedEdges(spec)
  const supports: Support[] = []

  for (const piece of piecesNear(world, spec.x, spec.x, spec.z, spec.z, CELL)) {
    if (piece.id === ignoreId) continue
    const factor = SUPPORT_FACTOR[PIECES[piece.type].kind][kind]
    if (factor === undefined) continue

    const theirs = supporterEdges(piece, kind)
    if (own.some((a) => theirs.some((b) => sameEdge(a, b)))) {
      supports.push({ piece, factor })
    }
  }

  return supports
}

const stabilityCache = new WeakMap<World, ReadonlyMap<string, number>>()

/**
 * Stability of every piece, by id. Computed once per world.
 *
 * This is a widest-path search from the foundations: a piece's stability is the
 * best product of factors along any chain of supports reaching the ground.
 * Factors are at most 1, so — as in Dijkstra's algorithm — the piece with the
 * highest tentative stability is always final.
 */
export function computeStability(world: World): ReadonlyMap<string, number> {
  const cached = stabilityCache.get(world)
  if (cached) return cached

  const dependents = new Map<string, Support[]>()
  for (const piece of world.pieces.values()) {
    for (const { piece: supporter, factor } of findSupports(world, piece)) {
      const list = dependents.get(supporter.id)
      const entry = { piece, factor }
      if (list) list.push(entry)
      else dependents.set(supporter.id, [entry])
    }
  }

  const stability = new Map<string, number>()
  const queue = new MaxHeap()
  for (const piece of world.pieces.values()) {
    stability.set(piece.id, 0)
    if (PIECES[piece.type].kind === 'foundation') {
      stability.set(piece.id, 1)
      queue.push(piece.id, 1)
    }
  }

  const done = new Set<string>()
  while (queue.size > 0) {
    const { id, value } = queue.pop()
    if (done.has(id)) continue
    done.add(id)

    for (const { piece, factor } of dependents.get(id) ?? []) {
      const candidate = value * factor
      if (candidate > (stability.get(piece.id) ?? 0) + 1e-12) {
        stability.set(piece.id, candidate)
        queue.push(piece.id, candidate)
      }
    }
  }

  stabilityCache.set(world, stability)
  return stability
}

/** Stability a piece would have if it were added to `world`. */
export function stabilityOf(world: World, spec: PieceSpec, ignoreId?: string): number {
  if (PIECES[spec.type].kind === 'foundation') return 1

  const stability = computeStability(world)
  let best = 0
  for (const { piece, factor } of findSupports(world, spec, ignoreId)) {
    best = Math.max(best, (stability.get(piece.id) ?? 0) * factor)
  }
  return best
}

class MaxHeap {
  private items: { id: string; value: number }[] = []

  get size() {
    return this.items.length
  }

  push(id: string, value: number) {
    const items = this.items
    items.push({ id, value })
    let i = items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (items[parent].value >= items[i].value) break
      ;[items[parent], items[i]] = [items[i], items[parent]]
      i = parent
    }
  }

  pop(): { id: string; value: number } {
    const items = this.items
    const top = items[0]
    const last = items.pop()!
    if (items.length > 0) {
      items[0] = last
      let i = 0
      for (;;) {
        const left = i * 2 + 1
        const right = left + 1
        let largest = i
        if (left < items.length && items[left].value > items[largest].value) largest = left
        if (right < items.length && items[right].value > items[largest].value) largest = right
        if (largest === i) break
        ;[items[largest], items[i]] = [items[i], items[largest]]
        i = largest
      }
    }
    return top
  }
}
