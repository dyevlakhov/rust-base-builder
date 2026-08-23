# Building engine

How pieces are sized, snapped, stacked and rejected. Everything here is enforced
by the tests in `tests/`; if this file and the code disagree, the code wins and
this file is a bug.

## Dimensions

All of them live in `types/building-blocks.ts` and are exported as constants.
Nothing re-declares them, so the collision maths and the rendered mesh cannot
drift apart — that is checked in `tests/dimensions.test.ts`.

| Constant            | Value | Meaning                                      |
| ------------------- | ----- | -------------------------------------------- |
| `FOUNDATION_SIZE`   | 3     | Cell size, in metres. One square foundation. |
| `FOUNDATION_HEIGHT` | 0.3   | Foundation slab thickness                    |
| `WALL_HEIGHT`       | 3     | Full wall                                    |
| `WALL_THICKNESS`    | 0.15  |                                              |
| `FLOOR_HEIGHT`      | 0.2   |                                              |
| `TRIANGLE_DEPTH`    | 1.5   | How far a triangle reaches past its edge     |

Derived: `FOUNDATION_TOP` = 0.3, `WALL_TOP` = 3.3.

| Piece                         | Size (x, y, z) | Default centre Y |
| ----------------------------- | -------------- | ---------------- |
| Square foundation             | 3 × 0.3 × 3    | 0.15             |
| Triangle foundation           | 3 × 0.3 × 1.5  | 0.15             |
| Wall                          | 3 × 3 × 0.15   | 1.8              |
| Half wall                     | 3 × 1.5 × 0.15 | 1.05             |
| Low wall                      | 3 × 1 × 0.15   | 0.8              |
| Doorway / window / wall frame | 3 × 3 × 0.15   | 1.8              |
| Square floor                  | 3 × 0.2 × 3    | 3.4              |
| Triangle floor                | 3 × 0.2 × 1.5  | 3.4              |
| Floor frame                   | 3 × 0.2 × 3    | 3.4              |

Piece categories come from the template, never from the name. `floor-frame` and
`wall-frame` both contain "frame"; classifying by substring made a floor frame
behave like a 3 m wall.

## The grid

Cells are 3 × 3 and centred on odd multiples of 1.5, so cell centres are at
1.5, 4.5, 7.5, … and grid lines at 0, 3, 6, …

Only X and Z are ever snapped. Y is decided by stacking.

- **Foundations and floors** snap to the nearest cell centre.
- **Walls** snap to the nearest of the four edges of the cell under the cursor,
  and auto-rotate: a wall on a vertical grid line runs north-south, otherwise
  east-west.
- **Triangles** attach to an edge of a square piece and point outwards.

## Triangles

A triangle is an isosceles prism whose base spans one full 3 m edge and whose
apex reaches 1.5 m beyond it. It attaches to the nearest edge of the nearest
square piece of the same category — a foundation triangle to a square
foundation, a floor triangle to a square floor on the same storey — and its
centroid lands `3/2 + 1.5/3 = 2 m` from that square's centre.

The apex direction follows from the Y rotation as `(sin θ, cos θ)`: 0 points
south (+Z), π/2 east, π north, −π/2 west.

With nothing to attach to, the triangle falls back to the nearest empty cell and
attaches to that.

Attaching **outwards** matters. The earlier version snapped a triangle to a
_corner_ of a square using a centroid offset, which put it inside the square it
had just snapped to — an overlap that no rotation could fix.

## Stacking

`calculateYPosition` looks for the highest piece below the cursor and rests the
new piece on top of it.

- Foundations always sit on the ground.
- Walls look only at their own edge, within 0.1 m, so a foundation in the middle
  of a cell does not lift a wall on its edge. With nothing below, a wall falls
  back to its default height, which already assumes a foundation underneath.
- Floors look within 2.2 m, which reaches the walls around their cell.

So a wall on a foundation is centred at 1.8, a floor on those walls at 3.4, and
a second-storey wall on that floor stacks from the floor's top surface.

## Collision

Each piece claims one or more named horizontal **slots**. Two pieces collide when
they claim the same slot _and_ their vertical spans genuinely overlap — touching
exactly face to face is allowed, within a 0.05 m tolerance.

| Piece                     | Slot                           |
| ------------------------- | ------------------------------ |
| Square foundation / floor | its grid cell                  |
| Triangle                  | the whole cell it reaches into |
| Wall                      | the cell edge it snapped to    |

Consequences worth knowing:

- Two foundations cannot share a cell; a foundation and a floor above it can.
- Walls stack cleanly because their spans only touch.
- A wall and a foundation never collide: they claim different kinds of slot.
- A triangle cannot reach into a cell a square already fills.
- Two triangles cannot share a cell even when they would geometrically fit.
  That is a deliberate simplification, chosen because it can never allow a
  visible overlap.

Slot coordinates are quantised to two decimals, and `-0` is normalised to `0` —
without that, a coordinate a hair below a grid line produced a different key and
two walls on the same edge both passed the check.

## resolvePlacement

The one entry point. Given the point where the cursor meets the ground plane it:

1. snaps horizontally, using a probe height so that everything counts as "below";
2. resolves Y by stacking at that position;
3. snaps again now that the storey is known, which is what lets a floor triangle
   find the square on its own level;
4. computes the auto-rotation;
5. checks collision.

It returns `{ position, rotation, valid }`. The placement preview and the click
handler both call it, so the ghost and the piece that gets built cannot differ.
