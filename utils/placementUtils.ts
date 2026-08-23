import {
  BlockCategory,
  BlockType,
  BuildingBlock,
  FOUNDATION_TOP,
  WALL_TOP,
  getBlockTemplate,
} from '@/types/building-blocks'
import {
  isWallOnNorthSouthEdge,
  resolveTriangleAttachment,
  snapPosition,
  snapToCellCentre,
  triangleAttachDistance,
} from './snapUtils'

/** Two pieces are considered to be at the same snap point within this distance. */
const SNAP_EPSILON = 0.1

/** Pieces touching exactly at their faces are allowed; deeper than this is an overlap. */
const STACK_TOLERANCE = 0.05

/** How far below a floor we look for something to rest it on. */
const FLOOR_SUPPORT_RADIUS = 2.2

/** Probe height used to look "down" at the whole scene before a Y is known. */
const PROBE_Y = 1000

export function getBlockHeight(type: BlockType): number {
  return getBlockTemplate(type).defaultSize[1]
}

export function getCategory(type: BlockType): BlockCategory {
  return getBlockTemplate(type).category
}

export function isFoundation(type: BlockType): boolean {
  return getCategory(type) === 'foundation'
}

export function isWall(type: BlockType): boolean {
  return getCategory(type) === 'wall'
}

export function isFloor(type: BlockType): boolean {
  return getCategory(type) === 'floor'
}

export function isTriangle(type: BlockType): boolean {
  return getBlockTemplate(type).isTriangle
}

/** Resting height for a piece with nothing underneath it. */
export function getDefaultY(type: BlockType): number {
  const height = getBlockHeight(type)

  switch (getCategory(type)) {
    case 'foundation':
      return height / 2
    case 'wall':
      return FOUNDATION_TOP + height / 2
    case 'floor':
      return WALL_TOP + height / 2
  }
}

// ---------------------------------------------------------------------------
// Occupancy
//
// Rather than comparing every pair of blocks with ad-hoc distance thresholds,
// each piece claims one or more named horizontal slots. Two pieces collide when
// they claim the same slot and their vertical spans actually overlap. This keeps
// the rules in one place and makes them straightforward to unit test.
// ---------------------------------------------------------------------------

export interface Occupancy {
  key: string
  bottom: number
  top: number
}

function slotKey(prefix: string, x: number, z: number): string {
  // Quantise so floating point noise from the snap maths cannot split a slot.
  // The `+ 0` normalises -0, which would otherwise stringify to a different key.
  const quantise = (value: number) => Math.round(value * 100) / 100 + 0
  return `${prefix}:${quantise(x)},${quantise(z)}`
}

/** Unit vector the triangle's apex points along, derived from its Y rotation. */
export function apexDirection(rotationY: number): [number, number] {
  return [Math.sin(rotationY), Math.cos(rotationY)]
}

/**
 * Slots claimed by a piece at `position` with `rotation`.
 *
 * - square foundations and floors claim their grid cell
 * - triangles claim the whole cell they reach into (a conservative simplification:
 *   two triangles never share a cell, even when they would geometrically fit)
 * - walls claim the cell edge they were snapped to
 */
export function getOccupancy(
  type: BlockType,
  position: [number, number, number],
  rotationY: number,
  gridSize: number
): Occupancy[] {
  const template = getBlockTemplate(type)
  const height = template.defaultSize[1]
  const bottom = position[1] - height / 2
  const top = position[1] + height / 2

  if (template.category === 'wall') {
    return [{ key: slotKey('edge', position[0], position[2]), bottom, top }]
  }

  if (template.isTriangle) {
    const [dx, dz] = apexDirection(rotationY)
    const reach = gridSize - triangleAttachDistance(gridSize)
    const [cellX, cellZ] = snapToCellCentre(
      position[0] + dx * reach,
      position[2] + dz * reach,
      gridSize
    )
    return [{ key: slotKey('cell', cellX, cellZ), bottom, top }]
  }

  const [cellX, cellZ] = snapToCellCentre(position[0], position[2], gridSize)
  return [{ key: slotKey('cell', cellX, cellZ), bottom, top }]
}

