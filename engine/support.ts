import { PIECES, PieceKind } from './catalog'
import { EPS } from './constants'
import { parallel } from './math'
import { Edge, Piece, PieceSpec, deckEdges, topOf } from './pieces'
import { World, originOf } from './world'

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
  if (Math.abs(a.y - b.y) >= EPS) return false
  const dx = a.mid[0] - b.mid[0]
  const dz = a.mid[1] - b.mid[1]
  return dx * dx + dz * dz < EPS * EPS && parallel(a.normal, b.normal)
}

/** Height at which a piece is held up: a wall's bottom, a deck's top. */
function supportLevel(piece: PieceSpec): number {
  return PIECES[piece.type].kind === 'wall' ? piece.y : topOf(piece)
}

function wallEdge(wall: PieceSpec, at: 'bottom' | 'top'): Edge {
  return { mid: [wall.x, wall.z], normal: wall.yaw, y: at === 'bottom' ? wall.y : topOf(wall) }
}

const supportedCache = new WeakMap<PieceSpec, readonly Edge[]>()

/** Edges through which `piece` can be held up. */
function supportedEdges(piece: PieceSpec): readonly Edge[] {
  let edges = supportedCache.get(piece)
  if (!edges) {
    edges = PIECES[piece.type].kind === 'wall' ? [wallEdge(piece, 'bottom')] : deckEdges(piece)
    supportedCache.set(piece, edges)
  }
  return edges
}

const NO_EDGES: readonly Edge[] = []
const wallTopCache = new WeakMap<PieceSpec, readonly Edge[]>()

/** Edges through which `piece` holds up a piece of kind `kind`. */
function supporterEdges(piece: PieceSpec, kind: PieceKind): readonly Edge[] {
  const def = PIECES[piece.type]
  if (def.kind !== 'wall') return deckEdges(piece)
  if (kind === 'foundation' || !def.carries.includes(kind)) return NO_EDGES

  let edges = wallTopCache.get(piece)
  if (!edges) {
    edges = [wallEdge(piece, 'top')]
    wallTopCache.set(piece, edges)
  }
  return edges
}

/** The factor at which `supporter` holds `piece` up, or `undefined` if it does not. */
function supportFactor(supporter: PieceSpec, piece: PieceSpec): number | undefined {
  const kind = PIECES[piece.type].kind
  const factor = SUPPORT_FACTOR[PIECES[supporter.type].kind][kind]
  if (factor === undefined) return undefined
  // Every supporting edge sits at the supporter's top; most neighbours are on
  // another storey and are rejected here without building any edges.
  if (Math.abs(topOf(supporter) - supportLevel(piece)) >= EPS) return undefined

  const theirs = supporterEdges(supporter, kind)
  if (theirs.length === 0) return undefined
  for (const a of supportedEdges(piece)) {
    for (const b of theirs) if (sameEdge(a, b)) return factor
  }
  return undefined
}

/** Every piece that holds `spec` up, with the factor it holds it at. */
export function findSupports(world: World, spec: PieceSpec, ignoreId?: string): Support[] {
  if (PIECES[spec.type].kind === 'foundation') return []

  const supports: Support[] = []
  for (const piece of piecesAtEdges(world, supportedEdges(spec), ignoreId)) {
    const factor = supportFactor(piece, spec)
    if (factor !== undefined) supports.push({ piece, factor })
  }
  return supports
}

/**
 * Pieces whose bounds contain the midpoint of any of `edges`.
 *
 * A supporter and the piece it holds always share an edge, so this is all the
 * candidates there can be — a handful, instead of everything within a cell's
 * reach, which matters when stability is recomputed for thousands of pieces.
 */
function piecesAtEdges(world: World, edges: readonly Edge[], skipId?: string): Piece[] {
  const found: Piece[] = []
  const seen = new Set<string>()
  for (const { mid } of edges) {
    const [x, z] = mid
    for (const id of world.hash.query(x - EPS, x + EPS, z - EPS, z + EPS)) {
      if (id === skipId || seen.has(id)) continue
      seen.add(id)
      const piece = world.pieces.get(id)
      if (piece) found.push(piece)
    }
  }
  return found
}

/** Edges through which `piece` could hold anything up. */
function anySupporterEdges(piece: PieceSpec): readonly Edge[] {
  const def = PIECES[piece.type]
  if (def.kind !== 'wall') return deckEdges(piece)
  return def.carries.length > 0 ? supporterEdges(piece, def.carries[0]) : NO_EDGES
}

