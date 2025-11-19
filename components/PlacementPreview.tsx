'use client'

import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { BLOCK_TEMPLATES, TIER_PROPERTIES, BlockType } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import {
  getBlockHeight,
  calculateYPosition,
  checkFoundationOverlap,
  checkBlockOverlap,
  isFoundation,
  isTriangle,
  isWall,
} from '@/utils/placementUtils'

interface PlacementPreviewProps {
  blockType: BlockType
}

export function PlacementPreview({ blockType }: PlacementPreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [position, setPosition] = useState<[number, number, number]>([0, 0.15, 0])
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [canPlace, setCanPlace] = useState(true)
  
  const { camera, raycaster, pointer } = useThree()
  const snapPosition = useBuilderStore(state => state.snapPosition)
  const currentTier = useBuilderStore(state => state.currentTier)
  const gridSize = useBuilderStore(state => state.gridSize)
  
  const template = BLOCK_TEMPLATES.find(t => t.type === blockType)
  const tierProps = TIER_PROPERTIES[currentTier]

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera)
    
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersectPoint = new THREE.Vector3()
    const intersects = raycaster.ray.intersectPlane(groundPlane, intersectPoint)
    
    if (!intersects) return

    const blocks = useBuilderStore.getState().blocks
    const blockHeight = getBlockHeight(blockType)
    
    // For walls, we need to snap first to get exact edge position, then find blocks below
    const tempSnapped = snapPosition([intersectPoint.x, 100, intersectPoint.z], blockType)
    const yPos = calculateYPosition(blocks, [intersectPoint.x, 100, intersectPoint.z], blockType, gridSize, tempSnapped)
    
    // Snap position with calculated Y
    const snapped = snapPosition([intersectPoint.x, yPos, intersectPoint.z], blockType)
    
    // Check collision
        let isValidPlacement = true
        
    if (isFoundation(blockType)) {
      isValidPlacement = !checkFoundationOverlap(blocks, snapped, blockType)
      if (isValidPlacement) {
        // Check for blocks overlapping with foundation
          const overlappingBlocks = blocks.filter(block => {
          if (isFoundation(block.type)) return false
            const xDist = Math.abs(block.position[0] - snapped[0])
            const zDist = Math.abs(block.position[2] - snapped[2])
            const isAtSameXZ = xDist < 1.6 && zDist < 1.6
            const blockBottom = block.position[1] - block.scale[1] / 2
          return isAtSameXZ && blockBottom <= 0.3
        })
        isValidPlacement = overlappingBlocks.length === 0
      }
          } else {
      isValidPlacement = !checkBlockOverlap(blocks, snapped, blockType, blockHeight)
        }
        
        setCanPlace(isValidPlacement)
        setPosition(snapped)
        
    // Auto-rotate triangles
    if (isTriangle(blockType)) {
          const halfGrid = gridSize / 2
      const isFoundationType = isFoundation(blockType)
      const targetTypes = isFoundationType ? ['foundation-square'] : ['floor-square']
      const checkY = isFoundationType ? 0.15 : snapped[1]
          
          const nearbySquares = blocks.filter(block => 
            targetTypes.includes(block.type) &&
            Math.abs(block.position[1] - checkY) < 0.5
          )
          
          if (nearbySquares.length > 0) {
            let nearestSquare = nearbySquares[0]
            let minDist = Infinity
            
            for (const square of nearbySquares) {
              const dist = Math.sqrt(
                Math.pow(square.position[0] - snapped[0], 2) +
                Math.pow(square.position[2] - snapped[2], 2)
              )
              if (dist < minDist) {
                minDist = dist
                nearestSquare = square
              }
            }
            
            const squareX = nearestSquare.position[0]
            const squareZ = nearestSquare.position[2]
        const triangleCentroidOffset = halfGrid / 3
            
            const expectedCenters = [
          [squareX - halfGrid + triangleCentroidOffset, squareZ - halfGrid + triangleCentroidOffset],
          [squareX + halfGrid - triangleCentroidOffset, squareZ - halfGrid + triangleCentroidOffset],
          [squareX - halfGrid + triangleCentroidOffset, squareZ + halfGrid - triangleCentroidOffset],
          [squareX + halfGrid - triangleCentroidOffset, squareZ + halfGrid - triangleCentroidOffset],
        ]
        
            let cornerIndex = 0
            let minCenterDist = Infinity
            
            for (let i = 0; i < expectedCenters.length; i++) {
              const dist = Math.sqrt(
                Math.pow(expectedCenters[i][0] - snapped[0], 2) +
                Math.pow(expectedCenters[i][1] - snapped[2], 2)
              )
              if (dist < minCenterDist) {
                minCenterDist = dist
                cornerIndex = i
              }
            }
            
            switch (cornerIndex) {
          case 0: setRotation([0, Math.PI / 2, 0]); break
          case 1: setRotation([0, Math.PI, 0]); break
          case 2: setRotation([0, 0, 0]); break
          case 3: setRotation([0, -Math.PI / 2, 0]); break
        }
      }
    }
    // Auto-rotate walls
    else if (isWall(blockType)) {
          const isOnXEdge = Math.abs(snapped[0] % gridSize) < 0.01 || Math.abs(snapped[0] % gridSize - gridSize) < 0.01
          const isOnZEdge = Math.abs(snapped[2] % gridSize) < 0.01 || Math.abs(snapped[2] % gridSize - gridSize) < 0.01
          
          if (isOnXEdge && !isOnZEdge) {
        setRotation([0, Math.PI / 2, 0])
          } else {
        setRotation([0, 0, 0])
      }
      }
  })

  if (!template) return null

  const isTriangleBlock = isTriangle(blockType)

  // Create geometry
  const geometry = isTriangleBlock ? (
    <bufferGeometry>
      {(() => {
        const vertices = new Float32Array([
          0.0, -0.5, 0.0,  1.0, -0.5, 0.0,  0.0, -0.5, 1.0,
          0.0,  0.5, 0.0,  1.0,  0.5, 0.0,  0.0,  0.5, 1.0,
        ])
        const indices = new Uint16Array([
          0, 1, 2, 3, 5, 4,
          0, 1, 4, 0, 4, 3,
          0, 2, 5, 0, 5, 3,
          1, 2, 5, 1, 5, 4,
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

  const edgeGeometry = isTriangleBlock ? (() => {
    const geo = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      0.0, -0.5, 0.0,  1.0, -0.5, 0.0,  0.0, -0.5, 1.0,
      0.0,  0.5, 0.0,  1.0,  0.5, 0.0,  0.0,  0.5, 1.0,
    ])
    const indices = new Uint16Array([
      0, 1, 2, 3, 5, 4,
      0, 1, 4, 0, 4, 3,
      0, 2, 5, 0, 5, 3,
      1, 2, 5, 1, 5, 4,
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.setIndex(new THREE.BufferAttribute(indices, 1))
    geo.computeVertexNormals()
    return new THREE.EdgesGeometry(geo)
  })() : new THREE.BoxGeometry(1, 1, 1)

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={template.defaultSize}
      >
        {geometry}
        <meshStandardMaterial
          color={canPlace ? tierProps.color : '#ff0000'}
          transparent
          opacity={isFoundation(blockType) ? 0.8 : 0.6}
          roughness={tierProps.roughness}
          metalness={tierProps.metalness}
          emissive={canPlace ? (tierProps.emissive || tierProps.color) : '#ff0000'}
          emissiveIntensity={isFoundation(blockType) ? 0.7 : (canPlace ? 0.5 : 0.8)}
        />
        <lineSegments>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial color="#ffaa00" linewidth={3} />
        </lineSegments>
      </mesh>
      
      {(isWall(blockType) || blockType === 'doorway') && (
        <mesh position={[position[0], position[1] + template.defaultSize[1] * 0.6, position[2]]} rotation={rotation}>
          <coneGeometry args={[0.3, 0.6, 4]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  )
}
