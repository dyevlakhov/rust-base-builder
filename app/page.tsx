'use client'

import { Scene3D } from '@/components/Scene3D'
import { BaseSheet } from '@/components/hud/BaseSheet'
import { Hotbar } from '@/components/hud/Hotbar'
import { Inspector } from '@/components/hud/Inspector'
import { Keymap } from '@/components/hud/Keymap'
import { PieceWheel } from '@/components/hud/PieceWheel'
import { TopBar } from '@/components/hud/TopBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAppShortcuts } from '@/hooks/useAppShortcuts'

/**
 * The scene fills the screen; the HUD floats over it. Overlay containers let
 * clicks through to the canvas everywhere except on the panels themselves.
 */
export default function Home() {
  useAppShortcuts()

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <Scene3D />
      <div className="pointer-events-none absolute inset-0">
        <TopBar />
        <BaseSheet />
        <Inspector />
        <Hotbar />
      </div>
      <PieceWheel />
      <Keymap />
      <ConfirmDialog />
    </main>
  )
}
