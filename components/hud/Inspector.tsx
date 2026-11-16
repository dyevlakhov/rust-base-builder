'use client'

import { ArrowUpCircle, Trash2, X } from 'lucide-react'
import {
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
import { PieceIcon, ResourceIcon } from '@/components/icons/PieceIcon'
import { costEntries } from '@/utils/resources'
import { StabilityGauge } from './Hotbar'

/** The selected piece: what it is, how sturdy it is, what it costs, and what to do with it. */
export function Inspector() {
  const selectedId = useToolStore((state) => state.selectedId)
  const select = useToolStore((state) => state.select)
  const world = useDesignStore((state) => state.world)
  const piece = selectedId ? world.pieces.get(selectedId) : undefined
  if (!piece) return null

  const def = PIECES[piece.type]
  const stability = computeStability(world).get(piece.id) ?? 0
  const upgradeTo = nextTier(piece.tier)
  const health = pieceHealth(piece.type, piece.tier)
  const maxHealth = TIER_INFO.armored.health

  return (
    <aside
      className="hud-panel pointer-events-auto absolute top-16 right-3 w-72 p-3"
      aria-label="Selected piece"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[3px] border border-edge bg-slot text-ink">
          <PieceIcon type={piece.type} size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl leading-tight font-semibold text-ink">
            {def.label}
          </h2>
          <p className="text-sm text-mute">{TIER_INFO[piece.tier].label}</p>
        </div>
        <button
          onClick={() => select(null)}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-[3px] text-mute hover:bg-ink/10 hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Health</dt>
          <dd className="flex items-center gap-2">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-ink/12">
              <span
                className="block h-full bg-moss"
                style={{ width: `${(health / maxHealth) * 100}%` }}
              />
            </span>
            <span className="w-12 text-right text-ink">{health.toLocaleString()}</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Stability</dt>
          <dd className="flex items-center gap-2">
            <StabilityGauge value={stability} />
            <span className="w-12 text-right text-ink">{Math.round(stability * 100)}%</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Cost</dt>
          <dd className="flex items-center gap-3 text-ink">
            {costEntries(pieceCost(piece.type, piece.tier)).map(({ key, amount, name }) => (
              <span key={key} className="flex items-center gap-1" title={name}>
                <ResourceIcon resource={key} size={15} className="text-mute" />
                {amount}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-5 gap-1" role="radiogroup" aria-label="Tier">
        {TIERS.map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={piece.tier === t}
            onClick={() => useDesignStore.getState().setTier(piece.id, t)}
            title={TIER_INFO[t].label}
            aria-label={TIER_INFO[t].label}
            className={`h-8 rounded-[3px] border bg-cover transition-transform duration-100 active:scale-95 ${
              piece.tier === t ? 'border-signal' : 'border-black/40 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundImage: `url(/textures/${t}/swatch.jpg)` }}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => useDesignStore.getState().upgrade(piece.id)}
          disabled={!upgradeTo}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[3px] bg-signal text-sm font-semibold text-panel transition-colors hover:bg-signal/90 disabled:bg-slot disabled:text-mute"
        >
          <ArrowUpCircle size={16} />
          {upgradeTo ? `Upgrade to ${TIER_INFO[upgradeTo].label}` : 'Fully upgraded'}
          <kbd className="font-display opacity-70">U</kbd>
        </button>
        <button
          onClick={() => requestDemolish(piece.id)}
          aria-label="Demolish (Delete)"
          title="Demolish (Delete)"
          className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-oxide/50 text-oxide transition-colors hover:bg-oxide hover:text-ink"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </aside>
  )
}
