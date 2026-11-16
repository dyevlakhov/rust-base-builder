'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useDesignStore, piecesOf } from '@/store/useDesignStore'
import { useHydrated } from '@/hooks/useHydrated'
import { ResourceIcon } from '@/components/icons/PieceIcon'
import { RESOURCE_LABELS, costEntries, getTotalCost } from '@/utils/resources'

/**
 * What the whole base costs to build. With nothing built yet it says how to
 * start instead, since an empty sheet is the first thing a new visitor sees.
 */
export function BaseSheet() {
  const world = useDesignStore((state) => state.world)
  const hydrated = useHydrated()
  const [open, setOpen] = useState(true)

  const pieces = hydrated ? piecesOf(world) : []
  const totals = costEntries(getTotalCost(pieces))

  if (pieces.length === 0) {
    return (
      <div className="hud-panel pointer-events-auto absolute top-16 left-3 w-64 p-3 text-sm">
        <h2 className="font-display text-lg leading-tight font-semibold text-ink">
          Start with a foundation
        </h2>
        <p className="mt-1 text-mute">
          Press <kbd className="font-display text-ink">1</kbd> and click the ground. Every other
          piece snaps onto what is already built.
        </p>
      </div>
    )
  }

  return (
    <section
      className="hud-panel pointer-events-auto absolute top-16 left-3 w-56"
      aria-label="Build cost"
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <h2 className="font-display text-lg leading-none font-semibold text-ink">Build cost</h2>
        <ChevronDown
          size={16}
          className={`text-mute transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <ul className="space-y-1.5 px-3 pb-3">
          {totals.map(({ key, amount }) => (
            <li key={key} className="flex items-center gap-2 text-sm">
              <ResourceIcon resource={key} size={18} className="text-mute" />
              <span className="flex-1 text-ink/80">{RESOURCE_LABELS[key].name}</span>
              <span className="font-display text-lg leading-none font-semibold text-ink">
                {amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
