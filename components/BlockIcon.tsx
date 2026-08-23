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
import { BlockCategory, BlockType } from '@/types/building-blocks'

const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  'foundation-square': Square,
  'foundation-triangle': Triangle,
  'wall-full': RectangleVertical,
  'wall-half': RectangleHorizontal,
  'wall-low': Minus,
  doorway: DoorOpen,
  window: AppWindow,
  'wall-frame': Frame,
  'floor-square': Layers,
  'floor-triangle': Triangle,
  'floor-frame': Grid3x3,
}

const CATEGORY_ICONS: Record<BlockCategory, LucideIcon> = {
  foundation: Layers,
  wall: RectangleVertical,
  floor: Box,
}

interface IconProps {
  size?: number
  className?: string
}

export function BlockIcon({ type, size = 24, className = '' }: IconProps & { type: BlockType }) {
  const Icon = BLOCK_ICONS[type] ?? Box
  return <Icon size={size} className={className} aria-hidden />
}

export function CategoryIcon({
  category,
  size = 20,
  className = '',
}: IconProps & { category: BlockCategory }) {
  const Icon = CATEGORY_ICONS[category] ?? Box
  return <Icon size={size} className={className} aria-hidden />
}
