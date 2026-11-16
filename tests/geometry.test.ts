import { describe, expect, it } from 'vitest'
import {
  CELL,
  PIECES,
  TRIANGLE_INRADIUS,
  collisionFootprint,
  deckEdges,
  distance2,
  footprint,
  normalizeAngle,
  polygonsOverlap,
} from '@/engine'

const at = (type: 'foundation' | 'foundation-triangle', yaw = 0) => ({
  type,
  tier: 'wood' as const,
  x: 0,
  y: 0,
  z: 0,
  yaw,
})

describe('piece geometry', () => {
  it('makes triangles equilateral with 3 m sides, as in the game', () => {
    const poly = footprint(at('foundation-triangle', 0.7))
    for (let i = 0; i < 3; i++) {
      expect(distance2(poly[i], poly[(i + 1) % 3])).toBeCloseTo(CELL, 6)
    }
  })

  it('puts every deck edge midpoint one inradius from the centre', () => {
    for (const edge of deckEdges(at('foundation-triangle'))) {
      expect(Math.hypot(...edge.mid)).toBeCloseTo(TRIANGLE_INRADIUS, 6)
    }
    for (const edge of deckEdges(at('foundation'))) {
      expect(Math.hypot(...edge.mid)).toBeCloseTo(CELL / 2, 6)
    }
  })

  it('points edge normals outwards', () => {
    for (const edge of deckEdges(at('foundation-triangle', 1.1))) {
      const [x, z] = edge.mid
      expect(Math.sin(edge.normal) * x + Math.cos(edge.normal) * z).toBeGreaterThan(0)
    }
  })

  it('reports deck edges at the top surface', () => {
    for (const edge of deckEdges(at('foundation'))) {
      expect(edge.y).toBe(PIECES.foundation.height)
    }
  })

  it('does not count pieces touching along an edge as overlapping', () => {
    const a = collisionFootprint(at('foundation'))
    const b = collisionFootprint({ ...at('foundation'), x: CELL })
    expect(polygonsOverlap(a, b)).toBe(false)
    expect(polygonsOverlap(a, collisionFootprint({ ...at('foundation'), x: 1 }))).toBe(true)
  })

  it('normalises angles into (−π, π]', () => {
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI)
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI)
    expect(normalizeAngle(Math.PI / 2 + 4 * Math.PI)).toBeCloseTo(Math.PI / 2)
  })
})
