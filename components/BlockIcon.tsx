'use client'

import { 
  Box, 
  Triangle, 
  RectangleHorizontal, 
  Minus, 
  DoorOpen, 
  Square, 
  Grid3x3,
  Layers
} from 'lucide-react'
import { BlockType } from '@/types/building-blocks'

interface BlockIconProps {
  type: BlockType
  size?: number
  className?: string
}

export function BlockIcon({ type, size = 24, className = '' }: BlockIconProps) {
  const iconProps = { size, className }
  
  switch (type) {
    case 'foundation-square':
      return <Box {...iconProps} />
    case 'foundation-triangle':
      return <Triangle {...iconProps} />
    case 'wall-full':
      return <RectangleHorizontal {...iconProps} />
    case 'wall-half':
      return <RectangleHorizontal {...iconProps} style={{ height: size * 0.6 }} />
    case 'wall-low':
      return <Minus {...iconProps} style={{ height: size * 0.4 }} />
    case 'doorway':
      return <DoorOpen {...iconProps} />
    case 'window':
      return <Square {...iconProps} />
    case 'wall-frame':
      return <Grid3x3 {...iconProps} />
    case 'floor-square':
      return <Layers {...iconProps} />
    case 'floor-triangle':
      return <Triangle {...iconProps} />
    case 'floor-frame':
      return <Grid3x3 {...iconProps} />
    default:
      return <Box {...iconProps} />
  }
}

interface CategoryIconProps {
  category: 'foundation' | 'wall' | 'floor'
  size?: number
  className?: string
}

export function CategoryIcon({ category, size = 20, className = '' }: CategoryIconProps) {
  const iconProps = { size, className }
  
  switch (category) {
    case 'foundation':
      return <Layers {...iconProps} />
    case 'wall':
      return <RectangleHorizontal {...iconProps} />
    case 'floor':
      return <Box {...iconProps} />
    default:
      return <Box {...iconProps} />
  }
}

