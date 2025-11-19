import { BuildingBlock, BlockType } from '@/types/building-blocks'

// Block height constants
export const BLOCK_HEIGHTS = {
  foundation: 0.3,
  wallFull: 3.0,
  wallHalf: 1.5,
  wallLow: 1.0,
  floor: 0.2,
} as const

// Default Y positions
export const DEFAULT_Y_POSITIONS = {
  foundation: 0.15,
  wallFull: 1.8, // 0.3 (foundation) + 1.5 (half wall height)
  wallHalf: 1.05, // 0.3 + 0.75
  wallLow: 0.8, // 0.3 + 0.5
  floor: 3.4, // On top of walls
} as const

export function getBlockHeight(blockType: BlockType): number {
  if (blockType === 'wall-half') return BLOCK_HEIGHTS.wallHalf
  if (blockType === 'wall-low') return BLOCK_HEIGHTS.wallLow
  if (blockType.includes('wall') || blockType.includes('doorway') || blockType.includes('window') || blockType.includes('frame')) {
    return BLOCK_HEIGHTS.wallFull
  }
  if (blockType.includes('floor')) return BLOCK_HEIGHTS.floor
  return BLOCK_HEIGHTS.foundation
}

export function getDefaultY(blockType: BlockType): number {
  if (blockType === 'wall-half') return DEFAULT_Y_POSITIONS.wallHalf
  if (blockType === 'wall-low') return DEFAULT_Y_POSITIONS.wallLow
  if (blockType.includes('wall') || blockType.includes('doorway') || blockType.includes('window') || blockType.includes('frame')) {
    return DEFAULT_Y_POSITIONS.wallFull
  }
  if (blockType.includes('floor')) return DEFAULT_Y_POSITIONS.floor
  return DEFAULT_Y_POSITIONS.foundation
}

export function isFoundation(blockType: BlockType): boolean {
  return blockType.includes('foundation')
}

export function isWall(blockType: BlockType): boolean {
  return blockType.includes('wall') || blockType.includes('doorway') || blockType.includes('window') || blockType.includes('frame')
}

export function isFloor(blockType: BlockType): boolean {
  return blockType.includes('floor')
}

export function isTriangle(blockType: BlockType): boolean {
  return blockType.includes('triangle')
}

// Collision detection helpers
export function checkFoundationOverlap(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType
): boolean {
  const isPlacingSquare = blockType.includes('square')
  const overlapThreshold = isTriangle(blockType) ? 0.8 : 0.1

  const overlappingFoundations = blocks.filter(block => {
    if (!isFoundation(block.type)) return false
    
    const xDist = Math.abs(block.position[0] - position[0])
    const zDist = Math.abs(block.position[2] - position[2])
    const isAtSameXZ = xDist < overlapThreshold && zDist < overlapThreshold
    const isAtFoundationHeight = Math.abs(block.position[1] - 0.15) < 0.2
    
    return isAtSameXZ && isAtFoundationHeight
  })

  return overlappingFoundations.length > 0
}

