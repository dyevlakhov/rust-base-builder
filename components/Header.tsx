'use client'

import { Download, Trash2, Rotate3D, Hammer } from 'lucide-react'
import { useBuilderStore } from '@/store/useBuilderStore'

export function Header() {
  const blocks = useBuilderStore(state => state.blocks)
  const clearAll = useBuilderStore(state => state.clearAll)
  const viewMode = useBuilderStore(state => state.viewMode)
  const setViewMode = useBuilderStore(state => state.setViewMode)

  const handleExport = () => {
    const data = JSON.stringify({ blocks, version: '1.0', game: 'Rust' }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rust_base_design.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    if (confirm('Clear entire base? This cannot be undone.')) {
      clearAll()
    }
  }

  const getTotalResources = () => {
    const total = { wood: 0, stone: 0, metal: 0, hqm: 0 }
    
    blocks.forEach(block => {
      switch (block.tier) {
        case 'twig': total.wood += 100; break
        case 'wood': total.wood += 300; break
        case 'stone': total.stone += 300; break
        case 'metal': total.metal += 200; total.hqm += 25; break
        case 'armored': total.hqm += 25; break
      }
    })
    
    return total
  }

  const resources = getTotalResources()

  return (
    <header className="glass float-sm text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Hammer size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Rust Base Builder</h1>
          <p className="text-xs text-white/60">Plan your base layout • Created by Dmitry Yevlakhov</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex gap-1 glass-light rounded-xl p-1">
          {(['3d', 'top', 'front', 'side'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {mode === '3d' && <Rotate3D size={12} className="inline mr-1" />}
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {blocks.length > 0 && (
          <div className="px-4 py-2 glass-light rounded-xl text-xs font-mono">
            <div className="flex gap-4">
              {resources.wood > 0 && <span className="text-amber-400/90">🪵 {resources.wood}</span>}
              {resources.stone > 0 && <span className="text-gray-300/90">🪨 {resources.stone}</span>}
              {resources.metal > 0 && <span className="text-blue-400/90">⚙️ {resources.metal}</span>}
              {resources.hqm > 0 && <span className="text-cyan-400/90">💎 {resources.hqm}</span>}
            </div>
          </div>
        )}
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/80 hover:bg-orange-500 rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={blocks.length === 0}
        >
          <Download size={16} />
          <span>Export</span>
        </button>
        
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={blocks.length === 0}
        >
          <Trash2 size={16} />
          <span>Clear</span>
        </button>
      </div>
    </header>
  )
}
