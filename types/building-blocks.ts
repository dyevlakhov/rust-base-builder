import * as THREE from 'three'

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
  category: 'foundation' | 'wall' | 'floor'
  snapToGrid: boolean
}

// Standard Rust building dimensions (in game units)
// 1 Foundation = 3x3 units
// 1 Wall height = 3 units
const FOUNDATION_SIZE = 3
const WALL_HEIGHT = 3
const WALL_THICKNESS = 0.15

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Foundations
  {
    type: 'foundation-square',
    label: 'Square Foundation',
    description: 'Standard 3x3 foundation block',
    defaultSize: [FOUNDATION_SIZE, 0.3, FOUNDATION_SIZE],
    category: 'foundation',
    snapToGrid: true,
  },
  {
    type: 'foundation-triangle',
    label: 'Triangle Foundation',
    description: 'Triangular foundation for corners',
    defaultSize: [FOUNDATION_SIZE / 2, 0.3, FOUNDATION_SIZE / 2], // 1.5x1.5 (half of square)
    category: 'foundation',
    snapToGrid: true,
  },

  // Walls
  {
    type: 'wall-full',
    label: 'Wall',
    description: 'Full height wall',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },
  {
    type: 'wall-half',
    label: 'Half Wall',
    description: 'Half height wall (mid-tier)',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT / 2, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },
  {
    type: 'wall-low',
    label: 'Low Wall',
    description: 'Low wall for protection',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT / 3, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },
  {
    type: 'doorway',
    label: 'Doorway',
    description: 'Wall with door frame',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },
  {
    type: 'window',
    label: 'Window',
    description: 'Wall with window embrasure',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },
  {
    type: 'wall-frame',
    label: 'Wall Frame',
    description: 'Open wall frame (no fill)',
    defaultSize: [FOUNDATION_SIZE, WALL_HEIGHT, WALL_THICKNESS],
    category: 'wall',
    snapToGrid: true,
  },

  // Floors
  {
    type: 'floor-square',
    label: 'Square Floor',
    description: 'Standard square floor',
    defaultSize: [FOUNDATION_SIZE, 0.15, FOUNDATION_SIZE],
    category: 'floor',
    snapToGrid: true,
  },
  {
    type: 'floor-triangle',
    label: 'Triangle Floor',
    description: 'Triangular floor piece',
    defaultSize: [FOUNDATION_SIZE / 2, 0.15, FOUNDATION_SIZE / 2], // 1.5x1.5 (half of square)
    category: 'floor',
    snapToGrid: true,
  },
  {
    type: 'floor-frame',
    label: 'Floor Frame',
    description: 'Floor grate (see-through)',
    defaultSize: [FOUNDATION_SIZE, 0.15, FOUNDATION_SIZE],
    category: 'floor',
    snapToGrid: true,
  },

]

// Rust game building tier properties with realistic materials
// Colors and properties match Rust game visual appearance
export const TIER_PROPERTIES: Record<BuildingTier, {
  label: string
  color: string
  health: number
  cost: string
  roughness: number
  metalness: number
  emissive?: string
  emissiveIntensity?: number
}> = {
  twig: {
    label: 'Twig',
    color: '#A0826D', // Light tan/brown - matches Rust twig color
    health: 10,
    cost: '100 Wood',
    roughness: 0.98, // Very rough, organic material
    metalness: 0.0,
  },
  wood: {
    label: 'Wood',
    color: '#5C4033', // Darker brown - matches Rust wooden planks
    health: 250,
    cost: '300 Wood',
    roughness: 0.88, // Rough wood grain texture
    metalness: 0.0,
  },
  stone: {
    label: 'Stone',
    color: '#6B6B6B', // Medium grey - matches Rust stone/concrete
    health: 500,
    cost: '300 Stone',
    roughness: 0.92, // Very rough, concrete-like
    metalness: 0.0,
  },
  metal: {
    label: 'Sheet Metal',
    color: '#7A8BA8', // Blue-grey - matches Rust sheet metal
    health: 1000,
    cost: '200 Metal Frags + 25 HQM',
    roughness: 0.35, // Smooth metal surface with slight texture
    metalness: 0.88, // Highly metallic, reflective
    emissive: '#5A6B7C', // Subtle blue-grey glow
    emissiveIntensity: 0.12,
  },
  armored: {
    label: 'Armored',
    color: '#2D3E2D', // Dark olive-green - matches Rust HQM armored
    health: 2000,
    cost: '25 HQM + 5 Gears',
    roughness: 0.25, // Very smooth, polished metal
    metalness: 0.92, // Highly metallic, very reflective
    emissive: '#1A2A1A', // Dark green glow
    emissiveIntensity: 0.18,
  },
}
