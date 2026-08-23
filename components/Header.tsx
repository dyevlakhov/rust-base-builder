'use client'

import { Download, Hammer, Rotate3D, Trash2 } from 'lucide-react'
import { ViewMode, useBuilderStore } from '@/store/useBuilderStore'
import { requestConfirmation } from '@/store/useConfirmStore'
import { costEntries, getTotalCost } from '@/utils/resources'
import { useHydrated } from '@/hooks/useHydrated'

const VIEW_MODES: ViewMode[] = ['3d', 'top', 'front', 'side']

const EXPORT_VERSION = 1

export function Header() {
  const blocks = useBuilderStore((state) => state.blocks)
  const clearAll = useBuilderStore((state) => state.clearAll)
  const viewMode = useBuilderStore((state) => state.viewMode)
  const setViewMode = useBuilderStore((state) => state.setViewMode)

  const hydrated = useHydrated()
  // Before hydration the store may already hold a restored design that the
  // server-rendered HTML does not, so render the empty state on the first pass.
  const visibleBlocks = hydrated ? blocks : []
  const isEmpty = visibleBlocks.length === 0
  const totals = costEntries(getTotalCost(visibleBlocks))

  const handleExport = () => {
    const payload = {
      version: EXPORT_VERSION,
      game: 'Rust',
      exportedAt: new Date().toISOString(),
      blocks,
    }

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `rust-base-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    requestConfirmation({
      title: 'Clear the whole base?',
      message: `All ${blocks.length} building pieces will be removed. This cannot be undone.`,
      confirmLabel: 'Clear base',
      onConfirm: clearAll,
    })
  }

  return (
    <header className="glass float-sm flex items-center justify-between border-b border-white/10 px-6 py-4 text-white">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-orange-500/20 p-2">
          <Hammer size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Rust Base Builder</h1>
          <p className="text-xs text-white/60">
            Plan your base layout before you spend the resources
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="glass-light flex gap-1 rounded-xl p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {mode === '3d' && <Rotate3D size={12} className="mr-1 inline" />}
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {totals.length > 0 && (
          <div className="glass-light rounded-xl px-4 py-2 font-mono text-xs">
            <div className="flex gap-4">
              {totals.map(({ key, amount, icon, name }) => (
                <span key={key} title={name} className="whitespace-nowrap text-white/90">
                  {icon} {amount.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isEmpty}
          className="flex items-center gap-2 rounded-xl bg-orange-500/80 px-4 py-2 text-sm font-medium shadow-lg transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        <button
          onClick={handleClear}
          disabled={isEmpty}
          className="flex items-center gap-2 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-medium shadow-lg transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
      </div>
    </header>
  )
}
