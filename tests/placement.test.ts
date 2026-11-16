import { describe, expect, it } from 'vitest'
import {
  FLOOR_THICKNESS,
  FOUNDATION_HEIGHT,
  PIECES,
  ROTATION_STEP,
  STOREY,
  TRIANGLE_CIRCUMRADIUS,
  TRIANGLE_INRADIUS,
  createWorld,
  distance2,
  evaluatePlacement,
  socketsOf,
} from '@/engine'
import { build, expectSpec, room, solve, worldOf } from './helpers'

const L1 = FOUNDATION_HEIGHT // first storey floor level
const L2 = FOUNDATION_HEIGHT + STOREY

describe('foundations', () => {
  it('snaps a free-standing foundation to a grid cell on the ground', () => {
    const { piece } = build(createWorld(), 'foundation', [2.2, 0, 0.9])
    expectSpec(piece, { x: 1.5, y: 0, z: 1.5, yaw: 0 })
  })

  it('places a foundation exactly where the cursor is with snap off, at the tool rotation', () => {
    const { piece } = build(createWorld(), 'foundation', [2.2, 0, 0.9], {
      snap: false,
      rotation: 2,
    })
    expectSpec(piece, { x: 2.2, z: 0.9, yaw: 2 * ROTATION_STEP })
  })

  it('extends a base by attaching to the edge the cursor is next to', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const east = build(world, 'foundation', [4.5, 0.5, 1.5])
    expectSpec(east.piece, { x: 4.5, y: 0, z: 1.5 })
    world = east.world
    expectSpec(build(world, 'foundation', [1.5, 0.5, 4.5]).piece, { x: 1.5, z: 4.5 })
  })

  it('follows a rotated foundation instead of a world grid', () => {
    const yaw = 0.4
    const world = worldOf({ type: 'foundation', tier: 'wood', x: 0, y: 0, z: 0, yaw })
    const target: [number, number, number] = [Math.sin(yaw) * 3, 0.5, Math.cos(yaw) * 3]
    const { piece } = build(world, 'foundation', target)
    expect(piece.x).toBeCloseTo(target[0])
    expect(piece.z).toBeCloseTo(target[2])
  })

  it('attaches an equilateral triangle flush against a square edge', () => {
    const { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const { piece } = build(world, 'foundation-triangle', [3 + TRIANGLE_INRADIUS, 0.5, 1.5])
    expectSpec(piece, { x: 3 + TRIANGLE_INRADIUS, z: 1.5, yaw: Math.PI / 2 })
  })

  it('chains triangles off triangles — six of them close a hexagon', () => {
    // Six triangles with their apex on the origin, 60° apart.
    let world = createWorld()
    for (let k = 0; k < 6; k++) {
      const yaw = (k * Math.PI) / 3
      const spec = {
        type: 'foundation-triangle' as const,
        tier: 'wood' as const,
        x: -Math.sin(yaw) * TRIANGLE_CIRCUMRADIUS,
        y: 0,
        z: -Math.cos(yaw) * TRIANGLE_CIRCUMRADIUS,
        yaw,
      }

      if (k > 0) {
        // Each one is offered as a socket by the triangle before it.
        const previous = [...world.pieces.values()].at(-1)!
        const sockets = socketsOf(previous, PIECES['foundation-triangle'], {
          tier: 'wood',
          rotation: 0,
        })
        expect(sockets.some((s) => distance2([s.x, s.z], [spec.x, spec.z]) < 1e-6)).toBe(true)
      }

      expect(evaluatePlacement(world, spec).valid).toBe(true)
      // The first one stands free, so it must not snap to the grid.
      const built = build(world, 'foundation-triangle', [spec.x, 0, spec.z], { snap: false })
      expectSpec(built.piece, { x: spec.x, z: spec.z })
      world = built.world
    }

    expect(world.pieces.size).toBe(6)
    const centre = evaluatePlacement(world, {
      type: 'foundation',
      tier: 'wood',
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
    })
    expect(centre.problem).toBe('collision')
  })

  it('refuses a foundation that overlaps another', () => {
    const { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const overlap = evaluatePlacement(world, {
      type: 'foundation',
      tier: 'wood',
      x: 2.5,
      y: 0,
      z: 1.5,
      yaw: 0,
    })
    expect(overlap.problem).toBe('collision')
  })
})

describe('walls', () => {
  it('stands a wall on the foundation edge nearest the cursor, on the foundation top', () => {
    const { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const { piece } = build(world, 'wall', [1.5, 2.5, 3])
    expectSpec(piece, { x: 1.5, y: L1, z: 3, yaw: 0 })
  })

  it('flips a wall to face the other way with one rotate press', () => {
    const { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    expectSpec(build(world, 'wall', [1.5, 2.5, 3], { rotation: 1 }).piece, { yaw: Math.PI })
  })

  it('stands a wall on the 60° edge of a triangle', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const triangle = build(world, 'foundation-triangle', [3 + TRIANGLE_INRADIUS, 0.5, 1.5])
    world = triangle.world

    const sockets = socketsOf(triangle.piece, PIECES.wall, { tier: 'wood', rotation: 0 })
    const slanted = sockets.find((s) => Math.abs(s.yaw - Math.PI / 6) < 1e-6)!
    expect(slanted).toBeDefined()

    const { piece } = build(world, 'wall', [slanted.x, L1 + 1.5, slanted.z])
    expectSpec(piece, { x: slanted.x, z: slanted.z, yaw: Math.PI / 6, y: L1 })
  })

  it('refuses a wall with nothing under it', () => {
    const { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const floating = solve(world, 'wall', [20, 2, 20])
    expect(floating.valid).toBe(false)
    expect(floating.problem).toBe('unsupported')
  })

  it('refuses a second wall on an occupied edge but allows walls meeting at a corner', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    world = build(world, 'wall', [1.5, 2.5, 3]).world

    const wall = { type: 'wall' as const, tier: 'wood' as const, y: L1 }
    expect(evaluatePlacement(world, { ...wall, x: 1.5, z: 3, yaw: Math.PI }).problem).toBe(
      'collision'
    )
    expect(evaluatePlacement(world, { ...wall, x: 3, z: 1.5, yaw: Math.PI / 2 }).valid).toBe(true)
  })

  it('stacks a wall on top of a full wall, one storey up', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    world = build(world, 'wall', [1.5, 2.5, 3]).world
    const upper = solve(world, 'wall', [1.5, L2 + 1.5, 3])
    expect(upper.valid).toBe(true)
    expectSpec(upper.spec, { x: 1.5, z: 3, y: L2 })
    expect(upper.stability).toBeCloseTo(0.9)
  })

  it('does not stack a wall on a half wall, and nothing at all on a low wall', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    world = build(world, 'wall-half', [1.5, 1.75, 3]).world
    world = build(world, 'wall-low', [3, 1.5, 1.5]).world
    const half = [...world.pieces.values()].find((p) => p.type === 'wall-half')!
    const low = [...world.pieces.values()].find((p) => p.type === 'wall-low')!
    const tool = { tier: 'wood' as const, rotation: 0 }
    expect(socketsOf(half, PIECES.wall, tool)).toHaveLength(0)
    expect(socketsOf(low, PIECES.wall, tool)).toHaveLength(0)
    expect(socketsOf(low, PIECES.floor, tool)).toHaveLength(0)
  })

  it('puts a triangle ceiling on a half wall, next to a full wall on the same triangle', () => {
    // Two triangle foundations side by side; a full wall on one edge of the
    // first, a half wall on the edge they share.
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    const first = build(world, 'foundation-triangle', [3 + TRIANGLE_INRADIUS, 0.5, 1.5])
    world = first.world
    const edges = socketsOf(first.piece, PIECES.wall, { tier: 'wood', rotation: 0 })
    const slanted = edges.filter(
      (s) =>
        Math.abs(Math.abs(s.yaw) - Math.PI / 6) < 1e-6 ||
        Math.abs(Math.abs(s.yaw) - (5 * Math.PI) / 6) < 1e-6
    )
    expect(slanted).toHaveLength(2)

    world = build(world, 'wall', [slanted[0].x, L1 + 1.5, slanted[0].z]).world
    world = build(world, 'wall-half', [slanted[1].x, L1 + 0.75, slanted[1].z]).world
    const half = [...world.pieces.values()].find((p) => p.type === 'wall-half')!

    const ceilings = socketsOf(half, PIECES['floor-triangle'], { tier: 'wood', rotation: 0 })
    expect(ceilings).toHaveLength(2)
    const top = L1 + STOREY / 2
    for (const spec of ceilings) {
      expect(spec.y).toBeCloseTo(top - FLOOR_THICKNESS)
    }

    // The ceiling over the first triangle shares an edge with the full wall.
    const inside = ceilings.find(
      (s) => distance2([s.x, s.z], [first.piece.x, first.piece.z]) < 1e-6
    )!
    expect(inside).toBeDefined()
    const { piece } = build(world, 'floor-triangle', [inside.x, top, inside.z])
    expectSpec(piece, { x: inside.x, z: inside.z, y: top - FLOOR_THICKNESS })
    expect(solve(world, 'floor-triangle', [inside.x, top, inside.z]).stability).toBe(1)
  })
})

