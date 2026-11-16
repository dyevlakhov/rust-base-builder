import { FLOOR_THICKNESS, FOUNDATION_HEIGHT, STOREY } from './constants'

export type PieceType =
  | 'foundation'
  | 'foundation-triangle'
  | 'floor'
  | 'floor-triangle'
  | 'floor-frame'
  | 'floor-triangle-frame'
  | 'wall'
  | 'wall-half'
  | 'wall-low'
  | 'doorway'
  | 'window'
  | 'wall-frame'

/**
 * How a piece takes part in building.
 *
 * - foundation: rests on the ground, carries walls, extends sideways into more
 *   foundations
 * - floor: rests on walls, carries walls, extends sideways into more floors
 * - wall: stands on an edge of a foundation, a floor or another wall
 */
export type PieceKind = 'foundation' | 'floor' | 'wall'

export type PieceShape = 'square' | 'triangle' | 'wall'

/** The cut-out a piece's mesh has. The engine treats every piece as solid. */
export type PieceOpening = 'none' | 'door' | 'window' | 'wall-frame' | 'floor-frame'

export type Tier = 'twig' | 'wood' | 'stone' | 'metal' | 'armored'

export interface PieceDef {
  type: PieceType
  kind: PieceKind
  shape: PieceShape
  label: string
  description: string
  height: number
  /**
   * What a wall can carry on its top edge. A full wall takes another wall or a
   * floor; a half wall takes a floor (a mid-height ceiling); a low wall nothing.
   */
  carries: readonly ('wall' | 'floor')[]
  opening: PieceOpening
  /** Share of a full square piece's build cost. */
  costFactor: number
}

const deck = (
  type: PieceType,
  kind: 'foundation' | 'floor',
  shape: 'square' | 'triangle',
  label: string,
  description: string,
  opening: PieceOpening = 'none'
): PieceDef => ({
  type,
  kind,
  shape,
  label,
  description,
  height: kind === 'foundation' ? FOUNDATION_HEIGHT : FLOOR_THICKNESS,
  carries: [],
  opening,
  costFactor: shape === 'triangle' ? 0.5 : 1,
})

const wall = (
  type: PieceType,
  label: string,
  description: string,
  height: number,
  opening: PieceOpening,
  costFactor: number
): PieceDef => ({
  type,
  kind: 'wall',
  shape: 'wall',
  label,
  description,
  height,
  carries: height === STOREY ? ['wall', 'floor'] : height === STOREY / 2 ? ['floor'] : [],
  opening,
  costFactor,
})

export const PIECES: Readonly<Record<PieceType, PieceDef>> = {
  foundation: deck('foundation', 'foundation', 'square', 'Foundation', 'Square 3×3 m base'),
  'foundation-triangle': deck(
    'foundation-triangle',
    'foundation',
    'triangle',
    'Triangle Foundation',
    'Equilateral, 3 m sides — chains with squares and other triangles'
  ),
  floor: deck('floor', 'floor', 'square', 'Floor', 'Rests on walls'),
  'floor-triangle': deck('floor-triangle', 'floor', 'triangle', 'Triangle Floor', 'Rests on walls'),
  'floor-frame': deck(
    'floor-frame',
    'floor',
    'square',
    'Floor Frame',
    'Open floor, takes a hatch or grill',
    'floor-frame'
  ),
  'floor-triangle-frame': deck(
    'floor-triangle-frame',
    'floor',
    'triangle',
    'Triangle Floor Frame',
    'Open triangle floor',
    'floor-frame'
  ),
  wall: wall('wall', 'Wall', 'Full storey wall', STOREY, 'none', 1),
  'wall-half': wall('wall-half', 'Half Wall', 'Half-height wall', STOREY / 2, 'none', 0.5),
  'wall-low': wall('wall-low', 'Low Wall', 'Waist-height wall', 1, 'none', 0.5),
  doorway: wall('doorway', 'Doorway', 'Wall with a door opening', STOREY, 'door', 1),
  window: wall('window', 'Window', 'Wall with a window opening', STOREY, 'window', 1),
  'wall-frame': wall(
    'wall-frame',
    'Wall Frame',
    'Opening for a garage door or double door',
    STOREY,
    'wall-frame',
    1
  ),
}

export const PIECE_ORDER: readonly PieceType[] = [
  'foundation',
  'foundation-triangle',
  'wall',
  'doorway',
  'window',
  'wall-frame',
  'wall-half',
  'wall-low',
  'floor',
  'floor-triangle',
  'floor-frame',
  'floor-triangle-frame',
]

export function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PIECES, value)
}

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export interface ResourceCost {
  wood?: number
  stone?: number
  metalFragments?: number
  hqm?: number
}

export interface TierInfo {
  label: string
  /** Hit points of a full piece in this tier. */
  health: number
  /** Build cost of a full square piece. Triangles and short walls pay a share. */
  cost: ResourceCost
}

export const TIERS: readonly Tier[] = ['twig', 'wood', 'stone', 'metal', 'armored']

/** Planning figures in line with the game; checked against the wiki, not datamined. */
export const TIER_INFO: Readonly<Record<Tier, TierInfo>> = {
  twig: { label: 'Twig', health: 10, cost: { wood: 50 } },
  wood: { label: 'Wood', health: 250, cost: { wood: 200 } },
  stone: { label: 'Stone', health: 500, cost: { stone: 300 } },
  metal: { label: 'Sheet Metal', health: 1000, cost: { metalFragments: 200 } },
  armored: { label: 'Armored', health: 2000, cost: { hqm: 25 } },
}

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value)
}

export function nextTier(tier: Tier): Tier | null {
  return TIERS[TIERS.indexOf(tier) + 1] ?? null
}

export function pieceCost(type: PieceType, tier: Tier): ResourceCost {
  const { costFactor } = PIECES[type]
  const cost: ResourceCost = {}
  for (const [resource, amount] of Object.entries(TIER_INFO[tier].cost)) {
    cost[resource as keyof ResourceCost] = Math.ceil(amount * costFactor)
  }
  return cost
}

export function pieceHealth(type: PieceType, tier: Tier): number {
  return TIER_INFO[tier].health
}
