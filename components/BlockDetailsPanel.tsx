'use client'

import { ArrowUp, Copy, Trash, X } from 'lucide-react'
import {
  BuildingTier,
  TIER_ORDER,
  TIER_PROPERTIES,
  getBlockTemplate,
} from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { requestConfirmation } from '@/store/useConfirmStore'
import { formatCost } from '@/utils/resources'
import { BlockIcon } from './BlockIcon'
import { NumberField } from './ui/NumberField'

const AXES = ['X', 'Y', 'Z'] as const

export function BlockDetailsPanel() {
  const blocks = useBuilderStore((state) => state.blocks)
  const selectedBlockId = useBuilderStore((state) => state.selectedBlockId)
  const gridSize = useBuilderStore((state) => state.gridSize)
  const setSelectedBlock = useBuilderStore((state) => state.setSelectedBlock)
  const updateBlock = useBuilderStore((state) => state.updateBlock)
  const deleteBlock = useBuilderStore((state) => state.deleteBlock)
  const duplicateBlock = useBuilderStore((state) => state.duplicateBlock)
  const upgradeTier = useBuilderStore((state) => state.upgradeTier)

  const block = blocks.find((candidate) => candidate.id === selectedBlockId)

  if (!block) {
    return (
      <div className="glass-light float-sm flex h-full w-80 shrink-0 items-center justify-center border-l border-white/10">
        <p className="p-8 text-center text-sm text-white/50">
          Select a building piece to inspect it
        </p>
      </div>
    )
  }

  const template = getBlockTemplate(block.type)
  const tierProps = TIER_PROPERTIES[block.tier]
  const canUpgrade = TIER_ORDER.indexOf(block.tier) < TIER_ORDER.length - 1

  const handleDelete = () => {
    requestConfirmation({
      title: 'Demolish this piece?',
      message: `${template.label} will be removed from your design.`,
      confirmLabel: 'Demolish',
      onConfirm: () => deleteBlock(block.id),
    })
  }

  const setTier = (tier: BuildingTier) => {
    const { health } = TIER_PROPERTIES[tier]
    updateBlock(block.id, { tier, health, maxHealth: health })
  }

  const setAxis = (index: number, value: number) => {
    const position: [number, number, number] = [...block.position]
    position[index] = value
    updateBlock(block.id, { position })
  }

  return (
    <div className="glass-light float-sm flex h-full w-80 shrink-0 flex-col border-l border-white/10 text-white">
      <div className="glass flex shrink-0 items-center justify-between border-b border-white/10 p-4">
        <h2 className="text-base font-semibold">Building piece</h2>
        <div className="flex gap-1.5">
          {canUpgrade && (
            <button
              onClick={() => upgradeTier(block.id)}
              title="Upgrade to the next tier"
              className="rounded-lg p-2 text-green-400 transition-colors hover:bg-white/10"
            >
              <ArrowUp size={16} />
            </button>
          )}
          <button
            onClick={() => duplicateBlock(block.id)}
            title="Duplicate"
            className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-white/10"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleDelete}
            title="Demolish"
            className="rounded-lg p-2 text-red-400 transition-colors hover:bg-white/10"
          >
            <Trash size={16} />
          </button>
          <button
            onClick={() => setSelectedBlock(null)}
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
              <BlockIcon type={block.type} size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold">{template.label}</div>
              <div className="mb-2 text-xs text-white/60">{template.description}</div>
              <span
                className="inline-block rounded-lg px-2 py-1 text-xs font-bold shadow-sm"
                style={{ backgroundColor: tierProps.color }}
              >
                {tierProps.label}
              </span>
            </div>
          </div>
        </section>

        <section className="glass rounded-xl p-4">
          <h3 className="mb-3 text-sm font-medium text-white/90">Stats</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-white/70">Health</dt>
              <dd className="font-mono text-green-400">{block.health.toLocaleString()} HP</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">Cost</dt>
              <dd className="font-mono text-yellow-400">{formatCost(tierProps.cost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">Size</dt>
              <dd className="font-mono text-white/80">
                {template.defaultSize.map((n) => n.toString()).join(' × ')} m
              </dd>
            </div>
          </dl>
        </section>

        <section className="glass rounded-xl p-4">
          <h3 className="mb-3 text-sm font-medium text-white/90">Material</h3>
          <div className="grid grid-cols-5 gap-2">
            {TIER_ORDER.map((tier) => {
              const props = TIER_PROPERTIES[tier]
              return (
                <button
                  key={tier}
                  onClick={() => setTier(tier)}
                  aria-pressed={block.tier === tier}
                  title={`${props.label} — ${formatCost(props.cost)}`}
                  style={{ backgroundColor: props.color }}
                  className={`rounded-xl p-2.5 text-xs font-bold transition-transform ${
                    block.tier === tier
                      ? 'scale-110 shadow-lg ring-2 ring-white/60'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {props.label.slice(0, 4)}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-white/90">Position</h3>
          <div className="space-y-2">
            {AXES.map((axis, index) => (
              <NumberField
                key={axis}
                label={axis}
                value={block.position[index]}
                step={index === 1 ? 0.5 : gridSize}
                onCommit={(value) => setAxis(index, value)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
