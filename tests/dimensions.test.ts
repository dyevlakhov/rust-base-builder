import { describe, expect, it } from 'vitest'
import {
  BLOCK_TEMPLATES,
  FOUNDATION_HEIGHT,
  FOUNDATION_TOP,
  WALL_TOP,
  getBlockTemplate,
} from '@/types/building-blocks'
import { getBlockHeight, getDefaultY, isFloor, isWall } from '@/utils/placementUtils'

describe('block dimensions', () => {
  it('stacking height matches the height a piece is actually drawn at', () => {
    // These used to be two hand-maintained tables that disagreed: the collision
    // maths said a floor was 0.2 tall while the mesh was scaled to 0.15.
    for (const template of BLOCK_TEMPLATES) {
      expect(getBlockHeight(template.type)).toBe(template.defaultSize[1])
    }
  })

  it('every template is reachable by type', () => {
    for (const template of BLOCK_TEMPLATES) {
      expect(getBlockTemplate(template.type)).toBe(template)
    }
  })

  it('classifies floor-frame as a floor, not a wall', () => {
    // The old predicates matched substrings, and "floor-frame" contains "frame",
    // so it was treated as a 3 m tall wall for stacking and collision.
    expect(isWall('floor-frame')).toBe(false)
    expect(isFloor('floor-frame')).toBe(true)
    expect(getBlockHeight('floor-frame')).toBe(getBlockHeight('floor-square'))
  })

  it('classifies wall-frame as a wall', () => {
    expect(isWall('wall-frame')).toBe(true)
    expect(isFloor('wall-frame')).toBe(false)
  })
})

describe('default resting heights', () => {
  it('sits a foundation on the ground', () => {
    expect(getDefaultY('foundation-square')).toBe(FOUNDATION_HEIGHT / 2)
    expect(getDefaultY('foundation-triangle')).toBe(FOUNDATION_HEIGHT / 2)
  })

  it('sits walls on top of a foundation', () => {
    expect(getDefaultY('wall-full')).toBe(FOUNDATION_TOP + 3 / 2)
    expect(getDefaultY('wall-half')).toBe(FOUNDATION_TOP + 1.5 / 2)
    expect(getDefaultY('wall-low')).toBe(FOUNDATION_TOP + 1 / 2)
  })

  it('sits floors on top of a full height wall', () => {
    expect(getDefaultY('floor-square')).toBe(WALL_TOP + 0.2 / 2)
  })

  it('leaves no gap between a wall top and the floor above it', () => {
    const wallTop = getDefaultY('wall-full') + getBlockHeight('wall-full') / 2
    const floorBottom = getDefaultY('floor-square') - getBlockHeight('floor-square') / 2
    expect(floorBottom).toBeCloseTo(wallTop, 10)
  })
})
