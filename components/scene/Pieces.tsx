'use client'

import { memo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Piece, PieceType, Tier, World, originOf } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { pieceGeometry } from '@/render/geometry'
import { tierMaterial } from '@/render/materials'

/** Picking goes through the engine's raycast, so meshes opt out of three's. */
export const noRaycast = () => null

type GroupKey = `${PieceType}|${Tier}`
type Groups = ReadonlyMap<GroupKey, readonly Piece[]>

const keyOf = (piece: Piece): GroupKey => `${piece.type}|${piece.tier}`

const groupCache = new WeakMap<World, Groups>()

/**
 * Pieces bucketed by type and tier — one bucket per instanced draw call.
 *
 * Carried along patches like the engine's own derived data: a new world reuses
 * its parent's buckets and rebuilds only those the patch touched, so building a
 * piece re-uploads one bucket's matrices, not the whole base.
 */
function groupsOf(world: World): Groups {
  const cached = groupCache.get(world)
  if (cached) return cached

  const origin = originOf(world)
  const parent = origin && groupCache.get(origin.parent)
  let groups: Map<GroupKey, readonly Piece[]>

  if (origin && parent) {
    groups = new Map(parent)
    const removed = new Set(origin.patch.remove.map((piece) => piece.id))
    const touched = new Set([...origin.patch.remove, ...origin.patch.add].map(keyOf))
    for (const key of touched) {
      const list = (parent.get(key) ?? []).filter((piece) => !removed.has(piece.id))
      for (const piece of origin.patch.add) if (keyOf(piece) === key) list.push(piece)
      if (list.length > 0) groups.set(key, list)
      else groups.delete(key)
    }
  } else {
    const building = new Map<GroupKey, Piece[]>()
    for (const piece of world.pieces.values()) {
      const key = keyOf(piece)
      const list = building.get(key)
      if (list) list.push(piece)
      else building.set(key, [piece])
    }
    groups = building
  }

  groupCache.set(world, groups)
  return groups
}

/** Instance buffers grow in powers of two so most builds reuse the same mesh. */
function capacityFor(count: number): number {
  return Math.max(16, 2 ** Math.ceil(Math.log2(count)))
}

const matrix = new THREE.Matrix4()

/**
 * Every piece of one type and tier, drawn in a single call. `memo` skips the
 * buckets a change did not touch, so their matrices are never re-uploaded.
 */
const InstancedGroup = memo(function InstancedGroup({
  type,
  tier,
  pieces,
}: {
  type: PieceType
  tier: Tier
  pieces: readonly Piece[]
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((state) => state.invalidate)
  const capacity = capacityFor(pieces.length)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]
      matrix.makeRotationY(piece.yaw)
      matrix.setPosition(piece.x, piece.y, piece.z)
      mesh.setMatrixAt(i, matrix)
    }
    mesh.count = pieces.length
    mesh.instanceMatrix.needsUpdate = true
    // Frustum culling uses this; without it a group vanishes whenever its
    // first instance leaves the view.
    mesh.computeBoundingSphere()
    invalidate()
  }, [pieces, capacity, invalidate])

  return (
    <instancedMesh
      key={capacity}
      ref={ref}
      args={[pieceGeometry(type), tierMaterial(tier), capacity]}
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
      {[...groupsOf(world)].map(([key, pieces]) => {
        const [type, tier] = key.split('|') as [PieceType, Tier]
        return <InstancedGroup key={key} type={type} tier={tier} pieces={pieces} />
      })}
    </>
  )
}
