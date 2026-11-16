import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { PieceType, PlacementProblem, TIERS, Tier } from '@/engine'

export type ViewMode = '3d' | 'top' | 'front' | 'side'

/** What the ghost currently shows, for the HUD. Updated only when it changes. */
export interface GhostStatus {
  valid: boolean
  problem: PlacementProblem | null
  stability: number
}

interface ToolState {
  /** Piece being placed, or `null` when the cursor selects instead. */
  activeType: PieceType | null
  tier: Tier
  /** Rotate presses since the piece was picked. */
  rotation: number
  snap: boolean
  selectedId: string | null
  ghost: GhostStatus | null
  viewMode: ViewMode
  /**
   * Bumped on every `setViewMode`, including re-picking the current mode, so the
   * camera re-frames even when the mode itself did not change.
   */
  viewEpoch: number
  /** The keyboard reference overlay. */
  keymapOpen: boolean

  setActiveType: (type: PieceType | null) => void
  setTier: (tier: Tier) => void
  /** Step through tiers, wrapping around. */
  cycleTier: (direction: 1 | -1) => void
  toggleKeymap: (open?: boolean) => void
  rotate: () => void
  toggleSnap: () => void
  select: (id: string | null) => void
  setGhost: (ghost: GhostStatus | null) => void
  setViewMode: (mode: ViewMode) => void
}

export const useToolStore = create<ToolState>()(
  persist(
    (set, get) => ({
      activeType: null,
      tier: 'wood',
      rotation: 0,
      snap: true,
      selectedId: null,
      ghost: null,
      viewMode: '3d',
      viewEpoch: 0,
      keymapOpen: false,

      setActiveType: (type) =>
        set({ activeType: type, rotation: 0, selectedId: null, ghost: null }),
      setTier: (tier) => set({ tier }),
      cycleTier: (direction) => {
        const index = TIERS.indexOf(get().tier)
        set({ tier: TIERS[(index + direction + TIERS.length) % TIERS.length] })
      },
      toggleKeymap: (open) => set({ keymapOpen: open ?? !get().keymapOpen }),
      rotate: () => set({ rotation: get().rotation + 1 }),
      toggleSnap: () => set({ snap: !get().snap }),
      select: (id) => set({ selectedId: id }),
      setGhost: (ghost) => {
        const current = get().ghost
        const same =
          current === ghost ||
          (current &&
            ghost &&
            current.valid === ghost.valid &&
            current.problem === ghost.problem &&
            Math.abs(current.stability - ghost.stability) < 0.005)
        if (!same) set({ ghost })
      },
      setViewMode: (mode) => set({ viewMode: mode, viewEpoch: get().viewEpoch + 1 }),
    }),
    {
      name: 'rust-base-builder:tool',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tier: state.tier, snap: state.snap }),
    }
  )
)
