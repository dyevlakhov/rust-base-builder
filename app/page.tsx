'use client'

import { BlockDetailsPanel } from '@/components/BlockDetailsPanel'
import { BlockPalette } from '@/components/BlockPalette'
import { Header } from '@/components/Header'
import { Scene3D } from '@/components/Scene3D'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAppShortcuts } from '@/hooks/useAppShortcuts'

export default function Home() {
  useAppShortcuts()

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-gray-900">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <BlockPalette />
        <div className="relative min-w-0 flex-1">
          <Scene3D />
        </div>
        <BlockDetailsPanel />
      </div>
      <ConfirmDialog />
    </main>
  )
}
