# Architecture

A single-page Next.js app. There is no backend, no API and no database: the whole
design lives in one Zustand store and is mirrored to `localStorage`.

## Layout

```
app/
  layout.tsx              Metadata, fonts, global CSS
  page.tsx                The only route: header, palette, canvas, details panel
components/
  Header.tsx              View modes, resource totals, export, clear
  BlockPalette.tsx        Tier picker and the list of placeable pieces
  BlockDetailsPanel.tsx   Inspector for the selected piece
  BlockIcon.tsx           Icon lookup for block types and categories
  Scene3D.tsx             <Canvas>, ground plane, grid, HUD overlays
  scene/
    CameraRig.tsx         View-mode framing and arrow-key panning
    SceneEnvironment.tsx  Lights, sky, and the generated environment map
    BuildingBlockMesh.tsx One placed piece
    PlacementPreview.tsx  The ghost that follows the cursor
  ui/
    ConfirmDialog.tsx     Replacement for window.confirm
    NumberField.tsx       Number input that does not fight the user
hooks/
  useAppShortcuts.ts      Escape and Delete
  useHydrated.ts          First-render guard for persisted data
store/
  useBuilderStore.ts      Blocks, selection, tier, view mode; persistence
  useConfirmStore.ts      Pending confirmation request
types/
  building-blocks.ts      Block types, canonical dimensions, tier properties
utils/
  snapUtils.ts            Grid snapping and triangle attachment
  placementUtils.ts       Heights, stacking, collision, resolvePlacement
  geometry.ts             Shared unit geometries
  textureLoader.ts        PBR maps, with procedural fallbacks
  resources.ts            Cost formatting and totals
  dom.ts                  Small DOM helpers
tests/                    Vitest suite for the pure logic
```

## Data flow

```
BlockPalette ──sets placementMode──▶ store
                                      │
                            PlacementPreview reads it,
                            raycasts the ground each frame,
                            and calls resolvePlacement()
                                      │
                                      ▼
                        { position, rotation, valid }
                                      │
    click on the ground plane ────────┴──▶ store.addBlock()
                                                  │
                                                  ▼
                                   BuildingBlockMesh per block
```

The important part is that the preview and the click handler call the **same**
`resolvePlacement`. In the original code the snap, the height, the auto-rotation
and the collision check were each written out three times — in the preview, in
the click handler and in the store — and the copies had already drifted apart.

## State

`useBuilderStore` holds `blocks`, `selectedBlockId`, `currentTier`, `viewMode`,
`snapToGrid` and `placementMode`. Components subscribe field by field so that
placing a piece does not re-render the palette.

Anything on the hot path reads the store imperatively with
`useBuilderStore.getState()` rather than subscribing — the per-frame preview and
the click handler both do this, so they never need to be rebuilt when a piece is
added.

`blocks`, `currentTier` and `snapToGrid` are persisted. Because the store
restores itself as soon as its module is evaluated, anything that prints
persisted data into the DOM guards its first render with `useHydrated`, or React
reports a hydration mismatch.

## Rendering

- Every piece is a unit-sized geometry stretched by the mesh `scale`, so one
  `BoxGeometry` and one triangular prism are shared by the whole scene.
- The triangular prism is built with `ExtrudeGeometry` so that winding, normals
  and UVs are generated rather than hand-written.
- Image-based lighting comes from three's own `RoomEnvironment`, pre-filtered
  once with `PMREMGenerator`. drei's `Environment preset` was deliberately
  dropped: it fetches an HDRI from a third-party CDN at runtime.
- The placement preview writes straight to the three.js objects inside
  `useFrame` instead of going through React state.

## Deliberate limitations

- No undo/redo.
- Import is not implemented; export writes JSON.
- Health is a property of the tier, not a simulation — nothing damages a piece.
- A triangle claims the whole cell it reaches into, so two triangles never share
  a cell even where they would geometrically fit.
