# Visual QA checklist

The automated suite covers the grid maths, the placement rules and the store. It
covers none of the rendering, and that is on purpose: an assertion that a mesh
exists would not have caught a single one of the render bugs this project has
actually had. Those were a triangle with no vertex normals rendering black, an
environment map that blanked the whole canvas, a sky clipped by the camera's far
plane, and a texture that loaded but was never drawn because its material was
never flagged dirty. Every one of them built, linted and typechecked cleanly.

So: run this by hand before merging anything that touches the scene, and always
before and after a three.js, React Three Fiber or drei upgrade. Capture
screenshots both times and compare them side by side — several of these
regressions are a shift in tone, not a missing object.

## Setup

```bash
npm run dev
```

Place a small reference base: four square foundations in a 2 × 2, walls around
the perimeter, a doorway, a triangle foundation on an outer edge, and a floor
over part of it. Keep it, it is reused below.

## Scene

- [ ] The grid is visible, fades with distance, and its every-fourth line is
      picked out in orange.
- [ ] The sky renders as a gradient. A flat grey background means the dome is
      being clipped by the camera's far plane.
- [ ] Pieces cast shadows onto the ground. No stripes or acne on lit surfaces.
- [ ] Nothing z-fights where a wall meets a foundation.

## Materials

The one that breaks most often. Check every tier.

- [ ] Twig reads as pale tan with a stick pattern.
- [ ] Twig reads as pale bark / sticks.
- [ ] Wood reads as weathered planks.
- [ ] Stone reads as grey stacked slate.
- [ ] Sheet Metal reads as grey corrugated iron, not white.
- [ ] Armored reads as dark heavy plates, still legible rather than black.
- [ ] Textures tile at the same scale on a wall face, a wall edge and a
      foundation side — nothing is stretched.
- [ ] No tier is washed out to white, and none is crushed to black.
- [ ] Surface detail is visible on all of them. Flat, untextured colour means
      the maps loaded but the material was not flagged `needsUpdate`.

## Triangles

- [ ] A triangle foundation is lit, not black. Black means the geometry lost its
      vertex normals.
- [ ] It is equilateral and sits **outside** the piece it attached to, flush
      against that edge.
- [ ] Triangles chain off triangles; six around a point close a hexagon.
- [ ] A wall snaps onto a triangle's slanted edge at 60°.
- [ ] A floor triangle attaches to a floor on its own storey, not to the
      foundation below.

## Placement preview

- [ ] The ghost follows the cursor without lag.
- [ ] It is blue where placement is legal and red where it is not, and the HUD
      gives the reason and the stability.
- [ ] On an upper storey, from a low camera angle, the ghost lands where the
      cursor points.
- [ ] R flips a wall ghost.
- [ ] The piece that appears on click matches the ghost exactly, in position and
      rotation.
- [ ] Dragging to orbit does not build a piece.

## Selection

- [ ] Clicking a piece selects it and opens the inspector.
- [ ] The selected piece gets a yellow outline, visible through other pieces.
- [ ] The outline follows the triangle silhouette on a triangle, not a box.
- [ ] Clicking empty ground clears the selection.
- [ ] Hovering highlights, and stops highlighting while placing.

## Camera

- [ ] Left drag orbits, right drag pans, scroll zooms.
- [ ] TOP, FRONT and SIDE each move the camera, eased rather than snapped.
- [ ] Clicking the **already active** view button re-frames the scene.
- [ ] Arrow keys pan, and the direction matches the label — right goes right.
- [ ] The camera cannot be orbited below the ground.

## Interface

- [ ] Resource totals in the header match the pieces placed; triangles cost half.
- [ ] The inspector shows stability, and demolishing warns how many pieces
      will collapse with it.
- [ ] Undo / redo buttons and Ctrl+Z / Ctrl+Shift+Z work, including after a
      demolition.
- [ ] Export, then Import, restores the same base.
- [ ] Clear and Demolish open the styled dialog, never a browser `confirm`.
- [ ] Escape closes the dialog; Escape cancels placement mode.
- [ ] Delete demolishes the selected piece, via the dialog.

## Persistence

- [ ] Reload: the base comes back.
- [ ] No hydration warning in the console.
- [ ] Clear, then reload: it stays cleared.

## Performance

- [ ] Around fifty pieces still feels smooth while orbiting.
- [ ] Placing a piece does not stutter. Only the new piece's mesh should
      re-render.
- [ ] The console is clean. No warnings, and no leftover logging.
