import { create } from 'zustand'
import { BuildingBlock, BlockType, BLOCK_TEMPLATES, BuildingTier, TIER_PROPERTIES } from '@/types/building-blocks'
import { snapPosition as snapPositionUtil } from '@/utils/snapUtils'

interface BuilderState {
  blocks: BuildingBlock[]
  selectedBlockId: string | null
  gridSize: number
  snapToGrid: boolean
  viewMode: '3d' | 'top' | 'front' | 'side'
  currentTier: BuildingTier
  placementMode: BlockType | null
  
  addBlock: (type: BlockType, position?: [number, number, number]) => void
  updateBlock: (id: string, data: Partial<BuildingBlock>) => void
  deleteBlock: (id: string) => void
  setSelectedBlock: (id: string | null) => void
  clearAll: () => void
  toggleSnapToGrid: () => void
  setViewMode: (mode: '3d' | 'top' | 'front' | 'side') => void
  duplicateBlock: (id: string) => void
  snapPosition: (position: [number, number, number], blockType?: BlockType) => [number, number, number]
  setCurrentTier: (tier: BuildingTier) => void
  upgradeTier: (id: string) => void
  setPlacementMode: (type: BlockType | null) => void
}

let blockId = 0

export const useBuilderStore = create<BuilderState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  gridSize: 3, // Rust foundation size
  snapToGrid: true,
  viewMode: '3d',
  currentTier: 'wood',
  placementMode: null,

  snapPosition: (position: [number, number, number], blockType?: BlockType) => {
    const { snapToGrid, gridSize, blocks } = get()
    return snapPositionUtil(position, blockType, snapToGrid, gridSize, blocks)
  },

  addBlock: (type: BlockType, position = [0, 0, 0] as [number, number, number]) => {
    const template = BLOCK_TEMPLATES.find(t => t.type === type)
    if (!template) return

    const snappedPosition = get().snapPosition(position, type)
    const tier = get().currentTier
    const tierProps = TIER_PROPERTIES[tier]
    
    // Auto-rotate walls based on orientation
    let rotation: [number, number, number] = [0, 0, 0]
    
    // Auto-rotate triangles based on which corner they're attached to
    if (type.includes('triangle')) {
      const gridSize = get().gridSize
      const halfGrid = gridSize / 2
      const blocks = get().blocks
      
      // Find nearby square foundations/floors
      const isFoundation = type.includes('foundation')
      const isFloor = type.includes('floor')
      const targetTypes = isFoundation 
        ? ['foundation-square'] 
        : ['floor-square']
      
      // For foundations, check at foundation height (0.15), not the snapped Y
      const checkY = isFoundation ? 0.15 : snappedPosition[1]
      
      const nearbySquares = blocks.filter(block => 
        targetTypes.includes(block.type) &&
        Math.abs(block.position[1] - checkY) < 0.5
      )
      
      if (nearbySquares.length > 0) {
        // Find which square this triangle is attached to
        let nearestSquare = nearbySquares[0]
        let minDist = Infinity
        
        for (const square of nearbySquares) {
          const dist = Math.sqrt(
            Math.pow(square.position[0] - snappedPosition[0], 2) +
            Math.pow(square.position[2] - snappedPosition[2], 2)
          )
          if (dist < minDist) {
            minDist = dist
            nearestSquare = square
          }
        }
        
        // Determine which corner based on triangle center position
        const squareX = nearestSquare.position[0]
        const squareZ = nearestSquare.position[2]
        const halfGrid = gridSize / 2 // 1.5
        const triangleCentroidOffset = halfGrid / 3 // 0.5
        
        // Calculate expected triangle center positions for each corner
        const expectedCenters = [
          [squareX - halfGrid + triangleCentroidOffset, squareZ - halfGrid + triangleCentroidOffset], // Top-left
          [squareX + halfGrid - triangleCentroidOffset, squareZ - halfGrid + triangleCentroidOffset], // Top-right
          [squareX - halfGrid + triangleCentroidOffset, squareZ + halfGrid - triangleCentroidOffset], // Bottom-left
          [squareX + halfGrid - triangleCentroidOffset, squareZ + halfGrid - triangleCentroidOffset], // Bottom-right
        ]
        
        // Find which corner this triangle is at (by comparing to expected centers)
        let cornerIndex = 0
        let minCenterDist = Infinity
        
        for (let i = 0; i < expectedCenters.length; i++) {
          const dist = Math.sqrt(
            Math.pow(expectedCenters[i][0] - snappedPosition[0], 2) +
            Math.pow(expectedCenters[i][1] - snappedPosition[2], 2)
          )
          if (dist < minCenterDist) {
            minCenterDist = dist
            cornerIndex = i
          }
        }
        
        // Rotate based on corner index
        // Triangle should point inward toward square center
        // Default triangle geometry has right angle at back-left, point at front-right
        switch (cornerIndex) {
          case 0: // Top-left corner
            rotation = [0, Math.PI / 2, 0] // 90° - points SE (toward center)
            break
          case 1: // Top-right corner
            rotation = [0, Math.PI, 0] // 180° - points SW (toward center)
            break
          case 2: // Bottom-left corner
            rotation = [0, 0, 0] // 0° - points NE (toward center)
            break
          case 3: // Bottom-right corner
            rotation = [0, -Math.PI / 2, 0] // -90° (270°) - points NW (toward center)
            break
        }
      }
    }
    // Auto-rotate walls based on orientation
    else if (type.includes('wall') || type.includes('doorway') || type.includes('window') || type.includes('frame')) {
      const gridSize = get().gridSize
      
      // Determine which edge the wall is on by checking if X or Z is exactly on a grid line
      const isOnXEdge = Math.abs(snappedPosition[0] % gridSize) < 0.01 || Math.abs(snappedPosition[0] % gridSize - gridSize) < 0.01
      const isOnZEdge = Math.abs(snappedPosition[2] % gridSize) < 0.01 || Math.abs(snappedPosition[2] % gridSize - gridSize) < 0.01
      
      // Walls on X edges (left/right) are vertical (north-south), rotate 90°
      // Walls on Z edges (top/bottom) are horizontal (east-west), no rotation
      if (isOnXEdge && !isOnZEdge) {
        rotation = [0, Math.PI / 2, 0] // Vertical wall
      } else {
        rotation = [0, 0, 0] // Horizontal wall
      }
    }
    
    const id = `block-${blockId++}`
    const newBlock: BuildingBlock = {
      id,
      type,
      position: snappedPosition,
      rotation,
      scale: [...template.defaultSize] as [number, number, number],
      tier,
      health: tierProps.health,
      maxHealth: tierProps.health,
    }

    set({ blocks: [...get().blocks, newBlock] })
  },

  updateBlock: (id: string, data: Partial<BuildingBlock>) => {
    const block = get().blocks.find(b => b.id === id)
    
    // Snap position if it's being updated
    if (data.position && block) {
      data.position = get().snapPosition(data.position, block.type)
    }
    
    set({
      blocks: get().blocks.map(block =>
        block.id === id ? { ...block, ...data } : block
      ),
    })
  },

  deleteBlock: (id: string) => {
    set({
      blocks: get().blocks.filter(block => block.id !== id),
      selectedBlockId: get().selectedBlockId === id ? null : get().selectedBlockId,
    })
  },

  setSelectedBlock: (id: string | null) => {
    set({ selectedBlockId: id })
  },

  clearAll: () => {
    set({
      blocks: [],
      selectedBlockId: null,
    })
    blockId = 0
  },

  toggleSnapToGrid: () => {
    set({ snapToGrid: !get().snapToGrid })
  },

  setViewMode: (mode: '3d' | 'top' | 'front' | 'side') => {
    set({ viewMode: mode })
  },

  duplicateBlock: (id: string) => {
    const block = get().blocks.find(b => b.id === id)
    if (!block) return

    const newId = `block-${blockId++}`
    const gridSize = get().gridSize
    const newBlock: BuildingBlock = {
      ...block,
      id: newId,
      position: [
        block.position[0] + gridSize,
        block.position[1],
        block.position[2],
      ] as [number, number, number],
    }

    set({ blocks: [...get().blocks, newBlock] })
  },

  setCurrentTier: (tier: BuildingTier) => {
    set({ currentTier: tier })
  },

  upgradeTier: (id: string) => {
    const tiers: BuildingTier[] = ['twig', 'wood', 'stone', 'metal', 'armored']
    const block = get().blocks.find(b => b.id === id)
    if (!block) return

    const currentIndex = tiers.indexOf(block.tier)
    if (currentIndex < tiers.length - 1) {
      const newTier = tiers[currentIndex + 1]
      const tierProps = TIER_PROPERTIES[newTier]
      
      get().updateBlock(id, {
        tier: newTier,
        health: tierProps.health,
        maxHealth: tierProps.health,
      })
    }
  },

  setPlacementMode: (type: BlockType | null) => {
    set({ placementMode: type, selectedBlockId: null })
  },
}))
