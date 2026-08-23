import { beforeEach, describe, expect, it } from 'vitest'
import { FOUNDATION_SIZE, TIER_PROPERTIES } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'

const reset = () =>
  useBuilderStore.setState({
    blocks: [],
    selectedBlockId: null,
    gridSize: FOUNDATION_SIZE,
    snapToGrid: true,
    viewMode: '3d',
    viewEpoch: 0,
    currentTier: 'wood',
    placementMode: null,
  })

const store = () => useBuilderStore.getState()

beforeEach(reset)

describe('addBlock', () => {
  it('stores the piece with the tier that is currently selected', () => {
    store().setCurrentTier('stone')
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])

    const [placed] = store().blocks
    expect(placed.type).toBe('foundation-square')
    expect(placed.tier).toBe('stone')
    expect(placed.health).toBe(TIER_PROPERTIES.stone.health)
    expect(placed.maxHealth).toBe(TIER_PROPERTIES.stone.health)
    expect(placed.scale).toEqual([3, 0.3, 3])
  })

  it('keeps the position and rotation it was given', () => {
    store().addBlock('wall-full', [0, 1.8, 1.5], [0, Math.PI / 2, 0])
    const [placed] = store().blocks
    expect(placed.position).toEqual([0, 1.8, 1.5])
    expect(placed.rotation).toEqual([0, Math.PI / 2, 0])
  })
})

describe('selection', () => {
  it('clears the selection when the selected piece is deleted', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const id = store().blocks[0].id

    store().setSelectedBlock(id)
    store().deleteBlock(id)

    expect(store().blocks).toHaveLength(0)
    expect(store().selectedBlockId).toBeNull()
  })

  it('keeps the selection when a different piece is deleted', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    store().addBlock('foundation-square', [4.5, 0.15, 1.5])
    const [first, second] = store().blocks

    store().setSelectedBlock(first.id)
    store().deleteBlock(second.id)

    expect(store().selectedBlockId).toBe(first.id)
  })

  it('drops the selection when placement mode starts', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    store().setSelectedBlock(store().blocks[0].id)
    store().setPlacementMode('wall-full')
    expect(store().selectedBlockId).toBeNull()
  })
})

describe('ids', () => {
  it('never reuses an id after the base is cleared', () => {
    // The counter used to be reset by clearAll, so a rebuilt base collided with
    // ids that were still referenced by a persisted design.
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const before = store().blocks[0].id

    store().clearAll()
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])

    expect(store().blocks[0].id).not.toBe(before)
  })

  it('gives a duplicate its own id', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const original = store().blocks[0]

    store().duplicateBlock(original.id)
    const [, copy] = store().blocks

    expect(copy.id).not.toBe(original.id)
    expect(copy.type).toBe(original.type)
    expect(copy.position[0]).toBe(original.position[0] + FOUNDATION_SIZE)
    expect(store().selectedBlockId).toBe(copy.id)
  })
})

describe('tiers', () => {
  it('walks a piece up one tier at a time', () => {
    store().setCurrentTier('twig')
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const id = store().blocks[0].id

    store().upgradeTier(id)
    expect(store().blocks[0].tier).toBe('wood')
    expect(store().blocks[0].health).toBe(TIER_PROPERTIES.wood.health)
  })

  it('stops at the top tier', () => {
    store().setCurrentTier('armored')
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const id = store().blocks[0].id

    store().upgradeTier(id)
    expect(store().blocks[0].tier).toBe('armored')
  })
})

describe('clearAll', () => {
  it('empties the design and the selection', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    store().setSelectedBlock(store().blocks[0].id)

    store().clearAll()

    expect(store().blocks).toEqual([])
    expect(store().selectedBlockId).toBeNull()
  })
})

describe('updateBlock', () => {
  it('re-snaps a position that is edited by hand', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    const id = store().blocks[0].id

    store().updateBlock(id, { position: [4.4, 0.15, 1.4] })

    expect(store().blocks[0].position).toEqual([4.5, 0.15, 1.5])
  })

  it('ignores an unknown id', () => {
    store().addBlock('foundation-square', [1.5, 0.15, 1.5])
    store().updateBlock('nope', { tier: 'metal' })
    expect(store().blocks[0].tier).toBe('wood')
  })
})

describe('view mode', () => {
  it('advances the epoch even when the mode does not change', () => {
    // The camera rig watches the epoch so that re-picking the active view
    // re-frames the scene instead of doing nothing.
    store().setViewMode('top')
    const first = store().viewEpoch

    store().setViewMode('top')
    expect(store().viewMode).toBe('top')
    expect(store().viewEpoch).toBe(first + 1)
  })
})
