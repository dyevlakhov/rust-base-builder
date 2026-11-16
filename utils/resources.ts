import { Piece, ResourceCost, pieceCost } from '@/engine'

export const RESOURCE_LABELS: Record<keyof ResourceCost, { name: string }> = {
  wood: { name: 'Wood' },
  stone: { name: 'Stone' },
  metalFragments: { name: 'Metal Fragments' },
  hqm: { name: 'High Quality Metal' },
}

const RESOURCE_KEYS = Object.keys(RESOURCE_LABELS) as (keyof ResourceCost)[]

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
