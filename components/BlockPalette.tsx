'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PIECES, PIECE_ORDER, PieceKind, TIERS, TIER_INFO, pieceCost } from '@/engine'
import { useToolStore } from '@/store/useToolStore'
import { formatCost } from '@/utils/resources'
import { BlockIcon, CategoryIcon } from './BlockIcon'

const KINDS: { kind: PieceKind; label: string }[] = [
  { kind: 'foundation', label: 'Foundations' },
  { kind: 'wall', label: 'Walls' },
  { kind: 'floor', label: 'Floors' },
]

/** Swatch colours for the tier buttons — flat UI colours, not the 3D materials. */
const TIER_SWATCH: Record<(typeof TIERS)[number], string> = {
  twig: '#a1865f',
  wood: '#7a5638',
  stone: '#77746e',
  metal: '#8a5a3c',
  armored: '#4a535a',
}

export function BlockPalette() {
  const activeType = useToolStore((state) => state.activeType)
  const setActiveType = useToolStore((state) => state.setActiveType)
  const snap = useToolStore((state) => state.snap)
  const toggleSnap = useToolStore((state) => state.toggleSnap)
  const tier = useToolStore((state) => state.tier)
  const setTier = useToolStore((state) => state.setTier)

  const [openKind, setOpenKind] = useState<PieceKind | null>('foundation')

  return (
    <aside className="glass-light float-sm flex h-full w-64 shrink-0 flex-col border-r border-white/10">
      <div className="glass sticky top-0 z-10 border-b border-white/10 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Building tier</h2>

        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {TIERS.map((t) => {
            const info = TIER_INFO[t]
            return (
              <button
                key={t}
                onClick={() => setTier(t)}
                aria-pressed={tier === t}
                title={`${info.label} — ${info.health} HP — ${formatCost(info.cost)}`}
                style={{ backgroundColor: TIER_SWATCH[t] }}
                className={`rounded-lg p-2 text-[10px] font-bold text-white transition-transform ${
                  tier === t
                    ? 'scale-110 shadow-lg ring-2 ring-white/60'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {info.label.slice(0, 3)}
              </button>
            )
          })}
        </div>

        <label
          className="glass flex cursor-pointer items-center rounded-lg p-2"
          title="Free-standing foundations snap to the 3 m world grid"
        >
          <input
            type="checkbox"
            checked={snap}
            onChange={toggleSnap}
            className="mr-2 h-3.5 w-3.5 rounded accent-orange-500"
          />
          <span className="text-xs text-white/90">Snap to grid</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {KINDS.map(({ kind, label }) => {
          const types = PIECE_ORDER.filter((type) => PIECES[type].kind === kind)
          const isOpen = openKind === kind

          return (
            <div key={kind} className="mb-3">
              <button
                onClick={() => setOpenKind(isOpen ? null : kind)}
                aria-expanded={isOpen}
                className="glass-light flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <CategoryIcon kind={kind} size={18} className="text-white/90" />
                  <span className="text-xs font-medium text-white">{label}</span>
                </span>
                <ChevronDown
                  size={14}
                  className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <ul className="mt-2 space-y-1">
                  {types.map((type) => {
                    const def = PIECES[type]
                    const isActive = activeType === type
                    return (
                      <li key={type}>
                        <button
                          onClick={() => setActiveType(isActive ? null : type)}
                          aria-pressed={isActive}
                          title={`${def.description} — ${formatCost(pieceCost(type, tier))}`}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-orange-500/80 text-white ring-1 ring-orange-300/50'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <BlockIcon type={type} size={18} className="shrink-0" />
                          <span className="truncate text-xs">{def.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {activeType && (
        <div className="glass border-t border-white/10 p-4">
          <div className="rounded-xl border border-orange-400/50 bg-orange-500/80 p-3 shadow-lg">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-200" />
              Placing {PIECES[activeType].label}
            </div>
            <p className="mb-2 text-[11px] text-white/80">
              Snaps to the nearest socket. R{' '}
              {PIECES[activeType].kind === 'wall' ? 'flips' : 'rotates'}.
            </p>
            <button
              onClick={() => setActiveType(null)}
              className="glass-light w-full rounded-lg px-3 py-1.5 text-[11px] text-white transition-colors hover:bg-white/20"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
