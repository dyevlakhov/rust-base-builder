'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  BLOCK_TEMPLATES,
  BlockCategory,
  TIER_ORDER,
  TIER_PROPERTIES,
} from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { formatCost } from '@/utils/resources'
import { BlockIcon, CategoryIcon } from './BlockIcon'

const CATEGORIES: { key: BlockCategory; label: string }[] = [
  { key: 'foundation', label: 'Foundations' },
  { key: 'wall', label: 'Walls' },
  { key: 'floor', label: 'Floors' },
]

export function BlockPalette() {
  const setPlacementMode = useBuilderStore((state) => state.setPlacementMode)
  const placementMode = useBuilderStore((state) => state.placementMode)
  const snapToGrid = useBuilderStore((state) => state.snapToGrid)
  const toggleSnapToGrid = useBuilderStore((state) => state.toggleSnapToGrid)
  const currentTier = useBuilderStore((state) => state.currentTier)
  const setCurrentTier = useBuilderStore((state) => state.setCurrentTier)

  const [openCategory, setOpenCategory] = useState<BlockCategory | null>('foundation')

  return (
    <aside className="glass-light float-sm flex h-full w-64 shrink-0 flex-col border-r border-white/10">
      <div className="glass sticky top-0 z-10 border-b border-white/10 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Building tier</h2>

        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {TIER_ORDER.map((tier) => {
            const props = TIER_PROPERTIES[tier]
            return (
              <button
                key={tier}
                onClick={() => setCurrentTier(tier)}
                aria-pressed={currentTier === tier}
                title={`${props.label} — ${props.health} HP — ${formatCost(props.cost)}`}
                style={{ backgroundColor: props.color }}
                className={`rounded-lg p-2 text-[10px] font-bold text-white transition-transform ${
                  currentTier === tier
                    ? 'scale-110 shadow-lg ring-2 ring-white/60'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {props.label.slice(0, 3)}
              </button>
            )
          })}
        </div>

        <label className="glass flex cursor-pointer items-center rounded-lg p-2">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={toggleSnapToGrid}
            className="mr-2 h-3.5 w-3.5 rounded accent-orange-500"
          />
          <span className="text-xs text-white/90">Snap to grid</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {CATEGORIES.map(({ key, label }) => {
          const templates = BLOCK_TEMPLATES.filter((template) => template.category === key)
          const isOpen = openCategory === key

          return (
            <div key={key} className="mb-3">
              <button
                onClick={() => setOpenCategory(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="glass-light flex w-full items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <CategoryIcon category={key} size={18} className="text-white/90" />
                  <span className="text-xs font-medium text-white">{label}</span>
                </span>
                <ChevronDown
                  size={14}
                  className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <ul className="mt-2 space-y-1">
                  {templates.map((template) => {
                    const isActive = placementMode === template.type
                    return (
                      <li key={template.type}>
                        <button
                          onClick={() => setPlacementMode(isActive ? null : template.type)}
                          aria-pressed={isActive}
                          title={template.description}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-orange-500/80 text-white ring-1 ring-orange-300/50'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <BlockIcon type={template.type} size={18} className="shrink-0" />
                          <span className="truncate text-xs">{template.label}</span>
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

      {placementMode && (
        <div className="glass border-t border-white/10 p-4">
          <div className="rounded-xl border border-orange-400/50 bg-orange-500/80 p-3 shadow-lg">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-200" />
              Placing
            </div>
            <button
              onClick={() => setPlacementMode(null)}
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
