'use client'

import { PIECES, PlacementProblem, TIERS, TIER_INFO, pieceCost } from '@/engine'
import { useToolStore } from '@/store/useToolStore'
import { PieceIcon, ResourceIcon } from '@/components/icons/PieceIcon'
import { costEntries } from '@/utils/resources'
import { HOTBAR } from './keys'

/** Where the hotbar puts a little more space: between foundations, walls and floors. */
const GROUP_BREAKS = new Set(['foundation-triangle', 'wall-low'])

const PROBLEM_TEXT: Record<PlacementProblem, string> = {
  collision: 'Something is already there',
  unsupported: 'Needs something to attach to',
  unstable: 'Too far from support',
}

/** Ten-segment gauge: the stability the ghost would be built at. */
export function StabilityGauge({ value, className = '' }: { value: number; className?: string }) {
  const lit = Math.round(value * 10)
  const colour = value >= 0.6 ? 'bg-moss' : value >= 0.3 ? 'bg-signal' : 'bg-oxide'
  return (
    <div
      className={`flex gap-[2px] ${className}`}
      role="meter"
      aria-label="Stability"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`h-2 w-1.5 rounded-[1px] ${i < lit ? colour : 'bg-ink/12'}`} />
      ))}
    </div>
  )
}

/** What the ghost is doing, right above the hotbar where the eye already is. */
function PlacementLine() {
  const activeType = useToolStore((state) => state.activeType)
  const tier = useToolStore((state) => state.tier)
  const ghost = useToolStore((state) => state.ghost)
  if (!activeType) return null

  const def = PIECES[activeType]
  const cost = costEntries(pieceCost(activeType, tier))

  return (
    <div className="hud-panel flex items-center gap-4 px-3 py-2 text-sm">
      <span className="font-display text-lg leading-none font-semibold tracking-wide text-ink">
        {def.label}
      </span>
      <span className="flex items-center gap-2 text-mute">
        {cost.map(({ key, amount, name }) => (
          <span key={key} className="flex items-center gap-1" title={name}>
            <ResourceIcon resource={key} size={15} />
            {amount}
          </span>
        ))}
      </span>
      <span className="h-4 w-px bg-ink/15" />
      {ghost ? (
        <span className="flex items-center gap-2">
          <span className={ghost.valid ? 'text-sky' : 'text-oxide'}>
            {ghost.valid ? 'Click to build' : PROBLEM_TEXT[ghost.problem!]}
          </span>
          {ghost.stability > 0 && <StabilityGauge value={ghost.stability} />}
        </span>
      ) : (
        <span className="text-mute">Point at the ground or a piece</span>
      )}
      <span className="text-mute">
        <kbd className="font-display text-ink">R</kbd> {def.kind === 'wall' ? 'flip' : 'rotate'}
      </span>
    </div>
  )
}

/**
 * Material chips that show the actual surface of each tier, so picking stone
 * means looking at stone rather than reading the word.
 */
function TierStrip() {
  const tier = useToolStore((state) => state.tier)
  const setTier = useToolStore((state) => state.setTier)

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Building tier">
        {TIERS.map((t) => {
          const active = tier === t
          const info = TIER_INFO[t]
          return (
            <button
              key={t}
              role="radio"
              aria-checked={active}
              onClick={() => setTier(t)}
              title={`${info.label}, ${info.health} HP`}
              className={`relative h-7 w-[4.5rem] overflow-hidden rounded-[3px] border text-left transition-transform duration-100 active:scale-95 ${
                active ? 'border-signal' : 'border-black/40 opacity-75 hover:opacity-100'
              }`}
              style={{
                backgroundImage: `linear-gradient(to right, rgb(20 21 18 / 0.85), rgb(20 21 18 / 0.15)), url(/textures/${t}/swatch.jpg)`,
                backgroundSize: 'cover',
              }}
            >
              <span className="relative pl-2 font-display text-sm font-semibold text-ink">
                {info.label === 'Sheet Metal' ? 'Metal' : info.label}
              </span>
            </button>
          )
        })}
      </div>
      <kbd className="ml-1 font-display text-sm text-mute" title="T cycles tiers">
        T
      </kbd>
      <GridToggle />
    </div>
  )
}

/** Whether a foundation placed on its own lands on the 3 m world grid. */
function GridToggle() {
  const snap = useToolStore((state) => state.snap)
  const toggleSnap = useToolStore((state) => state.toggleSnap)
  return (
    <button
      onClick={toggleSnap}
      aria-pressed={snap}
      title="Lone foundations snap to the 3 m grid (G)"
      className={`ml-auto flex h-7 items-center gap-1.5 rounded-[3px] border px-2 text-sm transition-colors ${
        snap ? 'border-signal/60 text-ink' : 'border-edge text-mute hover:text-ink'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${snap ? 'bg-signal' : 'bg-ink/20'}`} />
      Grid
      <kbd className="font-display text-mute">G</kbd>
    </button>
  )
}

export function Hotbar() {
  const activeType = useToolStore((state) => state.activeType)
  const setActiveType = useToolStore((state) => state.setActiveType)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
      <div className="pointer-events-auto">
        <PlacementLine />
      </div>

      <div className="hud-panel pointer-events-auto flex max-w-full flex-col gap-2 p-2">
        <TierStrip />
        <div className="flex gap-1 overflow-x-auto" role="toolbar" aria-label="Building pieces">
          {HOTBAR.map(({ type, key }) => {
            const active = activeType === type
            const def = PIECES[type]
            return (
              <div key={type} className={`flex ${GROUP_BREAKS.has(type) ? 'mr-2' : ''}`}>
                <button
                  onClick={() => setActiveType(active ? null : type)}
                  aria-pressed={active}
                  aria-label={`${def.label} (${key})`}
                  title={def.description}
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border transition-[transform,background-color] duration-100 active:scale-95 ${
                    active
                      ? 'border-signal bg-signal/12 text-signal'
                      : 'border-edge bg-slot text-ink/85 hover:bg-edge hover:text-ink'
                  }`}
                >
                  <span className="absolute top-0.5 left-1 font-stencil text-xs leading-none text-mute">
                    {key}
                  </span>
                  <PieceIcon type={type} size={30} />
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-signal" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