export function checkBlockOverlap(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType,
  blockHeight: number
): boolean {
  const isWallType = isWall(blockType)
  const isFloorType = isFloor(blockType)
  
  const overlappingBlocks = blocks.filter(block => {
    // Skip foundations for non-foundation blocks
    if (isFoundation(block.type) && !isFoundation(blockType)) return false
    
    const xDist = Math.abs(block.position[0] - position[0])
    const zDist = Math.abs(block.position[2] - position[2])
    
    // Wall collision detection
    if (isWallType) {
      const isBlockWall = isWall(block.type)
      if (isBlockWall) {
        // Walls: check if at same edge position AND overlapping vertically
        const sameX = xDist < 0.1
        const sameZ = zDist < 0.1
        
        if (!sameX || !sameZ) return false // Not at same edge position
        
        // Check vertical overlap - walls can stack, so only block if they overlap in Y space
        // Allow exact stacking (touching at edges) but prevent actual overlap
        const blockBottom = block.position[1] - block.scale[1] / 2
        const blockTop = block.position[1] + block.scale[1] / 2
        const newBlockBottom = position[1] - blockHeight / 2
        const newBlockTop = position[1] + blockHeight / 2
        
        // Small tolerance for floating point precision (0.05 units = 5cm)
        const tolerance = 0.05
        
        // Overlap if blocks actually overlap (not just touching)
        // Allow stacking when walls touch exactly at edges (within tolerance)
        // Block only if there's actual penetration/overlap
        // Check: new block overlaps if its bottom is below existing top AND its top is above existing bottom
        // But allow exact touching (within tolerance)
        const overlapsBottom = newBlockBottom < blockTop - tolerance
        const overlapsTop = newBlockTop > blockBottom + tolerance
        const verticalOverlap = overlapsBottom && overlapsTop
        return verticalOverlap
      }
      // Wall vs non-wall: standard collision
      const isAtSameXZ = xDist < 0.5 && zDist < 0.5
      const blockBottom = block.position[1] - block.scale[1] / 2
      const blockTop = block.position[1] + block.scale[1] / 2
      const newBlockBottom = position[1] - blockHeight / 2
      const newBlockTop = position[1] + blockHeight / 2
      return isAtSameXZ && (newBlockBottom <= blockTop && newBlockTop >= blockBottom)
    }
    
    // Floor collision detection
    if (isFloorType) {
      const isBlockFloor = isFloor(block.type)
      if (isBlockFloor) {
        // Floors: same grid center
        return xDist < 0.1 && zDist < 0.1
      }
      // Floors don't collide with walls
      if (isWall(block.type)) return false
      // Standard collision for other blocks
      const isAtSameXZ = xDist < 1.6 && zDist < 1.6
      const blockBottom = block.position[1] - block.scale[1] / 2
      const blockTop = block.position[1] + block.scale[1] / 2
      const newBlockBottom = position[1] - blockHeight / 2
      const newBlockTop = position[1] + blockHeight / 2
      return isAtSameXZ && (newBlockBottom <= blockTop && newBlockTop >= blockBottom)
    }
    
    // Default collision detection
    const isAtSameXZ = xDist < 1.6 && zDist < 1.6
    const blockBottom = block.position[1] - block.scale[1] / 2
    const blockTop = block.position[1] + block.scale[1] / 2
    const newBlockBottom = position[1] - blockHeight / 2
    const newBlockTop = position[1] + blockHeight / 2
    return isAtSameXZ && (newBlockBottom <= blockTop && newBlockTop >= blockBottom)
  })

  return overlappingBlocks.length > 0
}

export function findHighestBlockBelow(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType,
  gridSize: number
): BuildingBlock | null {
  const isWallType = isWall(blockType)
  const isFloorType = isFloor(blockType)
  const threshold = isFloorType ? 2.2 : (isWallType ? 0.1 : 1.6)

  const blocksBelow = blocks.filter(block => {
    const xDist = Math.abs(block.position[0] - position[0])
    const zDist = Math.abs(block.position[2] - position[2])
    
    if (isWallType) {
      // Walls: exact edge position only
      return xDist < 0.1 && zDist < 0.1 && block.position[1] < position[1]
    }
    
    // Floors and others: wider threshold
    return xDist <= threshold && zDist <= threshold && block.position[1] < position[1]
  })

  if (blocksBelow.length === 0) return null

  return blocksBelow.reduce((highest, block) => {
    const blockTop = block.position[1] + block.scale[1] / 2
    const highestTop = highest.position[1] + highest.scale[1] / 2
    return blockTop > highestTop ? block : highest
  })
}

export function calculateYPosition(
  blocks: BuildingBlock[],
  position: [number, number, number],
  blockType: BlockType,
  gridSize: number,
  snappedPosition?: [number, number, number]
): number {
  const blockHeight = getBlockHeight(blockType)
  const defaultY = getDefaultY(blockType)
  
  if (isFoundation(blockType)) {
    return DEFAULT_Y_POSITIONS.foundation
  }

  // Use snapped position if provided (for walls, this ensures we check the exact edge position)
  const checkPosition = snappedPosition || position
  const highestBelow = findHighestBlockBelow(blocks, checkPosition, blockType, gridSize)
  
  if (highestBelow) {
    const topOfBlockBelow = highestBelow.position[1] + highestBelow.scale[1] / 2
    return topOfBlockBelow + blockHeight / 2
  }

  return defaultY
}