function spansOverlap(a: Occupancy, b: Occupancy): boolean {
  return a.bottom < b.top - STACK_TOLERANCE && a.top > b.bottom + STACK_TOLERANCE
}

/** True when the piece can be placed without intersecting anything already there. */
export function canPlace(
  blocks: BuildingBlock[],
  position: [number, number, number],
  rotation: [number, number, number],
  type: BlockType,
  gridSize: number
): boolean {
  const claimed = getOccupancy(type, position, rotation[1], gridSize)

  for (const block of blocks) {
    const existing = getOccupancy(block.type, block.position, block.rotation[1], gridSize)
    for (const a of claimed) {
      for (const b of existing) {
        if (a.key === b.key && spansOverlap(a, b)) return false
      }
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Stacking
// ---------------------------------------------------------------------------

export function findHighestBlockBelow(
  blocks: BuildingBlock[],
  position: [number, number, number],
  type: BlockType
): BuildingBlock | null {
  const radius = isWall(type) ? SNAP_EPSILON : FLOOR_SUPPORT_RADIUS

  let highest: BuildingBlock | null = null
  let highestTop = -Infinity

  for (const block of blocks) {
    if (block.position[1] >= position[1]) continue
    if (Math.abs(block.position[0] - position[0]) > radius) continue
    if (Math.abs(block.position[2] - position[2]) > radius) continue

    const top = block.position[1] + block.scale[1] / 2
    if (top > highestTop) {
      highestTop = top
      highest = block
    }
  }

  return highest
}

/** Y centre for a piece dropped at `position`, resting on whatever is underneath. */
export function calculateYPosition(
  blocks: BuildingBlock[],
  position: [number, number, number],
  type: BlockType
): number {
  if (isFoundation(type)) return getDefaultY(type)

  const below = findHighestBlockBelow(blocks, position, type)
  if (!below) return getDefaultY(type)

  const topOfBelow = below.position[1] + below.scale[1] / 2
  return topOfBelow + getBlockHeight(type) / 2
}

// ---------------------------------------------------------------------------
// Rotation
// ---------------------------------------------------------------------------

/** Auto-orientation for a piece already snapped to `position`. */
export function computeRotation(
  blocks: BuildingBlock[],
  position: [number, number, number],
  type: BlockType,
  gridSize: number
): [number, number, number] {
  const template = getBlockTemplate(type)

  if (template.isTriangle) {
    const { rotation } = resolveTriangleAttachment(blocks, position, type, gridSize)
    return [0, rotation, 0]
  }

  if (template.category === 'wall') {
    return [0, isWallOnNorthSouthEdge(position, gridSize) ? Math.PI / 2 : 0, 0]
  }

  return [0, 0, 0]
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

export interface Placement {
  position: [number, number, number]
  rotation: [number, number, number]
  valid: boolean
}

/**
 * Turn a point on the ground plane into a fully resolved placement.
 *
 * This is the single entry point used by the placement preview, by the click
 * handler that commits a piece, and by the tests — so the ghost the user sees is
 * always exactly the piece they get.
 */
export function resolvePlacement(
  blocks: BuildingBlock[],
  point: { x: number; z: number },
  type: BlockType,
  gridSize: number,
  snapToGrid: boolean
): Placement {
  // Snap once from above to find the horizontal slot, resolve the height there,
  // then snap again now that the level is known (triangles attach per level).
  const coarse = snapPosition([point.x, PROBE_Y, point.z], type, snapToGrid, gridSize, blocks)
  const y = calculateYPosition(blocks, coarse, type)
  const position = snapPosition([point.x, y, point.z], type, snapToGrid, gridSize, blocks)
  const rotation = computeRotation(blocks, position, type, gridSize)

  return { position, rotation, valid: canPlace(blocks, position, rotation, type, gridSize) }
}
