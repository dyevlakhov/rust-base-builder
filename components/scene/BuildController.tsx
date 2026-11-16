'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Ray, raycast, solvePlacement } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { pieceEdges, pieceGeometry } from '@/render/geometry'
import { noRaycast } from './Pieces'

const VALID_COLOR = new THREE.Color('#3d9bff')
const INVALID_COLOR = new THREE.Color('#ff3b30')

/** A press that moves further than this is a camera drag, not a click. */
const CLICK_SLOP_PX = 5

/**
 * Turns the pointer into building.
 *
 * Each frame it casts the cursor ray through the engine: with a piece picked it
 * shows the ghost `solvePlacement` returns, otherwise it outlines the piece under
 * the cursor. A click builds exactly the placement the ghost showed, or selects.
 *
 * The ghost and the hover outline are moved by writing to three.js objects
 * directly; going through React state sixty times a second would re-render the
 * scene every frame.
 */
export function BuildController() {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const activeType = useToolStore((state) => state.activeType)

  const ghostRef = useRef<THREE.Mesh>(null)
  const hoverRef = useRef<THREE.LineSegments>(null)
  const pointer = useRef(new THREE.Vector2())
  const pointerInside = useRef(false)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const ghostMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: VALID_COLOR,
        emissive: VALID_COLOR,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        roughness: 0.6,
      }),
    []
  )
  const ghostEdgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: VALID_COLOR, toneMapped: false }),
    []
  )
  const hoverMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ffb066', toneMapped: false }),
    []
  )

  useEffect(
    () => () => {
      ghostMaterial.dispose()
      ghostEdgeMaterial.dispose()
      hoverMaterial.dispose()
    },
    [ghostMaterial, ghostEdgeMaterial, hoverMaterial]
  )

  useEffect(() => {
    const element = gl.domElement
    let down: { x: number; y: number } | null = null

    const cursorRay = (): Ray => {
      raycaster.setFromCamera(pointer.current, camera)
      const { origin, direction } = raycaster.ray
      return {
        origin: [origin.x, origin.y, origin.z],
        direction: [direction.x, direction.y, direction.z],
      }
    }

    const track = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      pointerInside.current = true
      // The ghost and hover outline follow the cursor; draw a frame.
      invalidate()
    }

    const handleDown = (event: PointerEvent) => {
      track(event)
      down = event.button === 0 ? { x: event.clientX, y: event.clientY } : null
    }

    const handleUp = (event: PointerEvent) => {
      if (event.button !== 0 || !down) return
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
      down = null
      if (moved > CLICK_SLOP_PX) return

      track(event)
      const tool = useToolStore.getState()
      const design = useDesignStore.getState()
      const ray = cursorRay()

      if (tool.activeType) {
        const placement = solvePlacement(design.world, ray, {
          type: tool.activeType,
          tier: tool.tier,
          rotation: tool.rotation,
          snap: tool.snap,
        })
        if (placement?.valid) design.place(placement.spec)
        return
      }

      tool.select(raycast(design.world, ray)?.pieceId ?? null)
    }

    const handleLeave = () => {
      pointerInside.current = false
      invalidate()
    }

    element.addEventListener('pointermove', track)
    element.addEventListener('pointerdown', handleDown)
    element.addEventListener('pointerup', handleUp)
    element.addEventListener('pointerleave', handleLeave)
    return () => {
      element.removeEventListener('pointermove', track)
      element.removeEventListener('pointerdown', handleDown)
      element.removeEventListener('pointerup', handleUp)
      element.removeEventListener('pointerleave', handleLeave)
    }
  }, [gl, camera, raycaster, invalidate])

  useFrame(() => {
    const ghost = ghostRef.current
    const hover = hoverRef.current
    const tool = useToolStore.getState()

    if (!pointerInside.current) {
      if (ghost) ghost.visible = false
      if (hover) hover.visible = false
      tool.setGhost(null)
      return
    }

    raycaster.setFromCamera(pointer.current, camera)
    const { origin, direction } = raycaster.ray
    const ray: Ray = {
      origin: [origin.x, origin.y, origin.z],
      direction: [direction.x, direction.y, direction.z],
    }
    const world = useDesignStore.getState().world

    if (tool.activeType) {
      if (hover) hover.visible = false
      if (!ghost) return

      const placement = solvePlacement(world, ray, {
        type: tool.activeType,
        tier: tool.tier,
        rotation: tool.rotation,
        snap: tool.snap,
      })
      if (!placement) {
        ghost.visible = false
        tool.setGhost(null)
        return
      }

      const { spec, valid } = placement
      ghost.visible = true
      ghost.position.set(spec.x, spec.y, spec.z)
      ghost.rotation.set(0, spec.yaw, 0)
      const color = valid ? VALID_COLOR : INVALID_COLOR
      ghostMaterial.color.copy(color)
      ghostMaterial.emissive.copy(color)
      ghostEdgeMaterial.color.copy(color)
      tool.setGhost({ valid, problem: placement.problem, stability: placement.stability })
      return
    }

    if (ghost) ghost.visible = false
    if (!hover) return
    const hit = raycast(world, ray)
    const piece = hit?.pieceId ? world.pieces.get(hit.pieceId) : undefined
    hover.visible = Boolean(piece) && piece!.id !== tool.selectedId
    if (piece) {
      hover.geometry = pieceEdges(piece.type)
      hover.position.set(piece.x, piece.y, piece.z)
      hover.rotation.set(0, piece.yaw, 0)
    }
  })

  return (
    <>
      {activeType && (
        <mesh
          ref={ghostRef}
          geometry={pieceGeometry(activeType)}
          material={ghostMaterial}
          raycast={noRaycast}
          renderOrder={2}
          visible={false}
        >
          <lineSegments
            geometry={pieceEdges(activeType)}
            material={ghostEdgeMaterial}
            raycast={noRaycast}
          />
        </mesh>
      )}
      <lineSegments
        ref={hoverRef}
        geometry={pieceEdges('foundation')}
        material={hoverMaterial}
        raycast={noRaycast}
        visible={false}
      />
    </>
  )
}
