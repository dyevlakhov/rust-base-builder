import { describe, expect, it } from 'vitest'
import {
  FOUNDATION_HEIGHT,
  STOREY,
  SaveFormatError,
  applyPatch,
  computeStability,
  createWorld,
  deserialize,
  raycast,
  rayBetween,
  removeCommand,
  serialize,
  setTierCommand,
} from '@/engine'
import { build, room } from './helpers'

const L2 = FOUNDATION_HEIGHT + STOREY

describe('stability', () => {
  it('keeps the ground storey at 100% and loses 10% per storey of walls above it', () => {
    let world = room()
    world = build(world, 'floor', [1.5, L2, 1.5]).world
    world = build(world, 'wall', [1.5, L2 + 1.5, 3]).world

    const stability = computeStability(world)
    const pieces = [...world.pieces.values()]
    const lowerWall = pieces.find((p) => p.type === 'wall' && p.y === FOUNDATION_HEIGHT)!
    const upperWall = pieces.find((p) => p.type === 'wall' && p.y === L2)!
    const floor = pieces.find((p) => p.type === 'floor')!

    expect(stability.get(lowerWall.id)).toBe(1)
    expect(stability.get(floor.id)).toBe(1)
    expect(stability.get(upperWall.id)).toBeCloseTo(0.9)
  })
})

describe('removal', () => {
  it('brings down what only the removed piece was holding up', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const wall = build(world, 'wall', [1.5, 2.5, 3])
    world = build(wall.world, 'floor', [1.5, L2, 1.5]).world

    const patch = removeCommand(world, wall.piece.id)!
    expect(patch.remove.map((p) => p.type).sort()).toEqual(['floor', 'wall'])
  })

  it('leaves a floor standing while another wall still carries it', () => {
    const world = build(room(), 'floor', [1.5, L2, 1.5]).world
    const aWall = [...world.pieces.values()].find((p) => p.type === 'wall')!
    expect(removeCommand(world, aWall.id)!.remove).toHaveLength(1)
  })

  it('collapses the whole room when its foundation goes', () => {
    const world = build(room(), 'floor', [1.5, L2, 1.5]).world
    const foundation = [...world.pieces.values()].find((p) => p.type === 'foundation')!
    expect(removeCommand(world, foundation.id)!.remove).toHaveLength(6)
  })
})

describe('tiers', () => {
  it('changes tier without moving the piece', () => {
    const { world, piece } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const next = applyPatch(world, setTierCommand(world, [piece.id], 'stone')!)
    expect(next.pieces.get(piece.id)).toEqual({ ...piece, tier: 'stone' })
    expect(setTierCommand(next, [piece.id], 'stone')).toBeNull()
  })
})

describe('raycast', () => {
  it('hits the top of a foundation from above', () => {
    const { world, piece } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const hit = raycast(world, rayBetween([1.5, 20, 1.5], [1.5, 0, 1.5]))!
    expect(hit.pieceId).toBe(piece.id)
    expect(hit.point[1]).toBeCloseTo(FOUNDATION_HEIGHT)
    expect(hit.normal).toEqual([0, 1, 0])
  })

  it('hits the face of a wall from the side', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const wall = build(world, 'wall', [1.5, 2.5, 3])
    world = wall.world
    const hit = raycast(world, rayBetween([1.5, 2.5, 20], [1.5, 2.5, 0]))!
    expect(hit.pieceId).toBe(wall.piece.id)
    expect(hit.point[2]).toBeCloseTo(3.12)
  })

  it('falls through to the ground', () => {
    const hit = raycast(createWorld(), rayBetween([0, 10, 0], [5, 0, 5]))!
    expect(hit.pieceId).toBeNull()
    expect(hit.point[0]).toBeCloseTo(5)
  })
})

describe('saving', () => {
  it('round-trips a base through the save format', () => {
    const world = build(room(), 'floor', [1.5, L2, 1.5]).world
    const save = JSON.parse(JSON.stringify(serialize(world)))
    const restored = createWorld(deserialize(save))

    const strip = (w: typeof world) =>
      [...w.pieces.values()].map(({ type, tier, x, y, z, yaw }) => ({ type, tier, x, y, z, yaw }))
    expect(strip(restored)).toEqual(
      strip(world).map((p) => ({
        ...p,
        x: expect.closeTo(p.x, 3),
        y: expect.closeTo(p.y, 3),
        z: expect.closeTo(p.z, 3),
        yaw: expect.closeTo(p.yaw, 3),
      }))
    )
  })

  it('skips malformed pieces and rejects files that are not saves', () => {
    const pieces = deserialize({
      format: 'rust-base-builder',
      version: 2,
      pieces: [['foundation', 'wood', 1.5, 0, 1.5, 0], ['nope', 'wood', 0, 0, 0, 0], 'junk'],
    })
    expect(pieces).toHaveLength(1)
    expect(() => deserialize({ blocks: [] })).toThrow(SaveFormatError)
    expect(() => deserialize({ format: 'rust-base-builder', version: 99, pieces: [] })).toThrow(
      SaveFormatError
    )
  })
})
