import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_WORLD, FOUNDATION_HEIGHT, STOREY, solvePlacement } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { aimAt, tool } from './helpers'

const L2 = FOUNDATION_HEIGHT + STOREY
const store = () => useDesignStore.getState()

function placeAt(type: Parameters<typeof tool>[0], target: [number, number, number]) {
  const placement = solvePlacement(store().world, aimAt(target), tool(type))!
  return store().place(placement.spec)
}

beforeEach(() => {
  useDesignStore.setState({ world: EMPTY_WORLD, past: [], future: [] })
})

describe('design store', () => {
  it('validates placements itself, so no caller can build an overlap', () => {
    const first = placeAt('foundation', [1.5, 0, 1.5])!
    expect(first).not.toBeNull()
    const { id: _id, ...spec } = first
    expect(store().place(spec)).toBeNull()
    expect(store().world.pieces.size).toBe(1)
  })

  it('undoes and redoes placements in order', () => {
    placeAt('foundation', [1.5, 0, 1.5])
    placeAt('foundation', [4.5, 0.5, 1.5])
    expect(store().world.pieces.size).toBe(2)

    store().undo()
    expect(store().world.pieces.size).toBe(1)
    store().undo()
    expect(store().world.pieces.size).toBe(0)
    store().undo()
    expect(store().world.pieces.size).toBe(0)

    store().redo()
    store().redo()
    expect(store().world.pieces.size).toBe(2)
  })

  it('drops the redo stack when something new is built', () => {
    placeAt('foundation', [1.5, 0, 1.5])
    store().undo()
    placeAt('foundation', [7.5, 0, 7.5])
    expect(store().future).toHaveLength(0)
  })

  it('brings back everything a demolition collapsed in one undo', () => {
    placeAt('foundation', [1.5, 0, 1.5])
    const wall = placeAt('wall', [1.5, 2.5, 3])!
    placeAt('floor', [1.5, L2, 1.5])

    expect(store().remove(wall.id)).toBe(2)
    expect(store().world.pieces.size).toBe(1)
    store().undo()
    expect(store().world.pieces.size).toBe(3)
  })

  it('upgrades a piece one tier at a time and stops at armored', () => {
    const piece = placeAt('foundation', [1.5, 0, 1.5])!
    const tiers = []
    for (let i = 0; i < 5; i++) {
      store().upgrade(piece.id)
      tiers.push(store().world.pieces.get(piece.id)!.tier)
    }
    expect(tiers).toEqual(['stone', 'metal', 'armored', 'armored', 'armored'])
    expect(store().past).toHaveLength(4)
  })

  it('clears as one undoable step', () => {
    placeAt('foundation', [1.5, 0, 1.5])
    placeAt('foundation', [4.5, 0.5, 1.5])
    store().clear()
    expect(store().world.pieces.size).toBe(0)
    store().undo()
    expect(store().world.pieces.size).toBe(2)
  })
})
