'use client'

import { useRef } from 'react'
import { Download, Hammer, Redo2, Rotate3D, Trash2, Undo2, Upload } from 'lucide-react'
import { SaveFormatError, deserialize, serialize } from '@/engine'
import { piecesOf, useDesignStore } from '@/store/useDesignStore'
import { ViewMode, useToolStore } from '@/store/useToolStore'
import { requestConfirmation } from '@/store/useConfirmStore'
import { costEntries, getTotalCost } from '@/utils/resources'
import { useHydrated } from '@/hooks/useHydrated'

const VIEW_MODES: ViewMode[] = ['3d', 'top', 'front', 'side']

const iconButton =
  'flex items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'

export function Header() {
  const world = useDesignStore((state) => state.world)
  const canUndo = useDesignStore((state) => state.past.length > 0)
  const canRedo = useDesignStore((state) => state.future.length > 0)
  const { undo, redo, clear, load } = useDesignStore.getState()
  const viewMode = useToolStore((state) => state.viewMode)
  const setViewMode = useToolStore((state) => state.setViewMode)
  const fileInput = useRef<HTMLInputElement>(null)

  const hydrated = useHydrated()
  // The store may already hold a restored base that the server-rendered HTML
  // does not, so the first pass renders the empty state.
  const pieces = hydrated ? piecesOf(world) : []
  const isEmpty = pieces.length === 0
  const totals = costEntries(getTotalCost(pieces))

  const handleExport = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(serialize(world))], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `rust-base-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const loaded = deserialize(JSON.parse(await file.text()))
      const replace = () => {
        load(loaded)
        useToolStore.getState().select(null)
      }
      if (isEmpty) replace()
      else
        requestConfirmation({
          title: 'Replace the current base?',
          message: `${file.name} has ${loaded.length} pieces. Ctrl+Z restores the current base.`,
          confirmLabel: 'Replace',
          onConfirm: replace,
        })
    } catch (error) {
      requestConfirmation({
        title: 'Could not open this file',
        message: error instanceof SaveFormatError ? error.message : 'It is not a valid base file.',
        confirmLabel: 'OK',
        onConfirm: () => {},
      })
    }
  }

  const handleClear = () => {
    requestConfirmation({
      title: 'Clear the whole base?',
      message: `All ${pieces.length} building pieces will be removed. Ctrl+Z brings them back.`,
      confirmLabel: 'Clear base',
      onConfirm: () => {
        clear()
        useToolStore.getState().select(null)
      },
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
        <div className="glass-light flex gap-0.5 rounded-xl p-1">
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className={iconButton}>
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={iconButton}
          >
            <Redo2 size={16} />
          </button>
        </div>

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
          <div className="glass-light flex gap-4 rounded-xl px-4 py-2 font-mono text-xs">
            {totals.map(({ key, amount, short, name }) => (
              <span key={key} title={name} className="whitespace-nowrap text-white/90">
                <span className="text-white/50">{short}</span> {amount.toLocaleString()}
              </span>
            ))}
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleImport(file)
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
        >
          <Upload size={16} />
          <span>Import</span>
        </button>

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
