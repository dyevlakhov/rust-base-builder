import { describe, expect, it } from 'vitest'
import {
  PIECES,
  Piece,
  applyPatch,
  computeStability,
  createWorld,
  evaluatePlacement,
  newPieceId,
  rayBetween,
  raycast,
  setTierCommand,
  socketsOf,
  World,
} from '@/engine'

/**
 * Grow a base piece by piece through real sockets, so every step is an
 * add-only patch that the incremental stability path handles.
 */
function grow(steps: number, seed = 7): World {
  let world = createWorld([
    { id: newPieceId(), type: 'foundation', tier: 'wood', x: 1.5, y: 0, z: 1.5, yaw: 0 },
  ])
  let random = seed
  const next = () => (random = (random * 16807) % 2147483647) / 2147483647
  const types = [
    'foundation',
    'foundation-triangle',
    'wall',
    'wall-half',
    'floor',
    'floor-triangle',
  ] as const

  for (let i = 0; i < steps * 4 && world.pieces.size < steps; i++) {
    const pieces = [...world.pieces.values()]
    const source = pieces[Math.floor(next() * pieces.length)]
    const def = PIECES[types[Math.floor(next() * types.length)]]
    const sockets = socketsOf(source, def, { tier: 'wood', rotation: 0 })
    const spec = sockets[Math.floor(next() * sockets.length)]
    if (!spec || !evaluatePlacement(world, spec).valid) continue
    world = applyPatch(world, { remove: [], add: [{ ...spec, id: newPieceId() }] })
  }
  return world
}

function fullStability(world: World) {
  // A fresh world has no parent, so this takes the full search.
  return computeStability(createWorld(world.pieces.values()))
}

describe('incremental stability', () => {
  it('matches a full recompute after every add', () => {
    let world = createWorld([
      { id: newPieceId(), type: 'foundation', tier: 'wood', x: 1.5, y: 0, z: 1.5, yaw: 0 },
    ])
    computeStability(world)
    const target = grow(120)
    // Replay the same pieces one by one, computing stability at each step.
    for (const piece of [...target.pieces.values()].slice(1)) {
      world = applyPatch(world, { remove: [], add: [piece] })
      const incremental = computeStability(world)
      const full = fullStability(world)
      for (const [id, value] of full) expect(incremental.get(id), id).toBeCloseTo(value, 9)
    }
    expect(world.pieces.size).toBeGreaterThan(60)
  })

  it('keeps stability across a tier change and recomputes after a removal', () => {
    const world = grow(80, 11)
    computeStability(world)
    const ids = [...world.pieces.keys()].slice(0, 10)
    const retiered = applyPatch(world, setTierCommand(world, ids, 'armored')!)
    expect([...computeStability(retiered)]).toEqual([...computeStability(world)])

    const victim = [...world.pieces.values()].find((p: Piece) => PIECES[p.type].kind === 'wall')!
    const removed = applyPatch(world, { remove: [victim], add: [] })
    const full = fullStability(removed)
    for (const [id, value] of full) expect(computeStability(removed).get(id)).toBeCloseTo(value, 9)
  })
})

describe('decremental stability', () => {
  it('matches a full recompute after every removal', () => {
    let world = grow(120, 23)
    computeStability(world)
    let random = 9
    const next = () => (random = (random * 16807) % 2147483647) / 2147483647

    while (world.pieces.size > 1) {
      const pieces = [...world.pieces.values()]
      const victim = pieces[Math.floor(next() * pieces.length)]
      world = applyPatch(world, { remove: [victim], add: [] })
      const incremental = computeStability(world)
      const full = fullStability(world)
      expect(incremental.size).toBe(full.size)
      for (const [id, value] of full) expect(incremental.get(id), id).toBeCloseTo(value, 9)
    }
  })
})

describe('raycast broad phase', () => {
  it('finds the same first hit as testing every piece', () => {
    const world = grow(150, 3)
    let random = 5
    const next = () => (random = (random * 16807) % 2147483647) / 2147483647

    for (let i = 0; i < 300; i++) {
      const eye = [next() * 80 - 40, 2 + next() * 40, next() * 80 - 40] as const
      const target = [next() * 30 - 10, next() * 6, next() * 30 - 10] as const
      const ray = rayBetween(eye, target)

      const fast = raycast(world, ray)
      // Brute force: one world per piece, keep the nearest hit.
      let best: ReturnType<typeof raycast> = null
      for (const piece of world.pieces.values()) {
        const hit = raycast(createWorld([piece]), ray)
        if (hit && hit.pieceId && (!best || hit.t < best.t)) best = hit
      }
      if (best) {
        // Pieces sharing a face are hit at the same distance; either is right.
        expect(fast?.pieceId).toBeTruthy()
        expect(fast!.t).toBeCloseTo(best.t, 6)
      } else {
        expect(fast?.pieceId ?? null).toBeNull()
      }
    }
  })
})
