import { expect } from 'vitest'
import {
  Piece,
  PieceSpec,
  PieceType,
  Placement,
  Ray,
  Tool,
  Vec3,
  World,
  applyPatch,
  createWorld,
  newPieceId,
  placeCommand,
  rayBetween,
  solvePlacement,
} from '@/engine'

export function tool(type: PieceType, extra: Partial<Tool> = {}): Tool {
  return { type, tier: 'wood', rotation: 0, snap: true, ...extra }
}

/** A cursor ray looking at `target` from a typical three-quarter camera. */
export function aimAt(
  target: Vec3,
  eye: Vec3 = [target[0] + 7, target[1] + 9, target[2] + 11]
): Ray {
  return rayBetween(eye, target)
}

export function solve(
  world: World,
  type: PieceType,
  target: Vec3,
  extra: Partial<Tool> = {},
  eye?: Vec3
): Placement {
  const placement = solvePlacement(world, aimAt(target, eye), tool(type, extra))
  expect(placement).not.toBeNull()
  return placement!
}

/** Aim, solve and build; fails the test if the placement is not valid. */
export function build(
  world: World,
  type: PieceType,
  target: Vec3,
  extra: Partial<Tool> = {},
  eye?: Vec3
): { world: World; piece: Piece } {
  const placement = solve(world, type, target, extra, eye)
  expect(placement.problem).toBeNull()
  const patch = placeCommand(world, placement.spec)
  expect(patch).not.toBeNull()
  return { world: applyPatch(world, patch!), piece: patch!.add[0] }
}

export function worldOf(...specs: PieceSpec[]): World {
  return createWorld(specs.map((spec) => ({ ...spec, id: newPieceId() })))
}

export function expectSpec(actual: PieceSpec, expected: Partial<PieceSpec>) {
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === 'number') {
      expect(actual[key as keyof PieceSpec], key).toBeCloseTo(value, 4)
    } else {
      expect(actual[key as keyof PieceSpec], key).toBe(value)
    }
  }
}

/** A 1×1 room: foundation at (1.5, 1.5) and four walls. */
export function room(): World {
  let world = build(createWorld(), 'foundation', [1.5, 0, 1.5]).world
  for (const target of [
    [1.5, 2.5, 0],
    [3, 2.5, 1.5],
    [1.5, 2.5, 3],
    [0, 2.5, 1.5],
  ] as Vec3[]) {
    world = build(world, 'wall', target).world
  }
  return world
}
