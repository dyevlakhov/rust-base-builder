// Rust game building block types
export type BlockType =
  | 'foundation-square'
  | 'foundation-triangle'
  | 'wall-full'
  | 'wall-half'
  | 'wall-low'
  | 'doorway'
  | 'window'
  | 'wall-frame'
  | 'floor-square'
  | 'floor-triangle'
  | 'floor-frame'

// Rust game building tiers
export type BuildingTier = 'twig' | 'wood' | 'stone' | 'metal' | 'armored'

export type BlockCategory = 'foundation' | 'wall' | 'floor'

export interface BuildingBlock {
  id: string
  type: BlockType
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  tier: BuildingTier
  health: number
  maxHealth: number
}

export interface BlockTemplate {
  type: BlockType
  label: string
  description: string
  defaultSize: [number, number, number]
  category: BlockCategory
  /** Triangular piece that snaps outwards from an edge of a square piece. */
  isTriangle: boolean
}

/**
 * Canonical Rust building dimensions, in metres. Everything else in the app
 * derives from these — block templates, stacking heights and collision volumes
 * all read the same numbers so they cannot drift apart.
 *
 *   1 square foundation = 3 x 3
 *   1 wall              = 3 high
 *   1 triangle piece    = isosceles triangle whose base spans one 3 m edge and
 *                         whose apex reaches 1.5 m beyond it
 */
export const FOUNDATION_SIZE = 3
export const FOUNDATION_HEIGHT = 0.3
export const WALL_HEIGHT = 3
export const WALL_THICKNESS = 0.15
export const FLOOR_HEIGHT = 0.2
/** How far a triangle piece reaches beyond the edge it is attached to. */
export const TRIANGLE_DEPTH = FOUNDATION_SIZE / 2

/** Top surface of a ground-level foundation. */
export const FOUNDATION_TOP = FOUNDATION_HEIGHT
/** Top surface of a full-height wall standing on a foundation. */
export const WALL_TOP = FOUNDATION_TOP + WALL_HEIGHT

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Foundations
  {
    type: 'foundation-square',
    label: 'Square Foundation',
    description: 'Standard 3x3 foundation block',
    defaultSize: [FOUNDATION_SIZE, FOUNDATION_HEIGHT, FOUNDATION_SIZE],
    category: 'foundation',
    isTriangle: false,
  },
  {
    type: 'foundation-triangle',
    label: 'Triangle Foundation',
    description: 'Triangular foundation, attaches to a square edge',
    defaultSize: [FOUNDATION_SIZE, FOUNDATION_HEIGHT, TRIANGLE_DEPTH],
    category: 'foundation',
    isTriangle: true,
  },

  // Walls
  {
    type: 'wall-full',
    label: 'Wall',
    description: 'Full height wall',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },
  {
    type: 'wall-half',
    label: 'Half Wall',
    description: 'Half height wall (mid-tier)',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT / 2, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },
  {
    type: 'wall-low',
    label: 'Low Wall',
    description: 'Low wall for protection',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT / 3, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },
  {
    type: 'doorway',
    label: 'Doorway',
    description: 'Wall with door frame',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },
  {
    type: 'window',
    label: 'Window',
    description: 'Wall with window embrasure',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },
  {
    type: 'wall-frame',
    label: 'Wall Frame',
    description: 'Open wall frame (no fill)',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    isTriangle: false,
  },

  // Floors
  {
    type: 'floor-square',
    label: 'Square Floor',
    description: 'Standard square floor',
    defaultSize: [FOUNDATION_SIZE, FLOOR_HEIGHT, FOUNDATION_SIZE],
    category: 'floor',
    isTriangle: false,
  },
  {
    type: 'floor-triangle',
    label: 'Triangle Floor',
    description: 'Triangular floor piece',
    defaultSize: [FOUNDATION_SIZE, FLOOR_HEIGHT, TRIANGLE_DEPTH],
    category: 'floor',
    isTriangle: true,
  },
  {
    type: 'floor-frame',
    label: 'Floor Frame',
    description: 'Floor grate (see-through)',
    defaultSize: [FOUNDATION_SIZE, FLOOR_HEIGHT, FOUNDATION_SIZE],
    category: 'floor',
    isTriangle: false,
  },
]

const TEMPLATES_BY_TYPE = new Map<BlockType, BlockTemplate>(
  BLOCK_TEMPLATES.map((template) => [template.type, template])
)

export function getBlockTemplate(type: BlockType): BlockTemplate {
  const template = TEMPLATES_BY_TYPE.get(type)
  if (!template) throw new Error(`Unknown block type: ${type}`)
  return template
}

export function getBlockCategory(type: BlockType): BlockCategory {
  return getBlockTemplate(type).category
}

export interface ResourceCost {
  wood?: number
  stone?: number
  metalFragments?: number
  hqm?: number
  gears?: number
}

export interface TierProperties {
  label: string
  color: string
  health: number
  cost: ResourceCost
  roughness: number
  metalness: number
  emissive?: string
  emissiveIntensity?: number
}

// Colors approximate each Rust tier. They are albedo values, read through sRGB
// decoding, so they sit lighter than the colours you would pick for flat UI fills.
// Costs are per building piece and are an approximation for planning purposes.
export const TIER_PROPERTIES: Record<BuildingTier, TierProperties> = {
  twig: {
    label: 'Twig',
    color: '#C4A484', // Light tan, bundled sticks
    health: 10,
    cost: { wood: 100 },
    roughness: 0.98,
    metalness: 0.0,
  },
  wood: {
    label: 'Wood',
    color: '#8A6244', // Mid brown, wooden planks
    health: 250,
    cost: { wood: 300 },
    roughness: 0.88,
    metalness: 0.0,
  },
  stone: {
    label: 'Stone',
    color: '#8E8B85', // Grey stone / concrete
    health: 500,
    cost: { stone: 300 },
    roughness: 0.92,
    metalness: 0.0,
  },
  metal: {
    label: 'Sheet Metal',
    color: '#9FB2CC', // Blue-grey sheet metal
    health: 1000,
    cost: { metalFragments: 200, hqm: 25 },
    // Fully metallic surfaces have no diffuse term at all: with only a modest
    // environment to reflect they read as black. Kept part-metal so the tier
    // stays legible as a colour while still catching a highlight.
    roughness: 0.42,
    metalness: 0.55,
  },
  armored: {
    label: 'Armored',
    color: '#6E8A6E', // Olive-green HQM plate
    health: 2000,
    cost: { hqm: 25, gears: 5 },
    roughness: 0.34,
    metalness: 0.6,
  },
}

export const TIER_ORDER: BuildingTier[] = ['twig', 'wood', 'stone', 'metal', 'armored']
