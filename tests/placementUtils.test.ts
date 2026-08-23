import { describe, expect, it } from 'vitest'
import {
  BlockType,
  BuildingBlock,
  FOUNDATION_SIZE,
  getBlockTemplate,
} from '@/types/building-blocks'
import {
  apexDirection,
  calculateYPosition,
  canPlace,
  findHighestBlockBelow,
  getBlockHeight,
  resolvePlacement,
} from '@/utils/placementUtils'

const GRID = FOUNDATION_SIZE

let counter = 0
function block(type: BlockType, position: [number, number, number], rotationY = 0): BuildingBlock {
  const template = getBlockTemplate(type)
  return {
    id: `b${counter++}`,
    type,
    position,
    rotation: [0, rotationY, 0],
    scale: [...template.defaultSize] as [number, number, number],
    tier: 'wood',
    health: 250,
    maxHealth: 250,
  }
}

const foundation = (x: number, z: number) => block('foundation-square', [x, 0.15, z])
const wall = (x: number, z: number, y = 1.8, rotationY = 0) =>
  block('wall-full', [x, y, z], rotationY)

describe('apexDirection', () => {
  it('maps a triangle rotation to the direction its apex points', () => {
    expect(apexDirection(0).map(Math.round)).toEqual([0, 1]) // +Z
    expect(apexDirection(Math.PI / 2).map(Math.round)).toEqual([1, 0]) // +X
    expect(apexDirection(Math.PI).map(Math.round)).toEqual([0, -1]) // -Z
    expect(apexDirection(-Math.PI / 2).map(Math.round)).toEqual([-1, 0]) // -X
  })
})

describe('stacking', () => {
  it('always puts foundations on the ground', () => {
    const blocks = [foundation(1.5, 1.5)]
    expect(calculateYPosition(blocks, [1.5, 1000, 1.5], 'foundation-square')).toBe(0.15)
  })

  it('rests a first wall on a foundation', () => {
    expect(calculateYPosition([], [1.5, 1000, 0], 'wall-full')).toBe(1.8)
  })

  it('stacks a second storey wall on the one below it', () => {
    const blocks = [wall(1.5, 0)]
    // Wall spans 0.3..3.3, so the next one is centred 1.5 above its top.
    expect(calculateYPosition(blocks, [1.5, 1000, 0], 'wall-full')).toBeCloseTo(4.8)
  })

  it('rests a floor on the walls under it', () => {
    const blocks = [wall(1.5, 0), wall(1.5, 3)]
    expect(calculateYPosition(blocks, [1.5, 1000, 1.5], 'floor-square')).toBeCloseTo(3.4)
  })

  it('only stacks a wall on something at its own edge', () => {
    // A foundation in the middle of the cell must not lift a wall on the edge.
    const blocks = [foundation(1.5, 1.5)]
    expect(findHighestBlockBelow(blocks, [1.5, 1000, 0], 'wall-full')).toBeNull()
  })
})

