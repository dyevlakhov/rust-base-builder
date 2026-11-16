import { PieceType, ResourceCost } from '@/engine'

/**
 * Silhouettes of the building pieces, drawn for this app. Walls are seen
 * face-on, so their openings read at a glance; decks are seen from above at an
 * angle, with slab thickness telling a foundation from a floor.
 */

interface IconProps {
  size?: number
  className?: string
}

const TOP = { fill: 'currentColor', fillOpacity: 0.32 }
const SIDE = { fill: 'currentColor', fillOpacity: 0.14 }
const FACE = { fill: 'currentColor', fillOpacity: 0.22, fillRule: 'evenodd' as const }

/** Isometric square slab of the given thickness. */
function Slab({ thickness, hole }: { thickness: number; hole?: boolean }) {
  const t = thickness
  const top = 'M12 4 L21 9 L12 14 L3 9 Z'
  const inner = 'M12 7 L15.6 9 L12 11 L8.4 9 Z'
  return (
    <>
      <path d={`M3 9 L12 14 L12 ${14 + t} L3 ${9 + t} Z`} {...SIDE} />
      <path d={`M12 14 L21 9 L21 ${9 + t} L12 ${14 + t} Z`} {...SIDE} />
      <path d={hole ? `${top} ${inner}` : top} {...TOP} fillRule="evenodd" />
    </>
  )
}

/** Equilateral triangle slab, apex away from the viewer. */
function TriangleSlab({ thickness, hole }: { thickness: number; hole?: boolean }) {
  const t = thickness
  const top = 'M12 4 L20.5 13 L3.5 13 Z'
  const inner = 'M12 8 L15.6 11.4 L8.4 11.4 Z'
  return (
    <>
      <path d={`M3.5 13 L20.5 13 L20.5 ${13 + t} L3.5 ${13 + t} Z`} {...SIDE} />
      <path d={hole ? `${top} ${inner}` : top} {...TOP} fillRule="evenodd" />
    </>
  )
}

const DRAWINGS: Record<PieceType, React.ReactNode> = {
  foundation: <Slab thickness={5} />,
  'foundation-triangle': <TriangleSlab thickness={5} />,
  floor: <Slab thickness={1.6} />,
  'floor-triangle': <TriangleSlab thickness={1.6} />,
  'floor-frame': <Slab thickness={1.6} hole />,
  'floor-triangle-frame': <TriangleSlab thickness={1.6} hole />,
  wall: <path d="M5 4 H19 V20 H5 Z" {...FACE} />,
  'wall-half': <path d="M5 12 H19 V20 H5 Z" {...FACE} />,
  'wall-low': <path d="M5 15 H19 V20 H5 Z" {...FACE} />,
  doorway: <path d="M5 20 V4 H19 V20 H14.5 V11 H9.5 V20 Z" {...FACE} />,
  window: <path d="M5 4 H19 V20 H5 Z M9.5 8 V12.5 H14.5 V8 Z" {...FACE} />,
  'wall-frame': <path d="M5 20 V4 H19 V20 H16.8 V6.6 H7.2 V20 Z" {...FACE} />,
}

export function PieceIcon({ type, size = 24, className }: IconProps & { type: PieceType }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      aria-hidden
    >
      {DRAWINGS[type]}
    </svg>
  )
}

const RESOURCES: Record<keyof ResourceCost, React.ReactNode> = {
  // A log end with growth rings.
  wood: (
    <>
      <circle cx="12" cy="12" r="7.5" {...TOP} />
      <circle cx="12" cy="12" r="4.5" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="none" />
    </>
  ),
  // A faceted rock.
  stone: (
    <>
      <path d="M4 15 L7 7 L14 4.5 L20 9 L19 17 L11 19.5 Z" {...TOP} />
      <path d="M7 7 L11 12 L19 17 M11 12 L14 4.5 M11 12 L11 19.5" fill="none" />
    </>
  ),
  // A hex nut: scrap metal.
  metalFragments: (
    <>
      <path d="M12 3.5 L19.4 7.75 V16.25 L12 20.5 L4.6 16.25 V7.75 Z" {...TOP} />
      <circle cx="12" cy="12" r="3.2" fill="none" />
    </>
  ),
  // An ingot.
  hqm: (
    <>
      <path d="M7 9 H17 L20.5 16 H3.5 Z" {...TOP} />
      <path d="M7 9 L5.5 12.5 M17 9 L18.5 12.5" fill="none" />
    </>
  ),
}

export function ResourceIcon({
  resource,
  size = 18,
  className,
}: IconProps & { resource: keyof ResourceCost }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      aria-hidden
    >
      {RESOURCES[resource]}
    </svg>
  )
}
