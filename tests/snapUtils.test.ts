import { describe, expect, it } from 'vitest'
import { BuildingBlock, FOUNDATION_SIZE, getBlockTemplate } from '@/types/building-blocks'
import {
  isWallOnNorthSouthEdge,
  resolveTriangleAttachment,
  snapPosition,
  snapToCellCentre,
  triangleAttachDistance,
} from '@/utils/snapUtils'

const GRID = FOUNDATION_SIZE

function block(type: BuildingBlock['type'], position: [number, number, number]): BuildingBlock {
  const template = getBlockTemplate(type)
  return {
    id: `${type}-${position.join('/')}`,
    type,
    position,
    rotation: [0, 0, 0],
    scale: [...template.defaultSize] as [number, number, number],
    tier: 'wood',
    health: 250,
    maxHealth: 250,
  }
}

const squareFoundation = (x: number, z: number) => block('foundation-square', [x, 0.15, z])

describe('snapToCellCentre', () => {
  it('snaps to the centre of the containing cell', () => {
    expect(snapToCellCentre(1.2, 1.9, GRID)).toEqual([1.5, 1.5])
    expect(snapToCellCentre(4.4, 0.1, GRID)).toEqual([4.5, 1.5])
  })

  it('works on the negative side of the origin', () => {
    expect(snapToCellCentre(-1.2, -1.9, GRID)).toEqual([-1.5, -1.5])
    expect(snapToCellCentre(-4.4, -0.1, GRID)).toEqual([-4.5, -1.5])
  })
})

describe('snapPosition', () => {
  it('leaves the position alone when snapping is off', () => {
    const raw: [number, number, number] = [1.234, 5.678, 9.012]
    expect(snapPosition(raw, 'foundation-square', false, GRID, [])).toEqual(raw)
  })

  it('never changes Y — height is decided by stacking, not by the grid', () => {
    const [, y] = snapPosition([1.2, 7.77, 1.9], 'foundation-square', true, GRID, [])
    expect(y).toBe(7.77)
  })

  it('snaps foundations and floors to cell centres', () => {
    expect(snapPosition([1.2, 0.15, 1.9], 'foundation-square', true, GRID, [])).toEqual([
      1.5, 0.15, 1.5,
    ])
    expect(snapPosition([-1.2, 3.4, -1.9], 'floor-square', true, GRID, [])).toEqual([
      -1.5, 3.4, -1.5,
    ])
  })
})

describe('wall snapping', () => {
  it('snaps to the nearest cell edge', () => {
    // Just inside the north edge of the cell spanning x 0..3, z 0..3.
    expect(snapPosition([1.4, 1.8, 0.2], 'wall-full', true, GRID, [])).toEqual([1.5, 1.8, 0])
    // Just inside the west edge of the same cell.
    expect(snapPosition([0.2, 1.8, 1.4], 'wall-full', true, GRID, [])).toEqual([0, 1.8, 1.5])
  })

  it('picks the correct edge just across a grid line', () => {
    // 0.2 west of the x = 0 line: the nearest edge is still x = 0.
    expect(snapPosition([-0.2, 1.8, 1.4], 'wall-full', true, GRID, [])).toEqual([0, 1.8, 1.5])
  })

  it('treats doorways, windows and frames as walls', () => {
    for (const type of ['doorway', 'window', 'wall-frame'] as const) {
      expect(snapPosition([0.2, 1.8, 1.4], type, true, GRID, [])).toEqual([0, 1.8, 1.5])
    }
  })

  it('detects which way a snapped wall runs', () => {
    expect(isWallOnNorthSouthEdge([0, 1.8, 1.5], GRID)).toBe(true)
    expect(isWallOnNorthSouthEdge([1.5, 1.8, 0], GRID)).toBe(false)
  })
})

describe('triangle attachment', () => {
  const distance = triangleAttachDistance(GRID)

  it('reaches half a cell beyond the edge it attaches to', () => {
    // Half a cell out to the edge, plus a third of the triangle depth to its centroid.
    expect(distance).toBe(GRID / 2 + GRID / 2 / 3)
  })

  it('attaches to the nearest edge of a nearby square', () => {
    const blocks = [squareFoundation(4.5, 4.5)]
    const attachment = resolveTriangleAttachment(
      blocks,
      [4.4, 0.15, 7],
      'foundation-triangle',
      GRID
    )

    expect(attachment.square).toEqual([4.5, 4.5])
    expect(attachment.centroid).toEqual([4.5, 4.5 + distance])
    expect(attachment.rotation).toBe(0) // apex points +Z
    expect(attachment.targetCell).toEqual([4.5, 7.5])
  })

  it('turns to face each of the four edges', () => {
    const blocks = [squareFoundation(4.5, 4.5)]
    const at = (x: number, z: number) =>
      resolveTriangleAttachment(blocks, [x, 0.15, z], 'foundation-triangle', GRID)

    expect(at(4.5, 1).rotation).toBeCloseTo(Math.PI) // north
    expect(at(8, 4.5).rotation).toBeCloseTo(Math.PI / 2) // east
    expect(at(4.5, 8).rotation).toBeCloseTo(0) // south
    expect(at(1, 4.5).rotation).toBeCloseTo(-Math.PI / 2) // west
  })

  it('falls back to the nearest empty cell when there is nothing to attach to', () => {
    const attachment = resolveTriangleAttachment([], [1.4, 0.15, 5], 'foundation-triangle', GRID)
    expect(attachment.square).toEqual([1.5, 4.5])
    expect(attachment.centroid).toEqual([1.5, 4.5 + distance])
  })

  it('places the triangle outside the square, never on top of it', () => {
    const blocks = [squareFoundation(1.5, 1.5)]
    const [x, , z] = snapPosition([1.5, 0.15, 3.4], 'foundation-triangle', true, GRID, blocks)

    // Square spans z 0..3; the triangle base starts at the edge and runs outwards.
    const baseZ = z - GRID / 2 / 3
    expect(x).toBe(1.5)
    expect(baseZ).toBeGreaterThanOrEqual(3)
  })

  it('matches floor triangles to squares on their own storey', () => {
    const blocks = [block('floor-square', [1.5, 3.4, 1.5]), squareFoundation(1.5, 1.5)]
    const attachment = resolveTriangleAttachment(blocks, [1.5, 3.4, 5], 'floor-triangle', GRID)
    expect(attachment.square).toEqual([1.5, 1.5])
  })
})
