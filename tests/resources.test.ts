import { describe, expect, it } from 'vitest'
import { BuildingBlock, BuildingTier, TIER_PROPERTIES } from '@/types/building-blocks'
import { costEntries, formatCost, getTotalCost } from '@/utils/resources'

let counter = 0
const piece = (tier: BuildingTier): BuildingBlock => ({
  id: `p${counter++}`,
  type: 'foundation-square',
  position: [0, 0.15, 0],
  rotation: [0, 0, 0],
  scale: [3, 0.3, 3],
  tier,
  health: TIER_PROPERTIES[tier].health,
  maxHealth: TIER_PROPERTIES[tier].health,
})

describe('formatCost', () => {
  it('renders a single resource', () => {
    expect(formatCost({ wood: 300 })).toBe('300 Wood')
  })

  it('renders several resources in a stable order', () => {
    expect(formatCost({ metalFragments: 200, hqm: 25 })).toBe('200 Metal Fragments + 25 HQM')
    expect(formatCost({ hqm: 25, gears: 5 })).toBe('25 HQM + 5 Gears')
  })

  it('renders an empty cost as an empty string', () => {
    expect(formatCost({})).toBe('')
  })
})

describe('getTotalCost', () => {
  it('returns nothing for an empty base', () => {
    expect(getTotalCost([])).toEqual({})
  })

  it('adds up pieces of the same tier', () => {
    expect(getTotalCost([piece('wood'), piece('wood')])).toEqual({ wood: 600 })
  })

  it('adds up pieces across tiers', () => {
    // Wood 300 + twig 100, stone 300, metal 200 frags + 25 HQM, armored 25 HQM + 5 gears.
    expect(getTotalCost([piece('wood'), piece('twig'), piece('stone')])).toEqual({
      wood: 400,
      stone: 300,
    })

    expect(getTotalCost([piece('metal'), piece('armored')])).toEqual({
      metalFragments: 200,
      hqm: 50,
      gears: 5,
    })
  })

  it('counts gears, which the old per-tier switch dropped', () => {
    expect(getTotalCost([piece('armored')]).gears).toBe(5)
  })
})

describe('costEntries', () => {
  it('lists only the resources actually needed', () => {
    const entries = costEntries({ wood: 300, hqm: 0 })
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ key: 'wood', amount: 300 })
    expect(entries[0].icon).toBeTruthy()
  })

  it('agrees with the per-piece cost string', () => {
    // Both read TIER_PROPERTIES, so a tier can never show one price and bill another.
    for (const tier of Object.keys(TIER_PROPERTIES) as BuildingTier[]) {
      const cost = TIER_PROPERTIES[tier].cost
      const total = getTotalCost([piece(tier)])
      expect(total).toEqual(cost)
      expect(formatCost(total)).toBe(formatCost(cost))
    }
  })
})
