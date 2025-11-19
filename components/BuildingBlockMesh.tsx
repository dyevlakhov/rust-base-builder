'use client'

import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BuildingBlock, TIER_PROPERTIES } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { loadMaterialTextures, MaterialTextures } from '@/utils/textureLoader'

interface BuildingBlockMeshProps {
  block: BuildingBlock
}

export function BuildingBlockMesh({ block }: BuildingBlockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const [textures, setTextures] = useState<MaterialTextures | null>(null)
  
  const selectedBlockId = useBuilderStore(state => state.selectedBlockId)
  const setSelectedBlock = useBuilderStore(state => state.setSelectedBlock)
  
  const isSelected = selectedBlockId === block.id

  // Determine block category for texture loading
  const blockCategory = block.type.includes('foundation') 
    ? 'foundation' 
    : block.type.includes('floor') 
    ? 'floor' 
    : 'wall'

  // Load textures based on tier and block type
  useEffect(() => {
    loadMaterialTextures(block.tier, blockCategory).then((loadedTextures) => {
      console.log(`[BuildingBlockMesh] Loaded textures for ${block.tier}_${blockCategory}:`, {
        hasMap: !!loadedTextures.map,
        hasNormal: !!loadedTextures.normalMap,
        hasRoughness: !!loadedTextures.roughnessMap,
        hasMetalness: !!loadedTextures.metalnessMap,
      })
      setTextures(loadedTextures)
    })
  }, [block.tier, blockCategory])

  // Update texture repeat based on block scale
  useEffect(() => {
    if (materialRef.current && textures) {
      // Calculate repeat based on block dimensions (Rust blocks are 3m, so scale accordingly)
      const repeatX = Math.max(1, Math.floor(block.scale[0] / 3))
      const repeatY = Math.max(1, Math.floor(block.scale[1] / 3))
      const repeatZ = Math.max(1, Math.floor(block.scale[2] / 3))
      
      if (textures.map) {
        textures.map.repeat.set(repeatX, Math.max(repeatY, repeatZ))
      }
      if (textures.normalMap) {
        textures.normalMap.repeat.set(repeatX, Math.max(repeatY, repeatZ))
      }
      if (textures.roughnessMap) {
        textures.roughnessMap.repeat.set(repeatX, Math.max(repeatY, repeatZ))
      }
      if (textures.metalnessMap) {
        textures.metalnessMap.repeat.set(repeatX, Math.max(repeatY, repeatZ))
      }
      
      materialRef.current.needsUpdate = true
    }
  }, [textures, block.scale])

  // Gentle pulse animation for selected block
  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.set(
        block.scale[0] * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.03),
        block.scale[1] * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.03),
        block.scale[2] * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.03)
      )
    } else if (meshRef.current) {
      meshRef.current.scale.set(block.scale[0], block.scale[1], block.scale[2])
    }
  })

  const placementMode = useBuilderStore(state => state.placementMode)

  const handleClick = (e: any) => {
    e.stopPropagation()
    // Don't select if in placement mode
    if (placementMode) return
    setSelectedBlock(isSelected ? null : block.id)
  }

  // Get material properties from tier definition
  const tierProps = TIER_PROPERTIES[block.tier]

  // Determine if this is a triangle block
  const isTriangle = block.type.includes('triangle')

  // Create geometry based on block type
  const geometry = isTriangle ? (
    // Triangle blocks: Create a right-angled triangular prism
    // Right angle at origin (0,0,0), extends along +X and +Z axes
    // This matches Rust's triangle foundation shape
    <bufferGeometry>
      {(() => {
        const vertices = new Float32Array([
          // Right-angled triangle prism
          // Bottom face (Y = -0.5) - right angle at origin
          0.0, -0.5,  0.0,  // 0: right angle corner (origin)
          1.0, -0.5,  0.0,  // 1: along X axis
          0.0, -0.5,  1.0,  // 2: along Z axis
          
          // Top face (Y = 0.5) - same triangle shape
          0.0,  0.5,  0.0,  // 3: right angle corner
          1.0,  0.5,  0.0,  // 4: along X axis
          0.0,  0.5,  1.0,  // 5: along Z axis
        ])
        
        // UV coordinates for triangle geometry
        const uvs = new Float32Array([
          // Bottom face
          0.0, 0.0,  // 0
          1.0, 0.0,  // 1
          0.0, 1.0,  // 2
          // Top face
          0.0, 0.0,  // 3
          0.0, 1.0,  // 4
          1.0, 1.0,  // 5
        ])
        
        const indices = new Uint16Array([
          // Bottom face (right-angled triangle)
          0, 1, 2,
          
          // Top face (right-angled triangle)
          3, 5, 4,
          
          // X-axis face (rectangle)
          0, 1, 4,
          0, 4, 3,
          
          // Z-axis face (rectangle)
          0, 2, 5,
          0, 5, 3,
          
          // Hypotenuse face (diagonal rectangle)
          1, 2, 5,
          1, 5, 4,
        ])
        
        return (
          <>
            <bufferAttribute
              attach="attributes-position"
              count={vertices.length / 3}
              array={vertices}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-uv"
              count={uvs.length / 2}
              array={uvs}
              itemSize={2}
            />
            <bufferAttribute
              attach="index"
              count={indices.length}
              array={indices}
              itemSize={1}
            />
          </>
        )
      })()}
    </bufferGeometry>
  ) : (
    <boxGeometry args={[1, 1, 1]} />
  )

  const edgeGeometry = isTriangle ? new THREE.EdgesGeometry(
    (() => {
      const geo = new THREE.BufferGeometry()
      // Right-angled triangle vertices (matching the main geometry)
      const vertices = new Float32Array([
        0.0, -0.5, 0.0,  1.0, -0.5, 0.0,  0.0, -0.5, 1.0,
        0.0,  0.5, 0.0,  1.0,  0.5, 0.0,  0.0,  0.5, 1.0,
      ])
      const indices = new Uint16Array([
        0, 1, 2, 3, 5, 4,  // Triangles
        0, 1, 4, 0, 4, 3,  // X-axis face
        0, 2, 5, 0, 5, 3,  // Z-axis face
        1, 2, 5, 1, 5, 4,  // Hypotenuse face
      ])
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geo.setIndex(new THREE.BufferAttribute(indices, 1))
      geo.computeVertexNormals()
      return geo
    })()
  ) : new THREE.BoxGeometry(1, 1, 1)

  return (
    <mesh
      ref={meshRef}
      position={block.position}
      rotation={block.rotation}
      scale={block.scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial
        ref={materialRef}
        map={textures?.map || null}
        normalMap={textures?.normalMap || null}
        roughnessMap={textures?.roughnessMap || null}
        metalnessMap={textures?.metalnessMap || null}
        // Use white color when texture map exists, otherwise use tier color
        color={textures?.map ? (hovered ? '#ffaa88' : (isSelected ? '#aaccff' : '#ffffff')) : (hovered ? '#ff8c42' : (isSelected ? '#4dabf7' : tierProps.color))}
        roughness={textures?.roughnessMap ? undefined : (hovered ? tierProps.roughness * 0.8 : tierProps.roughness)}
        metalness={textures?.metalnessMap ? undefined : tierProps.metalness}
        emissive={tierProps.emissive || '#000000'}
        emissiveIntensity={isSelected ? 0.3 : (tierProps.emissiveIntensity || 0)}
      />
      
      {/* Outline for selected block */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial color="#ffff00" linewidth={2} />
        </lineSegments>
      )}
      
      {/* Health bar indicator above block */}
      {isSelected && (
        <group position={[0, 0.6, 0]}>
          <sprite scale={[1, 0.1, 1]}>
            <spriteMaterial 
              color={block.health > block.maxHealth * 0.5 ? '#00ff00' : '#ff0000'} 
              transparent
              opacity={0.8}
            />
          </sprite>
        </group>
      )}
    </mesh>
  )
}
