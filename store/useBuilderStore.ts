import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  BLOCK_TEMPLATES,
  BlockType,
  BuildingBlock,
  BuildingTier,
  FOUNDATION_SIZE,
  TIER_ORDER,
  TIER_PROPERTIES,
  getBlockTemplate,
} from '@/types/building-blocks'
import { snapPosition as snapPositionUtil } from '@/utils/snapUtils'

export type ViewMode = '3d' | 'top' | 'front' | 'side'

interface BuilderState {
  blocks: BuildingBlock[]
  selectedBlockId: string | null
  gridSize: number
  snapToGrid: boolean
  viewMode: ViewMode
  /**
   * Bumped on every `setViewMode` call, including re-selecting the current mode.
   * The camera rig watches this rather than `viewMode` so that clicking the
   * active view button re-frames the scene instead of doing nothing.
   */
  viewEpoch: number
  currentTier: BuildingTier
  placementMode: BlockType | null

  addBlock: (
    type: BlockType,
    position: [number, number, number],
    rotation?: [number, number, number]
  ) => void
  updateBlock: (id: string, data: Partial<BuildingBlock>) => void
  deleteBlock: (id: string) => void
  setSelectedBlock: (id: string | null) => void
  clearAll: () => void
  toggleSnapToGrid: () => void
  setViewMode: (mode: ViewMode) => void
  duplicateBlock: (id: string) => void
  snapPosition: (
    position: [number, number, number],
    blockType?: BlockType
  ) => [number, number, number]
  setCurrentTier: (tier: BuildingTier) => void
  upgradeTier: (id: string) => void
  setPlacementMode: (type: BlockType | null) => void
}

let idCounter = 0

/**
 * Ids have to stay unique across `clearAll` and across a reload that restores
 * persisted blocks, so they carry a timestamp as well as a counter.
 */
function nextBlockId(): string {
  idCounter += 1
  return `block-${Date.now().toString(36)}-${idCounter.toString(36)}`
}

function createBlock(
  type: BlockType,
  position: [number, number, number],
  rotation: [number, number, number],
  tier: BuildingTier
): BuildingBlock {
  const template = getBlockTemplate(type)
  const { health } = TIER_PROPERTIES[tier]

  return {
    id: nextBlockId(),
    type,
    position,
    rotation,
    scale: [...template.defaultSize] as [number, number, number],
    tier,
    health,
    maxHealth: health,
  }
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      blocks: [],
      selectedBlockId: null,
      gridSize: FOUNDATION_SIZE,
      snapToGrid: true,
      viewMode: '3d',
      viewEpoch: 0,
      currentTier: 'wood',
      placementMode: null,

      snapPosition: (position, blockType) => {
        const { snapToGrid, gridSize, blocks } = get()
        return snapPositionUtil(position, blockType, snapToGrid, gridSize, blocks)
      },

      addBlock: (type, position, rotation = [0, 0, 0]) => {
        if (!BLOCK_TEMPLATES.some((template) => template.type === type)) return
        const block = createBlock(type, position, rotation, get().currentTier)
        set({ blocks: [...get().blocks, block] })
      },

      updateBlock: (id, data) => {
        const target = get().blocks.find((block) => block.id === id)
        if (!target) return

        const patch = { ...data }
        if (patch.position) {
          patch.position = get().snapPosition(patch.position, target.type)
        }

        set({
          blocks: get().blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
        })
      },

      deleteBlock: (id) => {
        set({
          blocks: get().blocks.filter((block) => block.id !== id),
          selectedBlockId: get().selectedBlockId === id ? null : get().selectedBlockId,
        })
      },

      setSelectedBlock: (id) => set({ selectedBlockId: id }),

      clearAll: () => set({ blocks: [], selectedBlockId: null }),

      toggleSnapToGrid: () => set({ snapToGrid: !get().snapToGrid }),

      setViewMode: (mode) => set({ viewMode: mode, viewEpoch: get().viewEpoch + 1 }),

      duplicateBlock: (id) => {
        const block = get().blocks.find((candidate) => candidate.id === id)
        if (!block) return

        const copy: BuildingBlock = {
          ...block,
          id: nextBlockId(),
          position: [block.position[0] + get().gridSize, block.position[1], block.position[2]],
        }

        set({ blocks: [...get().blocks, copy], selectedBlockId: copy.id })
      },

      setCurrentTier: (tier) => set({ currentTier: tier }),

      upgradeTier: (id) => {
        const block = get().blocks.find((candidate) => candidate.id === id)
        if (!block) return

        const next = TIER_ORDER[TIER_ORDER.indexOf(block.tier) + 1]
        if (!next) return

        const { health } = TIER_PROPERTIES[next]
        get().updateBlock(id, { tier: next, health, maxHealth: health })
      },

      setPlacementMode: (type) => set({ placementMode: type, selectedBlockId: null }),
    }),
    {
      name: 'rust-base-builder',
      storage: createJSONStorage(() => localStorage),
      // Only the design itself is worth restoring; transient UI state is not.
      partialize: (state) => ({
        blocks: state.blocks,
        currentTier: state.currentTier,
        snapToGrid: state.snapToGrid,
      }),
      // Hydration is left on: deferring it opens a window in which any set()
      // would persist the empty default over a saved design. Components that
      // print persisted data guard their first render with `useHydrated`.
    }
  )
)
