'use client'

import { X, Trash, Copy, ArrowUp } from 'lucide-react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { BLOCK_TEMPLATES, TIER_PROPERTIES, BuildingTier } from '@/types/building-blocks'
import { BlockIcon } from './BlockIcon'

export function BlockDetailsPanel() {
  const blocks = useBuilderStore(state => state.blocks)
  const selectedBlockId = useBuilderStore(state => state.selectedBlockId)
  const setSelectedBlock = useBuilderStore(state => state.setSelectedBlock)
  const updateBlock = useBuilderStore(state => state.updateBlock)
  const deleteBlock = useBuilderStore(state => state.deleteBlock)
  const duplicateBlock = useBuilderStore(state => state.duplicateBlock)
  const upgradeTier = useBuilderStore(state => state.upgradeTier)

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  if (!selectedBlock) {
    return (
      <div className="!w-80 !min-w-[320px] !max-w-[320px] glass-light float-sm border-l border-white/10 flex items-center justify-center h-full">
        <div className="text-center p-8">
          <p className="text-sm text-white/50">Click on a building block to edit</p>
        </div>
      </div>
    )
  }

  const template = BLOCK_TEMPLATES.find(t => t.type === selectedBlock.type)
  const tierProps = TIER_PROPERTIES[selectedBlock.tier]

  const handleClose = () => setSelectedBlock(null)
  
  const handleDelete = () => {
    if (confirm('Demolish this building piece?')) {
      deleteBlock(selectedBlock.id)
    }
  }

  const handleDuplicate = () => {
    duplicateBlock(selectedBlock.id)
  }

  const handleUpgrade = () => {
    upgradeTier(selectedBlock.id)
  }

  const updateTier = (tier: BuildingTier) => {
    const newTierProps = TIER_PROPERTIES[tier]
    updateBlock(selectedBlock.id, {
      tier,
      health: newTierProps.health,
      maxHealth: newTierProps.health,
    })
  }

  const tiers: BuildingTier[] = ['twig', 'wood', 'stone', 'metal', 'armored']
  const currentTierIndex = tiers.indexOf(selectedBlock.tier)
  const canUpgrade = currentTierIndex < tiers.length - 1

  return (
    <div className="!w-80 !min-w-[320px] !max-w-[320px] glass-light float-sm border-l border-white/10 flex flex-col h-full text-white">
      <div className="flex-shrink-0 glass border-b border-white/10 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-base">Building Piece</h3>
        <div className="flex gap-1.5">
          {canUpgrade && (
            <button
              onClick={handleUpgrade}
              className="p-2 text-green-400 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
              title="Upgrade Tier"
            >
              <ArrowUp size={16} />
            </button>
          )}
          <button
            onClick={handleDuplicate}
            className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
            title="Duplicate"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
            title="Delete"
          >
            <Trash size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Block Info */}
        <div className="p-4 glass rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              {template && <BlockIcon type={template.type} size={32} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-base">{template?.label}</div>
              <div className="text-xs text-white/60 mb-2">{template?.description}</div>
              <div 
                className="inline-block px-2 py-1 rounded-lg text-xs font-bold shadow-sm"
                style={{ backgroundColor: tierProps.color }}
              >
                {tierProps.label}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 glass rounded-xl">
          <h4 className="font-medium mb-3 text-sm text-white/90">Stats</h4>
          <div className="space-y-2 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-white/70">Health:</span>
              <span className="font-mono text-green-400">{selectedBlock.health} / {selectedBlock.maxHealth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Cost:</span>
              <span className="font-mono text-yellow-400">{tierProps.cost}</span>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all rounded-full"
              style={{ width: `${(selectedBlock.health / selectedBlock.maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Material Change */}
        <div className="p-4 glass rounded-xl">
          <h4 className="font-medium mb-3 text-sm text-white/90">Change Material</h4>
          <div className="grid grid-cols-5 gap-2">
            {tiers.map((tier) => (
              <button
                key={tier}
                onClick={() => updateTier(tier)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all hover:scale-110 ${
                  selectedBlock.tier === tier
                    ? 'ring-2 ring-white/50 scale-110 shadow-lg'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: TIER_PROPERTIES[tier].color }}
                title={`${TIER_PROPERTIES[tier].label} - ${TIER_PROPERTIES[tier].cost}`}
              >
                {TIER_PROPERTIES[tier].label.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <h4 className="font-medium mb-2 text-sm text-white/90">Position</h4>
          <div className="space-y-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis} className="flex items-center gap-2">
                <label className="w-6 text-xs text-white/70">{axis}</label>
                <input
                  type="number"
                  value={selectedBlock.position[i].toFixed(1)}
                  onChange={(e) => {
                    const newPos = [...selectedBlock.position] as [number, number, number]
                    newPos[i] = parseFloat(e.target.value) || 0
                    updateBlock(selectedBlock.id, { position: newPos })
                  }}
                  step="3"
                  className="flex-1 px-3 py-2 glass-light border border-white/10 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-white text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
