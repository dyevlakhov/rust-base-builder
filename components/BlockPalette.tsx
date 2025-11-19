'use client'

import { BLOCK_TEMPLATES, TIER_PROPERTIES, BuildingTier } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { BlockIcon, CategoryIcon } from './BlockIcon'

export function BlockPalette() {
  const setPlacementMode = useBuilderStore(state => state.setPlacementMode)
  const placementMode = useBuilderStore(state => state.placementMode)
  const snapToGrid = useBuilderStore(state => state.snapToGrid)
  const toggleSnapToGrid = useBuilderStore(state => state.toggleSnapToGrid)
  const currentTier = useBuilderStore(state => state.currentTier)
  const setCurrentTier = useBuilderStore(state => state.setCurrentTier)

  const [expandedCategory, setExpandedCategory] = useState<string>('foundation')

  const categories = [
    { key: 'foundation', label: 'Foundations' },
    { key: 'wall', label: 'Walls' },
    { key: 'floor', label: 'Floors' },
  ] as const

  return (
    <aside className="!w-64 !min-w-[256px] !max-w-[256px] glass-light float-sm border-r border-white/10 overflow-y-auto flex flex-col h-full">
      <div className="p-4 sticky top-0 glass border-b border-white/10 z-10">
        <h2 className="text-sm font-semibold mb-3 text-white">Blocks</h2>

        {/* Building Tier Selector */}
        <div className="mb-3">
          <div className="grid grid-cols-5 gap-1.5">
            {(Object.keys(TIER_PROPERTIES) as BuildingTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setCurrentTier(tier)}
                className={`p-2 rounded-lg text-[10px] font-bold transition-all hover:scale-110 ${
                  currentTier === tier
                    ? 'ring-2 ring-white/50 scale-110 shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: TIER_PROPERTIES[tier].color }}
                title={`${TIER_PROPERTIES[tier].label}`}
              >
                {TIER_PROPERTIES[tier].label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Snap to Grid Toggle */}
        <div className="p-2 glass rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={toggleSnapToGrid}
              className="w-3.5 h-3.5 mr-2 rounded accent-orange-500"
            />
            <span className="text-xs text-white/90">Snap Grid</span>
          </label>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {categories.map((category) => {
          const categoryBlocks = BLOCK_TEMPLATES.filter(t => t.category === category.key)
          const isExpanded = expandedCategory === category.key
          
          if (categoryBlocks.length === 0) return null
          
          return (
            <div key={category.key} className="mb-3">
              <button
                onClick={() => setExpandedCategory(isExpanded ? '' : category.key)}
                className="w-full p-2.5 glass-light hover:bg-white/10 flex items-center justify-between rounded-xl transition-all"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon category={category.key} size={18} className="text-white/90" />
                  <span className="font-medium text-white text-xs">{category.label}</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isExpanded && (
                <div className="mt-2 grid grid-cols-4 gap-2 p-2 glass-light rounded-xl">
                  {categoryBlocks.map((template) => (
                    <button
                      key={template.type}
                      onClick={() => setPlacementMode(template.type)}
                      className={`p-2.5 rounded-xl transition-all relative group hover:scale-110 flex items-center justify-center ${
                        placementMode === template.type
                          ? 'bg-orange-500/80 ring-2 ring-orange-400/50 scale-110 shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                      title={template.label}
                    >
                      <BlockIcon type={template.type} size={24} className={placementMode === template.type ? 'text-white' : 'text-white/80'} />
                      {placementMode === template.type && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="p-4 sticky bottom-0 glass border-t border-white/10">
        {placementMode && (
          <div className="p-3 bg-orange-500/80 border border-orange-400/50 rounded-xl shadow-lg">
            <div className="text-xs text-white font-semibold mb-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse"></div>
              Placing
            </div>
            <button
              onClick={() => setPlacementMode(null)}
              className="w-full px-3 py-1.5 glass-light hover:bg-white/20 rounded-lg text-[10px] text-white transition-all"
            >
              Cancel (ESC)
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