/** Every piece that `supporter` holds up. */
function findDependents(world: World, supporter: Piece): Support[] {
  const dependents: Support[] = []
  for (const piece of piecesAtEdges(world, anySupporterEdges(supporter), supporter.id)) {
    const factor = supportFactor(supporter, piece)
    if (factor !== undefined) dependents.push({ piece, factor })
  }
  return dependents
}

// ---------------------------------------------------------------------------
// Support graph
// ---------------------------------------------------------------------------

interface Link {
  id: string
  factor: number
}

/** Who holds whom up, as adjacency lists by piece id. */
interface SupportGraph {
  supports: Map<string, readonly Link[]>
  dependents: Map<string, readonly Link[]>
}

const graphCache = new WeakMap<World, SupportGraph>()
const NO_LINKS: readonly Link[] = []

/**
 * The support graph of a world, built once and then carried along patches:
 * a new world copies its parent's lists and only rediscovers the links of the
 * pieces that were added or removed. Finding links is what costs — it means
 * spatial queries and edge comparisons — while walking a ready graph is cheap,
 * so stability updates never touch the spatial hash for unchanged pieces.
 *
 * Lists are never mutated in place: they may be shared with ancestor worlds.
 */
function supportGraph(world: World): SupportGraph {
  const cached = graphCache.get(world)
  if (cached) return cached

  const origin = originOf(world)
  const parent = origin && graphCache.get(origin.parent)
  let graph: SupportGraph

  if (origin && parent) {
    graph = { supports: new Map(parent.supports), dependents: new Map(parent.dependents) }
    for (const piece of origin.patch.remove) unlink(graph, piece.id)
    link(world, graph, origin.patch.add)
  } else {
    graph = { supports: new Map(), dependents: new Map() }
    const dependents = new Map<string, Link[]>()
    for (const piece of world.pieces.values()) {
      const supports = findSupports(world, piece).map(({ piece: s, factor }) => ({
        id: s.id,
        factor,
      }))
      graph.supports.set(piece.id, supports)
      for (const { id, factor } of supports) {
        const list = dependents.get(id)
        if (list) list.push({ id: piece.id, factor })
        else dependents.set(id, [{ id: piece.id, factor }])
      }
    }
    for (const piece of world.pieces.values()) {
      graph.dependents.set(piece.id, dependents.get(piece.id) ?? NO_LINKS)
    }
  }

  graphCache.set(world, graph)
  return graph
}

function without(list: readonly Link[] | undefined, id: string): readonly Link[] {
  return (list ?? NO_LINKS).filter((link) => link.id !== id)
}

function unlink(graph: SupportGraph, id: string) {
  for (const { id: supporter } of graph.supports.get(id) ?? NO_LINKS) {
    graph.dependents.set(supporter, without(graph.dependents.get(supporter), id))
  }
  for (const { id: dependent } of graph.dependents.get(id) ?? NO_LINKS) {
    graph.supports.set(dependent, without(graph.supports.get(dependent), id))
  }
  graph.supports.delete(id)
  graph.dependents.delete(id)
}

function link(world: World, graph: SupportGraph, added: readonly Piece[]) {
  // Discovery runs against the new world, which already holds every added
  // piece, so each added piece's own lists come out complete — including links
  // between added pieces. Only the lists of pre-existing pieces need the
  // reciprocal entries, and those are appended once.
  const addedIds = new Set(added.map((piece) => piece.id))
  for (const piece of added) {
    const supports = findSupports(world, piece).map(({ piece: s, factor }) => ({
      id: s.id,
      factor,
    }))
    const dependents = findDependents(world, piece).map(({ piece: d, factor }) => ({
      id: d.id,
      factor,
    }))
    graph.supports.set(piece.id, supports)
    graph.dependents.set(piece.id, dependents)

    for (const { id, factor } of supports) {
      if (addedIds.has(id)) continue
      graph.dependents.set(id, [
        ...(graph.dependents.get(id) ?? NO_LINKS),
        { id: piece.id, factor },
      ])
    }
    for (const { id, factor } of dependents) {
      if (addedIds.has(id)) continue
      graph.supports.set(id, [...(graph.supports.get(id) ?? NO_LINKS), { id: piece.id, factor }])
    }
  }
}

// ---------------------------------------------------------------------------
// Stability
// ---------------------------------------------------------------------------

const stabilityCache = new WeakMap<World, ReadonlyMap<string, number>>()

