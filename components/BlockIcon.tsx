'use client'

import {
  AppWindow,
  Box,
  DoorOpen,
  Frame,
  Grid3x3,
  Layers,
  Minus,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Triangle,
  type LucideIcon,
} from 'lucide-react'
import { PieceKind, PieceType } from '@/engine'

const PIECE_ICONS: Record<PieceType, LucideIcon> = {
  foundation: Square,
  'foundation-triangle': Triangle,
  floor: Layers,
  'floor-triangle': Triangle,
  'floor-frame': Grid3x3,
  'floor-triangle-frame': Triangle,
  wall: RectangleVertical,
  'wall-half': RectangleHorizontal,
  'wall-low': Minus,
  doorway: DoorOpen,
  window: AppWindow,
  'wall-frame': Frame,
}

const KIND_ICONS: Record<PieceKind, LucideIcon> = {
  foundation: Layers,
  wall: RectangleVertical,
  floor: Box,
}

interface IconProps {
  size?: number
  className?: string
}

export function BlockIcon({ type, size = 24, className = '' }: IconProps & { type: PieceType }) {
  const Icon = PIECE_ICONS[type]
  return <Icon size={size} className={className} aria-hidden />
}

export function CategoryIcon({ kind, size = 20, className = '' }: IconProps & { kind: PieceKind }) {
  const Icon = KIND_ICONS[kind]
  return <Icon size={size} className={className} aria-hidden />
}
