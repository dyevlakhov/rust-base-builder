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
components/
  Scene3D.tsx       Canvas, grid, HUD
  scene/
    Pieces.tsx            One memoised mesh per piece
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
- Geometry is extruded from 2D outlines: doorways, windows and frames have real
  openings, edges are bevelled, and UVs are in metres so textures tile at real
  size on every face. One geometry per piece type, shared by all pieces.
- One material per tier, shared by all pieces (see [MATERIALS.md](./MATERIALS.md)).
- The ghost and hover outline are moved by writing to three.js objects in
  `useFrame`, never through React state.

## Known limits

- One mesh per piece. Instancing (one draw call per type × tier) is the next
  rendering step.
- No stairs, roofs, doors or deployables yet; no upkeep or raid cost.
- Health is a tier property; nothing damages a piece.