describe('collision', () => {
  it('rejects two square foundations in the same cell', () => {
    const blocks = [foundation(1.5, 1.5)]
    expect(canPlace(blocks, [1.5, 0.15, 1.5], [0, 0, 0], 'foundation-square', GRID)).toBe(false)
  })

  it('allows foundations in neighbouring cells', () => {
    const blocks = [foundation(1.5, 1.5)]
    expect(canPlace(blocks, [4.5, 0.15, 1.5], [0, 0, 0], 'foundation-square', GRID)).toBe(true)
  })

  it('allows a floor directly above a foundation', () => {
    const blocks = [foundation(1.5, 1.5)]
    expect(canPlace(blocks, [1.5, 3.4, 1.5], [0, 0, 0], 'floor-square', GRID)).toBe(true)
  })

  it('rejects two floors on the same storey of the same cell', () => {
    const blocks = [block('floor-square', [1.5, 3.4, 1.5])]
    expect(canPlace(blocks, [1.5, 3.4, 1.5], [0, 0, 0], 'floor-square', GRID)).toBe(false)
  })

  it('rejects two walls occupying the same edge at the same height', () => {
    const blocks = [wall(1.5, 0)]
    expect(canPlace(blocks, [1.5, 1.8, 0], [0, 0, 0], 'wall-full', GRID)).toBe(false)
  })

  it('allows walls stacked exactly on top of each other', () => {
    const blocks = [wall(1.5, 0)]
    expect(canPlace(blocks, [1.5, 4.8, 0], [0, 0, 0], 'wall-full', GRID)).toBe(true)
  })

  it('lets a wall and a foundation share a cell', () => {
    const blocks = [foundation(1.5, 1.5)]
    expect(canPlace(blocks, [1.5, 1.8, 0], [0, 0, 0], 'wall-full', GRID)).toBe(true)
  })

  it('rejects a triangle reaching into a cell a square already fills', () => {
    const blocks = [foundation(4.5, 4.5), foundation(4.5, 7.5)]
    // Attached to the south edge of (4.5, 4.5), so it reaches into (4.5, 7.5).
    expect(canPlace(blocks, [4.5, 0.15, 6.5], [0, 0, 0], 'foundation-triangle', GRID)).toBe(false)
  })

  it('allows a triangle reaching into an empty cell', () => {
    const blocks = [foundation(4.5, 4.5)]
    expect(canPlace(blocks, [4.5, 0.15, 6.5], [0, 0, 0], 'foundation-triangle', GRID)).toBe(true)
  })
})

describe('resolvePlacement', () => {
  it('resolves a foundation on an empty scene', () => {
    const placement = resolvePlacement([], { x: 1.2, z: 1.9 }, 'foundation-square', GRID, true)
    expect(placement.position).toEqual([1.5, 0.15, 1.5])
    expect(placement.rotation).toEqual([0, 0, 0])
    expect(placement.valid).toBe(true)
  })

  it('auto-rotates a wall to lie along the edge it snapped to', () => {
    const northSouth = resolvePlacement([], { x: 0.2, z: 1.4 }, 'wall-full', GRID, true)
    expect(northSouth.position).toEqual([0, 1.8, 1.5])
    expect(northSouth.rotation[1]).toBeCloseTo(Math.PI / 2)

    const eastWest = resolvePlacement([], { x: 1.4, z: 0.2 }, 'wall-full', GRID, true)
    expect(eastWest.position).toEqual([1.5, 1.8, 0])
    expect(eastWest.rotation[1]).toBe(0)
  })

  it('reports an occupied cell as invalid', () => {
    const blocks = [foundation(1.5, 1.5)]
    const placement = resolvePlacement(blocks, { x: 1.2, z: 1.9 }, 'foundation-square', GRID, true)
    expect(placement.valid).toBe(false)
  })

  it('snaps and rotates a triangle against the square it attaches to', () => {
    const blocks = [foundation(1.5, 1.5)]
    const placement = resolvePlacement(
      blocks,
      { x: 4.2, z: 1.6 },
      'foundation-triangle',
      GRID,
      true
    )

    // Attached to the east edge, reaching into the empty cell beyond it.
    expect(placement.position).toEqual([3.5, 0.15, 1.5])
    expect(placement.rotation[1]).toBeCloseTo(Math.PI / 2)
    expect(placement.valid).toBe(true)
  })

  it('drops a piece straight onto the cursor when snapping is off', () => {
    const placement = resolvePlacement([], { x: 1.234, z: 5.678 }, 'foundation-square', GRID, false)
    expect(placement.position[0]).toBe(1.234)
    expect(placement.position[2]).toBe(5.678)
  })

  it('stacks a wall onto the wall below it', () => {
    const blocks = [wall(1.5, 0)]
    const placement = resolvePlacement(blocks, { x: 1.4, z: 0.2 }, 'wall-full', GRID, true)
    expect(placement.position[1]).toBeCloseTo(4.8)
    expect(placement.valid).toBe(true)
  })
})

describe('block heights', () => {
  it('reads the height from the template', () => {
    expect(getBlockHeight('wall-full')).toBe(3)
    expect(getBlockHeight('wall-half')).toBe(1.5)
    expect(getBlockHeight('wall-low')).toBe(1)
    expect(getBlockHeight('foundation-square')).toBe(0.3)
  })
})
