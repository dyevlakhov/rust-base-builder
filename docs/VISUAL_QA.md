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
- [ ] Wood reads as mid brown with plank grain.
- [ ] Stone reads as grey with visible aggregate.
- [ ] Sheet Metal reads as blue-grey with corrugation and a highlight.
- [ ] Armored reads as olive-green, still legible rather than black.
- [ ] No tier is washed out to white, and none is crushed to black.
- [ ] Surface detail is visible on all of them. Flat, untextured colour means
      the maps loaded but the material was not flagged `needsUpdate`.

## Triangles

- [ ] A triangle foundation is lit, not black. Black means the geometry lost its
      vertex normals.
- [ ] It sits **outside** the square it attached to, flush against that edge,
      with no overlap.
- [ ] Moving the cursor around a square swings it between all four edges, and it
      rotates to face outwards each time.
- [ ] A floor triangle attaches to a floor on its own storey, not to the
      foundation below.

## Placement preview

- [ ] The ghost follows the cursor without lag.
- [ ] It is tinted the current tier's colour where placement is legal, and red
      where it is not.
- [ ] Its orange outline is visible.
- [ ] Walls show the small cone marking their facing.
- [ ] The piece that appears on click matches the ghost exactly, in position and
      rotation.

## Selection

- [ ] Clicking a piece selects it and opens the inspector.
- [ ] The selected piece gets a yellow outline and a slow pulse.
- [ ] The outline follows the triangle silhouette on a triangle, not a box.
- [ ] Clicking empty ground clears the selection.
- [ ] Hovering highlights, and stops highlighting while placing.

## Camera

- [ ] Left drag orbits, right drag pans, scroll zooms.
- [ ] TOP, FRONT and SIDE each move the camera, eased rather than snapped.
- [ ] Clicking the **already active** view button re-frames the scene.
- [ ] Arrow keys pan, and the direction matches the label — right goes right.
- [ ] Arrow keys inside the inspector's number fields edit the number and do not
      move the camera.
- [ ] The camera cannot be orbited below the ground.

## Interface

- [ ] Resource totals in the header match the pieces placed, gears included.
- [ ] Editing X/Y/Z in the inspector works, and typing a decimal is not fought
      by re-rendering.
- [ ] A value like `0.15` is displayed as `0.15`, not rounded to `0.1`.
- [ ] Clear and Demolish open the styled dialog, never a browser `confirm`.
- [ ] Escape closes the dialog; Escape cancels placement mode.
- [ ] Delete demolishes the selected piece, via the dialog.

## Persistence

- [ ] Reload: the base comes back.
- [ ] No hydration warning in the console.
- [ ] Clear, then reload: it stays cleared.

## Performance

- [ ] Around fifty pieces still feels smooth while orbiting.
- [ ] Placing a piece does not stutter. A hitch here means procedural textures
      are being regenerated per block instead of per tier.
- [ ] The console is clean. No warnings, and no leftover logging.
