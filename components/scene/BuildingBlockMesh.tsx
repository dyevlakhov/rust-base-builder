'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { BuildingBlock, TIER_PROPERTIES, getBlockTemplate } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { getBlockEdgesGeometry, getBlockGeometry } from '@/utils/geometry'
import { MaterialTextures, loadMaterialTextures } from '@/utils/textureLoader'

const HOVER_COLOR = '#ff9d5c'
const SELECTED_COLOR = '#6fb7ff'
const TEXTURED_COLOR = '#ffffff'

/**
 * The environment map is a bright studio box; at full strength its diffuse
 * contribution washes the tier albedo out to white.
 */
const ENV_MAP_INTENSITY = 0.9

interface BuildingBlockMeshProps {
  block: BuildingBlock
}

export function BuildingBlockMesh({ block }: BuildingBlockMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const [textures, setTextures] = useState<MaterialTextures | null>(null)

  const selectedBlockId = useBuilderStore((state) => state.selectedBlockId)
  const setSelectedBlock = useBuilderStore((state) => state.setSelectedBlock)
  const placementMode = useBuilderStore((state) => state.placementMode)

  const isSelected = selectedBlockId === block.id
  const template = getBlockTemplate(block.type)
  const tierProps = TIER_PROPERTIES[block.tier]

  const geometry = useMemo(() => getBlockGeometry(template.isTriangle), [template.isTriangle])
  const edges = useMemo(() => getBlockEdgesGeometry(template.isTriangle), [template.isTriangle])

  useEffect(() => {
    let cancelled = false
    loadMaterialTextures(block.tier, template.category).then((loaded) => {
      if (!cancelled) setTextures(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [block.tier, template.category])

  // Attaching a map to a material that was compiled without one changes its
  // shader defines. three only picks that up when the material is flagged dirty,
  // so without this the textures load and are silently never drawn.
  useEffect(() => {
    if (materialRef.current) materialRef.current.needsUpdate = true
  }, [textures])

  // Gentle breathing highlight on the selected piece. Applied to the wrapper so
  // it does not fight the non-uniform scale React puts on the mesh itself.
  useFrame((state) => {
    const group = groupRef.current
    if (!group) return

    const pulse = isSelected ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02 : 1
    group.scale.setScalar(pulse)
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // While placing, clicks belong to the ground plane behind this piece.
    if (placementMode) return

    event.stopPropagation()
    setSelectedBlock(isSelected ? null : block.id)
  }

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (placementMode) return
    event.stopPropagation()
    setHovered(true)
  }

  const color = textures?.map
    ? TEXTURED_COLOR
    : hovered
      ? HOVER_COLOR
      : isSelected
        ? SELECTED_COLOR
        : tierProps.color

  return (
    <group ref={groupRef} position={block.position} rotation={block.rotation}>
      <mesh
        geometry={geometry}
        scale={block.scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={materialRef}
          map={textures?.map ?? null}
          normalMap={textures?.normalMap ?? null}
          roughnessMap={textures?.roughnessMap ?? null}
          metalnessMap={textures?.metalnessMap ?? null}
          color={color}
          roughness={tierProps.roughness}
          metalness={tierProps.metalness}
          envMapIntensity={ENV_MAP_INTENSITY}
          emissive={isSelected ? SELECTED_COLOR : (tierProps.emissive ?? '#000000')}
          emissiveIntensity={isSelected ? 0.35 : (tierProps.emissiveIntensity ?? 0)}
        />
      </mesh>

      {isSelected && (
        <lineSegments geometry={edges} scale={block.scale}>
          <lineBasicMaterial color="#ffd24a" toneMapped={false} />
        </lineSegments>
      )}
    </group>
  )
}
