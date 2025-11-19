import { BuildingBlock, BlockType } from '@/types/building-blocks'

export function snapPosition(
  position: [number, number, number],
  blockType: BlockType | undefined,
  snapToGrid: boolean,
  gridSize: number,
  blocks: BuildingBlock[]
): [number, number, number] {
  if (!snapToGrid) return position
  
  const halfGrid = gridSize / 2
  
  // Y axis is NEVER snapped to grid - only X and Z snap
  // Y is determined by block type (foundation, wall, floor heights)
  
  // Special handling for triangle pieces
  if (blockType && blockType.includes('triangle')) {
    const isFoundation = blockType.includes('foundation')
    const targetTypes = isFoundation ? ['foundation-square'] : ['floor-square']
    const checkY = isFoundation ? 0.15 : position[1]
    const searchRadius = 6.0
    
    const nearbySquares = blocks.filter(block => {
      if (!targetTypes.includes(block.type)) return false
      const heightMatch = Math.abs(block.position[1] - checkY) < 0.6
      const horizontalDist = Math.sqrt(
        Math.pow(block.position[0] - position[0], 2) +
        Math.pow(block.position[2] - position[2], 2)
      )
      return heightMatch && horizontalDist <= searchRadius
    })
    
    if (nearbySquares.length > 0) {
      let minDist = Infinity
      let nearestSquare = nearbySquares[0]
      
      for (const square of nearbySquares) {
        const dist = Math.sqrt(
          Math.pow(square.position[0] - position[0], 2) +
          Math.pow(square.position[2] - position[2], 2)
        )
        if (dist < minDist) {
          minDist = dist
          nearestSquare = square
        }
      }
      
      const squareX = nearestSquare.position[0]
      const squareZ = nearestSquare.position[2]
      const triangleCentroidOffset = (gridSize / 2) / 3
      
      const corners = [
        [squareX - halfGrid, squareZ - halfGrid],
        [squareX + halfGrid, squareZ - halfGrid],
        [squareX - halfGrid, squareZ + halfGrid],
        [squareX + halfGrid, squareZ + halfGrid],
      ]
      
      const triangleCenters = [
        [corners[0][0] + triangleCentroidOffset, corners[0][1] + triangleCentroidOffset],
        [corners[1][0] - triangleCentroidOffset, corners[1][1] + triangleCentroidOffset],
        [corners[2][0] + triangleCentroidOffset, corners[2][1] - triangleCentroidOffset],
        [corners[3][0] - triangleCentroidOffset, corners[3][1] - triangleCentroidOffset],
      ]
      
      let closestCenter = triangleCenters[0]
      let minCenterDist = Infinity
      
      for (let i = 0; i < triangleCenters.length; i++) {
        const dist = Math.sqrt(
          Math.pow(triangleCenters[i][0] - position[0], 2) +
          Math.pow(triangleCenters[i][1] - position[2], 2)
        )
        if (dist < minCenterDist) {
          minCenterDist = dist
          closestCenter = triangleCenters[i]
        }
      }
      
      return [
        closestCenter[0],
        isFoundation ? checkY : position[1],
        closestCenter[1],
      ] as [number, number, number]
    }
    
    // No nearby square, snap to nearest grid corner
    const triangleCentroidOffset = (gridSize / 2) / 3
    const cornerX = Math.round(position[0] / gridSize) * gridSize
    const cornerZ = Math.round(position[2] / gridSize) * gridSize
    const xInCell = position[0] - cornerX
    const zInCell = position[2] - cornerZ
    
    let offsetX = xInCell < 0 ? triangleCentroidOffset : -triangleCentroidOffset
    let offsetZ = zInCell < 0 ? triangleCentroidOffset : -triangleCentroidOffset
    
    return [
      cornerX + offsetX,
      position[1],
      cornerZ + offsetZ,
    ] as [number, number, number]
  }
  
  // Special handling for walls
  if (blockType && (blockType.includes('wall') || blockType.includes('doorway') || blockType.includes('window') || blockType.includes('frame'))) {
    const xInCell = ((position[0] % gridSize) + gridSize) % gridSize
    const zInCell = ((position[2] % gridSize) + gridSize) % gridSize
    
    const distToLeftEdge = xInCell
    const distToRightEdge = gridSize - xInCell
    const distToTopEdge = zInCell
    const distToBottomEdge = gridSize - zInCell
    
    const gridCellX = Math.floor(position[0] / gridSize)
    const gridCellZ = Math.floor(position[2] / gridSize)
    
    const leftEdgeX = gridCellX * gridSize
    const rightEdgeX = (gridCellX + 1) * gridSize
    const topEdgeZ = gridCellZ * gridSize
    const bottomEdgeZ = (gridCellZ + 1) * gridSize
    
    const edgeDistances = [
      { dist: distToLeftEdge, x: leftEdgeX, z: Math.round((position[2] - halfGrid) / gridSize) * gridSize + halfGrid },
      { dist: distToRightEdge, x: rightEdgeX, z: Math.round((position[2] - halfGrid) / gridSize) * gridSize + halfGrid },
      { dist: distToTopEdge, x: Math.round((position[0] - halfGrid) / gridSize) * gridSize + halfGrid, z: topEdgeZ },
      { dist: distToBottomEdge, x: Math.round((position[0] - halfGrid) / gridSize) * gridSize + halfGrid, z: bottomEdgeZ },
    ]
    
    const closestEdge = edgeDistances.reduce((closest, edge) => 
      edge.dist < closest.dist ? edge : closest
    )
    
    return [
      closestEdge.x,
      position[1],
      closestEdge.z,
    ] as [number, number, number]
  }
  
  // Foundations, floors snap to grid centers
  return [
    Math.round((position[0] - halfGrid) / gridSize) * gridSize + halfGrid,
    position[1],
    Math.round((position[2] - halfGrid) / gridSize) * gridSize + halfGrid,
  ] as [number, number, number]
}

