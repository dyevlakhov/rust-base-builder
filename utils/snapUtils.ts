import { BlockType, BuildingBlock, getBlockTemplate } from '@/types/building-blocks'

/**
 * The four edges of a square piece, in a fixed order, with the outward normal
 * and the Y rotation that points the triangle prism's apex along that normal.
 *
 * The prism from `utils/geometry` has its apex towards +Z when unrotated, so
 * the south edge is the zero-rotation case.
 */
export const SQUARE_EDGES: readonly {
  name: 'north' | 'east' | 'south' | 'west'
  normal: readonly [number, number]
  rotation: number
}[] = [
  { name: 'north', normal: [0, -1], rotation: Math.PI },
  { name: 'east', normal: [1, 0], rotation: Math.PI / 2 },
  { name: 'south', normal: [0, 1], rotation: 0 },
  { name: 'west', normal: [-1, 0], rotation: -Math.PI / 2 },
]

/**
 * Distance from the centre of a square piece to the centroid of a triangle
 * attached to one of its edges: half a cell out to the edge, plus a third of
 * the triangle's depth to reach its centroid.
 */
export function triangleAttachDistance(gridSize: number): number {
  const depth = gridSize / 2
  return gridSize / 2 + depth / 3
}

export interface TriangleAttachment {
  /** Centre of the square the triangle hangs off. */
  square: [number, number]
  /** Index into `SQUARE_EDGES`. */
  edge: number
  /** Where the triangle's own centroid lands. */
  centroid: [number, number]
  rotation: number
  /** Centre of the grid cell the triangle reaches into. */
  targetCell: [number, number]
}

/** Centre of the grid cell containing (x, z). Cells are centred on gridSize/2. */
export function snapToCellCentre(x: number, z: number, gridSize: number): [number, number] {
  const half = gridSize / 2
  return [
    Math.round((x - half) / gridSize) * gridSize + half,
    Math.round((z - half) / gridSize) * gridSize + half,
  ]
}

/**
 * Square piece a triangle should attach to: the nearest square of the matching
 * category at roughly the same height, or `null` if there is nothing in range.
 */
export function findAttachmentSquare(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType,
  searchRadius = 6
): BuildingBlock | null {
  const { category } = getBlockTemplate(blockType)
  const targetType = category === 'foundation' ? 'foundation-square' : 'floor-square'

  let nearest: BuildingBlock | null = null
  let nearestDist = Infinity

  for (const block of blocks) {
    if (block.type !== targetType) continue

    // Foundations always sit on the ground; floors have to match the level the
    // cursor is currently resolving to.
    const heightMatches =
      category === 'foundation'
        ? Math.abs(block.position[1] - block.scale[1] / 2) < 0.6
        : Math.abs(block.position[1] - position[1]) < 0.6
    if (!heightMatches) continue

    const dist = (block.position[0] - position[0]) ** 2 + (block.position[2] - position[2]) ** 2
    if (dist <= searchRadius ** 2 && dist < nearestDist) {
      nearestDist = dist
      nearest = block
    }
  }

  return nearest
}

/**
 * Work out where a triangle piece attaches, given where the cursor is.
 *
 * Snapping, auto-rotation and collision all go through this one function, so a
 * preview can never disagree with the piece that actually gets placed.
 */
export function resolveTriangleAttachment(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType,
  gridSize: number
): TriangleAttachment {
  const attached = findAttachmentSquare(blocks, position, blockType)
  const square: [number, number] = attached
    ? [attached.position[0], attached.position[2]]
    : snapToCellCentre(position[0], position[2], gridSize)

  const distance = triangleAttachDistance(gridSize)

  let edge = 0
  let bestDist = Infinity
  for (let i = 0; i < SQUARE_EDGES.length; i++) {
    const [nx, nz] = SQUARE_EDGES[i].normal
    const cx = square[0] + nx * distance
    const cz = square[1] + nz * distance
    const dist = (cx - position[0]) ** 2 + (cz - position[2]) ** 2
    if (dist < bestDist) {
      bestDist = dist
      edge = i
    }
  }

  const [nx, nz] = SQUARE_EDGES[edge].normal
  return {
    square,
    edge,
    centroid: [square[0] + nx * distance, square[1] + nz * distance],
    rotation: SQUARE_EDGES[edge].rotation,
    targetCell: [square[0] + nx * gridSize, square[1] + nz * gridSize],
  }
}

/**
 * Snap a world position onto the building grid.
 *
 * Only X and Z are snapped — Y is owned by `calculateYPosition`, which stacks
 * pieces on whatever is underneath them.
 *
 *   - foundations and floors snap to cell centres
 *   - walls snap to the nearest cell edge
 *   - triangles snap outwards from an edge of the square they attach to
 */
export function snapPosition(
  position: [number, number, number],
  blockType: BlockType | undefined,
  snapToGrid: boolean,
  gridSize: number,
  blocks: BuildingBlock[]
): [number, number, number] {
  if (!snapToGrid || !blockType) return position

  const template = getBlockTemplate(blockType)

  if (template.isTriangle) {
    const { centroid } = resolveTriangleAttachment(blocks, position, blockType, gridSize)
    return [centroid[0], position[1], centroid[1]]
  }

  if (template.category === 'wall') {
    return snapToNearestEdge(position, gridSize)
  }

  const [x, z] = snapToCellCentre(position[0], position[2], gridSize)
  return [x, position[1], z]
}

/** Snap onto the closest of the four edges of the grid cell containing the point. */
function snapToNearestEdge(
  position: [number, number, number],
  gridSize: number
): [number, number, number] {
  const xInCell = ((position[0] % gridSize) + gridSize) % gridSize
  const zInCell = ((position[2] % gridSize) + gridSize) % gridSize

  const cellX = position[0] - xInCell
  const cellZ = position[2] - zInCell

  // Each edge midpoint sits in the middle of the cell on the other axis.
  const [centreX, centreZ] = snapToCellCentre(position[0], position[2], gridSize)

  const edges = [
    { dist: xInCell, x: cellX, z: centreZ }, // west
    { dist: gridSize - xInCell, x: cellX + gridSize, z: centreZ }, // east
    { dist: zInCell, x: centreX, z: cellZ }, // north
    { dist: gridSize - zInCell, x: centreX, z: cellZ + gridSize }, // south
  ]

  const closest = edges.reduce((best, edge) => (edge.dist < best.dist ? edge : best))
  return [closest.x, position[1], closest.z]
}

/** True when a wall snapped to `position` runs north-south rather than east-west. */
export function isWallOnNorthSouthEdge(
  position: [number, number, number],
  gridSize: number
): boolean {
  return isOnGridLine(position[0], gridSize) && !isOnGridLine(position[2], gridSize)
}

function isOnGridLine(value: number, gridSize: number): boolean {
  const remainder = ((value % gridSize) + gridSize) % gridSize
  return remainder < 0.01 || gridSize - remainder < 0.01
}
