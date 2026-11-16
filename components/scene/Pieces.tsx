'use client'

import { memo } from 'react'
import { Piece } from '@/engine'
import { piecesOf, useDesignStore } from '@/store/useDesignStore'
import { pieceGeometry } from '@/render/geometry'
import { tierMaterial } from '@/render/materials'

/** Picking goes through the engine's raycast, so meshes opt out of three's. */
export const noRaycast = () => null

/**
 * Pieces are immutable, so a piece whose object did not change cannot have
 * changed: `memo` skips it. Adding one piece re-renders only that one mesh, and
 * no mesh subscribes to the store on its own.
 */
const PieceMesh = memo(function PieceMesh({ piece }: { piece: Piece }) {
  return (
    <mesh
      geometry={pieceGeometry(piece.type)}
      material={tierMaterial(piece.tier)}
      position={[piece.x, piece.y, piece.z]}
      rotation-y={piece.yaw}
      castShadow
      receiveShadow
      raycast={noRaycast}
    />
  )
})

export function Pieces() {
  const world = useDesignStore((state) => state.world)
  return (
    <>
      {piecesOf(world).map((piece) => (
        <PieceMesh key={piece.id} piece={piece} />
      ))}
    </>
  )
}