/**
 * Stability of every piece, by id. Computed once per world.
 *
 * This is a widest-path search from the foundations over the support graph: a
 * piece's stability is the best product of factors along any chain of supports
 * reaching the ground. Factors are at most 1, so — as in Dijkstra's algorithm —
 * the piece with the highest tentative stability is always final.
 *
 * Most changes are small, and the world they came from usually has its
 * stability computed already, so this starts from there when it safely can:
 *
 *   - a change that only swaps tiers moves nothing, so nothing changes;
 *   - a change that only adds pieces can only raise stability, so it is enough
 *     to propagate outwards from the new pieces;
 *   - a change that only removes pieces can only lower the stability of what
 *     depended on them, so only those are reset and searched again.
 *
 * Anything else — a load, a mixed patch — takes the full search.
 */
export function computeStability(world: World): ReadonlyMap<string, number> {
  const cached = stabilityCache.get(world)
  if (cached) return cached

  const origin = originOf(world)
  const previous = origin && stabilityCache.get(origin.parent)
  const graph = supportGraph(world)
  let stability: Map<string, number>

  if (previous && origin && isRetier(origin.patch.remove, origin.patch.add)) {
    stability = new Map(previous)
  } else if (previous && origin && origin.patch.remove.length === 0) {
    stability = new Map(previous)
    const queue = new MaxHeap()
    for (const piece of origin.patch.add) stability.set(piece.id, 0)
    for (const piece of origin.patch.add) {
      const value =
        PIECES[piece.type].kind === 'foundation' ? 1 : bestSupport(graph, stability, piece.id)
      if (value > 0) {
        stability.set(piece.id, value)
        queue.push(piece.id, value)
      }
    }
    propagate(graph, stability, queue)
  } else if (previous && origin && origin.patch.add.length === 0) {
    stability = new Map(previous)
    const parentGraph = supportGraph(origin.parent)

    // Everything downstream of a removed piece may have lost its best path.
    const removed = new Set(origin.patch.remove.map((piece) => piece.id))
    const affected = new Set<string>()
    const pending = [...removed]
    while (pending.length > 0) {
      const id = pending.pop()!
      for (const { id: dependent } of parentGraph.dependents.get(id) ?? NO_LINKS) {
        // Neighbouring floors hold each other up, so the walk can lead back
        // to a removed piece; it must not be brought back.
        if (affected.has(dependent) || removed.has(dependent)) continue
        affected.add(dependent)
        pending.push(dependent)
      }
    }
    for (const id of removed) stability.delete(id)

    // Re-seed each affected piece from its supports outside the affected set,
    // whose values are still final, then let the search settle the rest.
    const queue = new MaxHeap()
    for (const id of affected) stability.set(id, 0)
    for (const id of affected) {
      const value = bestSupport(graph, stability, id, affected)
      if (value > 0) {
        stability.set(id, value)
        queue.push(id, value)
      }
    }
    propagate(graph, stability, queue)
  } else {
    stability = new Map()
    const queue = new MaxHeap()
    for (const piece of world.pieces.values()) {
      const grounded = PIECES[piece.type].kind === 'foundation'
      stability.set(piece.id, grounded ? 1 : 0)
      if (grounded) queue.push(piece.id, 1)
    }
    propagate(graph, stability, queue)
  }

  stabilityCache.set(world, stability)
  return stability
}

function bestSupport(
  graph: SupportGraph,
  stability: ReadonlyMap<string, number>,
  id: string,
  exclude?: ReadonlySet<string>
): number {
  let best = 0
  for (const { id: supporter, factor } of graph.supports.get(id) ?? NO_LINKS) {
    if (exclude?.has(supporter)) continue
    best = Math.max(best, (stability.get(supporter) ?? 0) * factor)
  }
  return best
}

/** Push stability outwards from every queued piece to what it holds up. */
function propagate(graph: SupportGraph, stability: Map<string, number>, queue: MaxHeap) {
  while (queue.size > 0) {
    const { id, value } = queue.pop()
    // A piece can be queued again with a higher value; skip the stale entry.
    if (value < (stability.get(id) ?? 0) - 1e-12) continue

    for (const { id: dependent, factor } of graph.dependents.get(id) ?? NO_LINKS) {
      const candidate = value * factor
      if (candidate > (stability.get(dependent) ?? 0) + 1e-12) {
        stability.set(dependent, candidate)
        queue.push(dependent, candidate)
      }
    }
  }
}

/** True when a patch only replaces pieces with the same pieces at another tier. */
function isRetier(removed: readonly Piece[], added: readonly Piece[]): boolean {
  if (removed.length !== added.length || removed.length === 0) return false
  const byId = new Map(removed.map((piece) => [piece.id, piece]))
  return added.every((piece) => {
    const old = byId.get(piece.id)
    return (
      old !== undefined &&
      old.type === piece.type &&
      old.x === piece.x &&
      old.y === piece.y &&
      old.z === piece.z &&
      old.yaw === piece.yaw
    )
  })
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
