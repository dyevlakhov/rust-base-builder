# Architecture

A single-page Next.js app with no backend. Three layers, each depending only on
the ones below it:

```
ui (components/, hooks/)        panels, HUD, shortcuts
  │
store/                          React-facing state: the base + history, the tool
  │
render/ + components/scene/     three.js meshes, materials, the build controller
  │
engine/                         pure TypeScript: pieces, sockets, collision,
                                stability, raycast, commands, saving
```

`engine/` imports nothing from React or three.js. Everything that decides what
can be built lives there and is unit tested.

## Layout

```
engine/
  constants.ts      Canonical dimensions
  catalog.ts        Piece types, tiers, cost and health
  math.ts           Vectors, angles, SAT, ray distances
  pieces.ts         Piece model, footprints, deck edges, bounds
  world.ts          Immutable World, spatial hash, patches
  support.ts        Who holds whom up; stability
  collision.ts      Overlap test
  raycast.ts        Ray against pieces and the ground
  placement.ts      Sockets and solvePlacement
  commands.ts       place / remove (with collapse) / setTier / clear / replace
  serialize.ts      Save format
store/
  useDesignStore.ts The World, undo/redo, persistence
  useToolStore.ts   Active piece, tier, rotation, snap, selection, view mode
  useConfirmStore.ts
render/
  geometry.ts       Extruded meshes per piece type, with real openings
  materials.ts      One PBR material per tier
  quality.ts        Quality levels and the frame monitor
components/
  Scene3D.tsx       Canvas, grid, HUD
  scene/
    Pieces.tsx            Instanced buckets per type × tier
    RenderDriver.tsx      On-demand invalidation, adaptive quality, AO
    PerfProbe.tsx         `?perf` overlay
    BuildController.tsx   Pointer → engine raycast → ghost / build / select
    SelectionOutline.tsx
    CameraRig.tsx, SceneEnvironment.tsx
  Header.tsx, BlockPalette.tsx, BlockDetailsPanel.tsx, ...
tests/              Vitest: engine and store
```

## Data flow

```
pointer ──▶ BuildController ──ray──▶ solvePlacement(world, ray, tool)
                 │                         │
                 │◀──── Placement ─────────┘   ghost drawn every frame
                 │
     click ──────┴──▶ useDesignStore.place(spec)
                              │  placeCommand re-validates
                              ▼
                         Patch ──▶ applyPatch ──▶ new World
                              │                      │
                         past / future          Pieces re-render
                         (undo / redo)          only what changed
```

## State

The base is an immutable `World`: a map of pieces plus a spatial hash. Each
change produces a new `World` from a `Patch`, so:

- derived data — stability, piece lists — is cached per `World` in a `WeakMap`;
- history is a list of patches, inverted for undo;
- pieces that did not change keep their object identity, and `memo` skips their
  meshes.

Hot paths read stores imperatively (`getState()`) instead of subscribing: the
per-frame ghost, the click handler and the keyboard shortcuts.

Only the base is persisted (in the save format), plus the tier and snap
preferences. Components that print persisted data guard their first render
with `useHydrated` to avoid a hydration mismatch.

## Rendering

- Picking goes through the engine's raycast, not three.js meshes. The renderer
  is free to draw pieces however it likes.
- **Instanced.** One `InstancedMesh` per piece type × tier, so a base costs a
  few dozen draw calls whatever its size. Buckets are carried along patches
  like the engine's derived data: building a piece re-uploads one bucket.
- **On demand.** The canvas uses `frameloop="demand"` and draws nothing while
  idle. Prop changes ask for a frame by themselves; `RenderDriver` wires up
  the rest — store changes, textures finishing loading — and the build
  controller and camera rig ask while the cursor, a view transition or a held
  key needs frames.
- **Adaptive quality.** `render/quality.ts` has three levels (pixel ratio,
  ambient occlusion, shadow map size). A monitor steps down when frames
  rendered back to back get slow and back up when there is headroom; idle gaps
  between on-demand frames are ignored. `?quality=low|medium|high` pins a level.
- The sun's shadow camera is fitted to the base's bounds.
- Geometry is extruded from 2D outlines: doorways, windows and frames have real
  openings, edges are bevelled, and UVs are in metres so textures tile at real
  size on every face. One geometry per piece type, shared by all pieces.
- One material per tier, shared by all pieces (see [MATERIALS.md](./MATERIALS.md)).
- The ghost and hover outline are moved by writing to three.js objects in
  `useFrame`, never through React state.

## Performance

The engine keeps derived data per immutable `World` and updates it from the
parent world and the patch instead of recomputing:

- per-piece footprints, edges and bounds are memoised by object;
- the support graph (who holds whom up) is copied from the parent and only the
  links of added or removed pieces are rediscovered;
- stability is updated incrementally: adds propagate outwards, removals reset
  and re-search only what depended on the removed pieces, tier changes reuse
  the parent's values;
- raycasts walk the spatial hash cells along the ray instead of testing every
  piece.

Measured on a 2400-piece base (three storeys, all tiers), production build:

|                                         | Before         | After        |
| --------------------------------------- | -------------- | ------------ |
| Draw calls per frame                    | 1586           | 37           |
| CPU in `renderer.render`                | 15.3 ms        | 1.6 ms       |
| Frame time while orbiting, median / p95 | 16.7 / 26.2 ms | 8.3 / 9.8 ms |
| Frames rendered while idle              | every frame    | none         |
| Stability after building a piece        | 91 ms          | 0.2 ms       |
| Demolishing a load-bearing ground wall  | 171 ms         | 3.3 ms       |
| Raycast                                 | 603 µs         | 40 µs        |
| Snapping the ghost, per frame           | 1.6–1.8 ms     | 0.5–0.75 ms  |

With ambient occlusion on (high quality) the same base orbits at about 60 fps.
`?perf` shows an FPS meter and publishes draw calls and render time on
`window.__rbbPerf`; `?perf=spin` keeps the camera turning for measurements.

## Known limits

- Loading a large base runs one full stability search (about 50 ms at 2400
  pieces); every later change is incremental.
- No stairs, roofs, doors or deployables yet; no upkeep or raid cost.
- Health is a tier property; nothing damages a piece.
