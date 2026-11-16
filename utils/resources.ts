import { Piece, ResourceCost, pieceCost } from '@/engine'

export const RESOURCE_LABELS: Record<keyof ResourceCost, { short: string; name: string }> = {
  wood: { short: 'Wood', name: 'Wood' },
  stone: { short: 'Stone', name: 'Stone' },
  metalFragments: { short: 'Frags', name: 'Metal Fragments' },
  hqm: { short: 'HQM', name: 'High Quality Metal' },
}

const RESOURCE_KEYS = Object.keys(RESOURCE_LABELS) as (keyof ResourceCost)[]

/** One line, e.g. "200 Metal Fragments". */
export function formatCost(cost: ResourceCost): string {
  return RESOURCE_KEYS.filter((key) => cost[key])
    .map((key) => `${cost[key]} ${key === 'hqm' ? 'HQM' : RESOURCE_LABELS[key].name}`)
    .join(' + ')
}

export function getTotalCost(pieces: Iterable<Piece>): ResourceCost {
  const total: ResourceCost = {}
  for (const piece of pieces) {
    const cost = pieceCost(piece.type, piece.tier)
    for (const key of RESOURCE_KEYS) {
      const amount = cost[key]
      if (amount) total[key] = (total[key] ?? 0) + amount
    }
  }
  return total
}

export function costEntries(cost: ResourceCost) {
  return RESOURCE_KEYS.filter((key) => cost[key]).map((key) => ({
    key,
    amount: cost[key]!,
    ...RESOURCE_LABELS[key],
  }))
}