describe('floors', () => {
  it('rests a floor on the walls, its top flush with the wall tops', () => {
    const { piece } = build(room(), 'floor', [1.5, L2, 1.5])
    expectSpec(piece, { x: 1.5, z: 1.5, y: L2 - FLOOR_THICKNESS })
  })

  it('accepts a floor on a single wall, on either side of it', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    world = build(world, 'wall', [1.5, 2.5, 3]).world
    expectSpec(build(world, 'floor', [1.5, L2, 1.5]).piece, { z: 1.5 })
    expectSpec(build(world, 'floor', [1.5, L2, 4.5]).piece, { z: 4.5 })
  })

  it('lets floors overhang, losing stability with every tile until they cannot', () => {
    let world = build(room(), 'floor', [1.5, L2, 1.5]).world
    // The first tile east still rests on the room's east wall; the rest hang.
    const expected = [1, 0.5, 0.25, 0.125]
    for (let i = 0; i < expected.length; i++) {
      const placement = solve(world, 'floor', [4.5 + 3 * i, L2, 1.5])
      expect(placement.valid).toBe(true)
      expect(placement.stability).toBeCloseTo(expected[i])
      world = build(world, 'floor', [4.5 + 3 * i, L2, 1.5]).world
    }
    const tooFar = solve(world, 'floor', [16.5, L2, 1.5])
    expect(tooFar.problem).toBe('unstable')
  })

  it('attaches a triangle floor to a square floor on the same storey', () => {
    const world = build(room(), 'floor', [1.5, L2, 1.5]).world
    const { piece } = build(world, 'floor-triangle', [3 + TRIANGLE_INRADIUS, L2, 1.5])
    expectSpec(piece, { y: L2 - FLOOR_THICKNESS, yaw: Math.PI / 2 })
  })
})

