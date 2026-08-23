'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { BlockType, TIER_PROPERTIES, getBlockTemplate } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { getBlockEdgesGeometry, getBlockGeometry } from '@/utils/geometry'
import { resolvePlacement } from '@/utils/placementUtils'

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const INVALID_COLOR = new THREE.Color('#ff3b30')
const NEVER_HIT = () => null

interface PlacementPreviewProps {
  blockType: BlockType
}

/**
 * Ghost piece that follows the cursor.
 *
 * Position, rotation and validity all come from `resolvePlacement`, the same
 * function the click handler commits with, so the preview cannot drift out of
 * step with what actually gets built. It writes straight to the three.js objects
 * instead of going through React state — this runs on every frame, and a
 * `setState` per frame would re-render the tree sixty times a second.
 */
export function PlacementPreview({ blockType }: PlacementPreviewProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const point = useRef(new THREE.Vector3())

  const { camera, raycaster, pointer } = useThree()
  const currentTier = useBuilderStore((state) => state.currentTier)

  const template = getBlockTemplate(blockType)
  const tierProps = TIER_PROPERTIES[currentTier]

  const geometry = useMemo(() => getBlockGeometry(template.isTriangle), [template.isTriangle])
  const edges = useMemo(() => getBlockEdgesGeometry(template.isTriangle), [template.isTriangle])
  const validColor = useMemo(() => new THREE.Color(tierProps.color), [tierProps.color])

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.ray.intersectPlane(GROUND_PLANE, point.current)

    group.visible = hit !== null
    if (!hit) return

    const { blocks, gridSize, snapToGrid } = useBuilderStore.getState()
    const placement = resolvePlacement(
      blocks,
      { x: point.current.x, z: point.current.z },
      blockType,
      gridSize,
      snapToGrid
    )

    group.position.set(...placement.position)
    group.rotation.set(...placement.rotation)

    const material = materialRef.current
    if (material) {
      material.color.copy(placement.valid ? validColor : INVALID_COLOR)
      material.emissive.copy(placement.valid ? validColor : INVALID_COLOR)
      material.emissiveIntensity = placement.valid ? 0.45 : 0.8
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} scale={template.defaultSize} raycast={NEVER_HIT}>
        <meshStandardMaterial
          ref={materialRef}
          transparent
          opacity={0.55}
          roughness={tierProps.roughness}
          metalness={tierProps.metalness}
          envMapIntensity={0.9}
          depthWrite={false}
        />
      </mesh>

      <lineSegments geometry={edges} scale={template.defaultSize} raycast={NEVER_HIT}>
        <lineBasicMaterial color="#ffaa00" toneMapped={false} />
      </lineSegments>

      {template.category === 'wall' && (
        <mesh position={[0, template.defaultSize[1] * 0.65, 0]} raycast={NEVER_HIT}>
          <coneGeometry args={[0.25, 0.5, 4]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}
