import { BuildingBlock, ResourceCost, TIER_PROPERTIES } from '@/types/building-blocks'

export const RESOURCE_LABELS: Record<keyof ResourceCost, { icon: string; name: string }> = {
  wood: { icon: '🪵', name: 'Wood' },
  stone: { icon: '🪨', name: 'Stone' },
  metalFragments: { icon: '⚙️', name: 'Metal Fragments' },
  hqm: { icon: '💎', name: 'High Quality Metal' },
  gears: { icon: '🔩', name: 'Gears' },
}

const RESOURCE_KEYS = Object.keys(RESOURCE_LABELS) as (keyof ResourceCost)[]

/** Human readable one-line cost, e.g. "200 Metal Fragments + 25 HQM". */
export function formatCost(cost: ResourceCost): string {
  const parts = RESOURCE_KEYS.filter((key) => cost[key]).map((key) => {
    const label = key === 'hqm' ? 'HQM' : RESOURCE_LABELS[key].name
    return `${cost[key]} ${label}`
  })
  return parts.join(' + ')
}

/** Sum the per-piece tier cost across every placed block. */
export function getTotalCost(blocks: BuildingBlock[]): ResourceCost {
  const total: ResourceCost = {}

  for (const block of blocks) {
    const cost = TIER_PROPERTIES[block.tier].cost
    for (const key of RESOURCE_KEYS) {
      const amount = cost[key]
      if (amount) total[key] = (total[key] ?? 0) + amount
    }
  }

  return total
}

/** Non-zero entries of a cost, ready for rendering. */
export function costEntries(
  cost: ResourceCost
): { key: keyof ResourceCost; amount: number; icon: string; name: string }[] {
  return RESOURCE_KEYS.filter((key) => cost[key]).map((key) => ({
    key,
    amount: cost[key]!,
    ...RESOURCE_LABELS[key],
  }))
}
