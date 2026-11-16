'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { pieceEdges } from '@/render/geometry'
import { noRaycast } from './Pieces'

/** Outline of the selected piece, drawn through anything in front of it. */
export function SelectionOutline() {
  const selectedId = useToolStore((state) => state.selectedId)
  const piece = useDesignStore((state) =>
    selectedId ? state.world.pieces.get(selectedId) : undefined
  )

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#ffd24a',
        depthTest: false,
        transparent: true,
        opacity: 0.95,
        toneMapped: false,
      }),
    []
  )
  useEffect(() => () => material.dispose(), [material])

  if (!piece) return null

  return (
    <lineSegments
      geometry={pieceEdges(piece.type)}
      material={material}
      position={[piece.x, piece.y, piece.z]}
      rotation-y={piece.yaw}
      renderOrder={3}
      raycast={noRaycast}
    />
  )
}
