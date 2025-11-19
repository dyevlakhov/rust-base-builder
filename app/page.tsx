'use client'

import { Header } from '@/components/Header'
import { Scene3D } from '@/components/Scene3D'
import { BlockPalette } from '@/components/BlockPalette'
import { BlockDetailsPanel } from '@/components/BlockDetailsPanel'

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-gray-900 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <BlockPalette />
        <div className="flex-1 relative min-w-0">
          <Scene3D />
        </div>
        <BlockDetailsPanel />
      </div>
    </main>
  )
}
