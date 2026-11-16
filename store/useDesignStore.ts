import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  EMPTY_WORLD,
  Patch,
  Piece,
  PieceSpec,
  SaveFile,
  Tier,
  World,
  applyPatch,
  clearCommand,
  createWorld,
  deserialize,
  invertPatch,
  isEmptyPatch,
  nextTier,
  placeCommand,
  removeCommand,
  replaceCommand,
  serialize,
  setTierCommand,
} from '@/engine'

/** Enough to undo a long session; patches are small. */
const HISTORY_LIMIT = 300

interface DesignState {
  world: World
  past: Patch[]
  future: Patch[]

  /** Build a piece. Re-validated here, so no caller can bypass the rules. */
  place: (spec: PieceSpec) => Piece | null
  /** Remove a piece and whatever collapses with it. Returns how many went. */
  remove: (id: string) => number
  setTier: (id: string, tier: Tier) => void
  upgrade: (id: string) => void
  clear: () => void
  /** Replace the base with a loaded one, as a single undoable step. */
  load: (pieces: readonly Piece[]) => void
  undo: () => void
  redo: () => void
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => {
      /** Apply a new change: it becomes undoable and clears the redo stack. */
      const commit = (patch: Patch | null): Patch | null => {
        if (!patch || isEmptyPatch(patch)) return null
        const { world, past } = get()
        set({
          world: applyPatch(world, patch),
          past: [...past, patch].slice(-HISTORY_LIMIT),
          future: [],
        })
        return patch
      }

      return {
        world: EMPTY_WORLD,
        past: [],
        future: [],

        place: (spec) => commit(placeCommand(get().world, spec))?.add[0] ?? null,

        remove: (id) => commit(removeCommand(get().world, id))?.remove.length ?? 0,

        setTier: (id, tier) => {
          commit(setTierCommand(get().world, [id], tier))
        },

        upgrade: (id) => {
          const piece = get().world.pieces.get(id)
          const tier = piece && nextTier(piece.tier)
          if (tier) commit(setTierCommand(get().world, [id], tier))
        },

        clear: () => {
          commit(clearCommand(get().world))
        },

        load: (pieces) => {
          commit(replaceCommand(get().world, pieces))
        },

        undo: () => {
          const { world, past, future } = get()
          const patch = past.at(-1)
          if (!patch) return
          set({
            world: applyPatch(world, invertPatch(patch)),
            past: past.slice(0, -1),
            future: [...future, patch],
          })
        },

        redo: () => {
          const { world, past, future } = get()
          const patch = future.at(-1)
          if (!patch) return
          set({
            world: applyPatch(world, patch),
            past: [...past, patch],
            future: future.slice(0, -1),
          })
        },
      }
    },
    {
      name: 'rust-base-builder:design',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Only the base itself is saved — in the same format as an exported
      // file — never the history.
      partialize: (state) => ({ save: serialize(state.world) }),
      merge: (persisted, current) => {
        const save = (persisted as { save?: SaveFile } | undefined)?.save
        if (!save) return current
        try {
          return { ...current, world: createWorld(deserialize(save)) }
        } catch {
          return current
        }
      },
    }
  )
)

/** Pieces as an array, cached per world so selectors stay referentially stable. */
const pieceLists = new WeakMap<World, Piece[]>()
export function piecesOf(world: World): Piece[] {
  let list = pieceLists.get(world)
  if (!list) {
    list = [...world.pieces.values()]
    pieceLists.set(world, list)
  }
  return list
}