describe('aiming', () => {
  it('builds where the cursor points on an upper storey, even from a low, oblique camera', () => {
    let world = build(room(), 'floor', [1.5, L2, 1.5]).world
    // A low camera far away: projecting this ray onto the ground plane — the
    // way the old engine aimed — would land metres away from the target.
    const eye: [number, number, number] = [40, 7, 35]
    world = build(world, 'wall', [1.5, L2 + 1.5, 0], {}, eye).world
    const upper = [...world.pieces.values()].find((p) => p.type === 'wall' && p.y === L2)!
    expectSpec(upper, { x: 1.5, z: 0, y: L2 })
  })

  it('can fill a gap in the ground storey under an existing upper storey', () => {
    let { world } = build(createWorld(), 'foundation', [1.5, 0, 1.5])
    for (const target of [
      [1.5, 2.5, 0],
      [3, 2.5, 1.5],
      [0, 2.5, 1.5],
    ] as [number, number, number][]) {
      world = build(world, 'wall', target).world
    }
    world = build(world, 'floor', [1.5, L2, 1.5]).world
    world = build(world, 'wall', [1.5, L2 + 1.5, 3]).world

    const { piece } = build(world, 'wall', [1.5, L1 + 1.5, 3])
    expectSpec(piece, { y: L1, z: 3 })
  })
})
