'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ViewMode, useBuilderStore } from '@/store/useBuilderStore'
import { isTypingTarget } from '@/utils/dom'

export const VIEW_POSITIONS: Record<ViewMode, [number, number, number]> = {
  '3d': [18, 14, 18],
  // A hair off the Y axis, otherwise the camera's up vector and its view
  // direction become parallel and OrbitControls loses its orientation.
  top: [0, 34, 0.01],
  front: [0, 7, 26],
  side: [26, 7, 0],
}

const PAN_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'])

const PAN_SPEED = 12
const ORIGIN = new THREE.Vector3(0, 0, 0)
const ARRIVAL_DISTANCE = 0.05

type OrbitLikeControls = {
  target: THREE.Vector3
  update: () => void
}

/**
 * Owns the camera: eases it to the position for the current view mode, and pans
 * it with the arrow keys.
 *
 * `<Canvas camera={...} />` is only read when the canvas mounts, so switching
 * view mode has to move the camera imperatively — which also lets the change be
 * eased instead of snapped.
 */
export function CameraRig() {
  const viewMode = useBuilderStore((state) => state.viewMode)
  const viewEpoch = useBuilderStore((state) => state.viewEpoch)
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as OrbitLikeControls | null

  const destination = useRef(new THREE.Vector3(...VIEW_POSITIONS['3d']))
  const moving = useRef(false)
  const pressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    destination.current.set(...VIEW_POSITIONS[viewMode])
    moving.current = true
    // `viewEpoch` is the actual trigger: re-picking the current mode must also
    // re-frame, after the user has orbited away from it.
  }, [viewMode, viewEpoch])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!PAN_KEYS.has(event.key) || isTypingTarget(event.target)) return
      pressed.current.add(event.key)
      // Taking manual control cancels an in-flight view transition.
      moving.current = false
      event.preventDefault()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!PAN_KEYS.has(event.key)) return
      pressed.current.delete(event.key)
    }

    const clear = () => pressed.current.clear()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clear)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clear)
    }
  }, [])

  useFrame((_, delta) => {
    if (pressed.current.size > 0) {
      panCamera(camera, controls, pressed.current, delta)
      return
    }

    if (!moving.current) return

    // Frame-rate independent easing towards the destination.
    const alpha = 1 - Math.pow(0.0001, delta)
    camera.position.lerp(destination.current, alpha)

    if (controls) {
      controls.target.lerp(ORIGIN, alpha)
      controls.update()
    } else {
      // OrbitControls registers itself a frame or two after the canvas mounts;
      // until then, keep the camera aimed at the origin ourselves.
      camera.lookAt(ORIGIN)
    }

    if (controls && camera.position.distanceTo(destination.current) < ARRIVAL_DISTANCE) {
      camera.position.copy(destination.current)
      controls?.target.copy(ORIGIN)
      controls?.update()
      moving.current = false
    }
  })

  return null
}

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const movement = new THREE.Vector3()

function panCamera(
  camera: THREE.Camera,
  controls: OrbitLikeControls | null,
  keys: Set<string>,
  delta: number
) {
  camera.getWorldDirection(forward)
  forward.y = 0
  if (forward.lengthSq() === 0) forward.set(0, 0, -1)
  forward.normalize()
  // right = forward x up, for up = (0, 1, 0)
  right.set(-forward.z, 0, forward.x)

  movement.set(0, 0, 0)
  if (keys.has('ArrowUp')) movement.add(forward)
  if (keys.has('ArrowDown')) movement.sub(forward)
  if (keys.has('ArrowRight')) movement.add(right)
  if (keys.has('ArrowLeft')) movement.sub(right)
  if (keys.has('PageUp')) movement.y += 1
  if (keys.has('PageDown')) movement.y -= 1

  if (movement.lengthSq() === 0) return

  movement.normalize().multiplyScalar(PAN_SPEED * delta)
  camera.position.add(movement)

  // Move the orbit pivot with the camera, otherwise panning turns into orbiting.
  if (controls) {
    controls.target.add(movement)
    controls.update()
  }
}
