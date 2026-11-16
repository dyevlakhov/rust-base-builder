'use client'

import { ArrowUp, Trash, X } from 'lucide-react'
import {
  MIN_STABILITY,
  PIECES,
  TIERS,
  TIER_INFO,
  computeStability,
  nextTier,
  pieceCost,
  pieceHealth,
} from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { requestDemolish } from '@/hooks/useAppShortcuts'
import { formatCost } from '@/utils/resources'
import { BlockIcon } from './BlockIcon'

function stabilityColour(value: number): string {
  if (value >= 0.6) return 'text-green-400'
  if (value >= 0.3) return 'text-yellow-400'
  if (value >= MIN_STABILITY) return 'text-orange-400'
  return 'text-red-400'
}

export function BlockDetailsPanel() {
  const selectedId = useToolStore((state) => state.selectedId)
  const select = useToolStore((state) => state.select)
  const world = useDesignStore((state) => state.world)
  const setTier = useDesignStore((state) => state.setTier)
  const upgrade = useDesignStore((state) => state.upgrade)

  const piece = selectedId ? world.pieces.get(selectedId) : undefined

  if (!piece) {
    return (
      <div className="glass-light float-sm flex h-full w-80 shrink-0 items-center justify-center border-l border-white/10">
        <p className="p-8 text-center text-sm text-white/50">
          Select a building piece to inspect it
        </p>
      </div>
    )
  }

  const def = PIECES[piece.type]
  const tierInfo = TIER_INFO[piece.tier]
  const stability = computeStability(world).get(piece.id) ?? 0
  const canUpgrade = nextTier(piece.tier) !== null

  return (
    <div className="glass-light float-sm flex h-full w-80 shrink-0 flex-col border-l border-white/10 text-white">
      <div className="glass flex shrink-0 items-center justify-between border-b border-white/10 p-4">
        <h2 className="text-base font-semibold">Building piece</h2>
        <div className="flex gap-1.5">
          {canUpgrade && (
            <button
              onClick={() => upgrade(piece.id)}
              title="Upgrade to the next tier"
              className="rounded-lg p-2 text-green-400 transition-colors hover:bg-white/10"
            >
              <ArrowUp size={16} />
            </button>
          )}
          <button
            onClick={() => requestDemolish(piece.id)}
            title="Demolish"
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-white/10"
          >
            <Trash size={16} />
          </button>
          <button
            onClick={() => select(null)}
            title="Close"
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <section className="glass rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <BlockIcon type={piece.type} size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold">{def.label}</div>
              <div className="mb-2 text-xs text-white/60">{def.description}</div>
              <span className="inline-block rounded-lg bg-white/15 px-2 py-1 text-xs font-bold">
                {tierInfo.label}
              </span>
            </div>
          </div>
        </section>

        <section className="glass rounded-xl p-4">
          <h3 className="mb-3 text-sm font-medium text-white/90">Stats</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-white/70">Health</dt>
              <dd className="font-mono text-green-400">
                {pieceHealth(piece.type, piece.tier).toLocaleString()} HP
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">Stability</dt>
              <dd className={`font-mono ${stabilityColour(stability)}`}>
                {Math.round(stability * 100)}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">Cost</dt>
              <dd className="font-mono text-yellow-400">
                {formatCost(pieceCost(piece.type, piece.tier))}
              </dd>
            </div>
          </dl>
        </section>

        <section className="glass rounded-xl p-4">
          <h3 className="mb-3 text-sm font-medium text-white/90">Tier</h3>
          <div className="grid grid-cols-5 gap-2">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTier(piece.id, t)}
                aria-pressed={piece.tier === t}
                title={`${TIER_INFO[t].label} — ${formatCost(pieceCost(piece.type, t))}`}
                className={`rounded-xl p-2.5 text-xs font-bold transition-colors ${
                  piece.tier === t
                    ? 'bg-orange-500/80 ring-2 ring-white/60'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {TIER_INFO[t].label.slice(0, 4)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
