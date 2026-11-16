# Building engine

How pieces attach, stack, collide and hold each other up. The engine lives in
`engine/` — pure TypeScript with no React and no three.js — and every rule here
is covered by the tests in `tests/`. If this file and the code disagree, the
code wins and this file is a bug.

## Sockets, not a grid

Rust has no global building grid. Every piece hangs off a socket on a piece that
is already there, and the engine works the same way:

| Source                | Socket                   | Builds                                    |
| --------------------- | ------------------------ | ----------------------------------------- |
| Deck edge             | neighbour                | a deck of the same kind sharing that edge |
| Deck edge             | wall base                | a wall standing on the edge               |
| Full wall top         | wall base                | a wall one storey up                      |
| Full or half wall top | floor edge (either side) | a floor whose top is flush with the wall  |

A _deck_ is a foundation or a floor, square or triangle. Positions come from the
source piece, so a triangle can hang off a triangle, a wall can stand on a 60°
edge, and a whole base can follow a foundation placed at any angle.

The first foundation stands on its own on the ground. With **Snap to grid** on
it lands on a 3 m world grid cell (triangles on a 0.5 m grid); with it off it
goes exactly where the cursor is. R turns it in 15° steps.

## Dimensions

All in `engine/constants.ts`.

| Constant            | Value | Meaning                                        |
| ------------------- | ----- | ---------------------------------------------- |
| `CELL`              | 3     | Edge of every square and triangle; wall length |
| `STOREY`            | 3     | Full wall height and the step between floors   |
| `FOUNDATION_HEIGHT` | 1     | Foundations are solid blocks                   |
| `FLOOR_THICKNESS`   | 0.15  | Floors hang inside the top of their walls      |
| `WALL_THICKNESS`    | 0.24  |                                                |

Triangles are **equilateral** with 3 m sides, as in the game — six of them
around a point close a hexagon. A piece's `x`/`z` is the centre of a square,
the centroid of a triangle or the midpoint of a wall; `y` is its bottom.

Levels: foundation tops at 1 m, then every 3 m — 4, 7, 10… Walls start on a
level, floor tops sit on the next one.

## Aiming

`solvePlacement(world, ray, tool)` is the one entry point, used by the ghost,
by the click that builds and by the tests:

1. Raycast the world (`engine/raycast.ts`: exact ray / prism tests, then the
   ground plane).
2. Collect the sockets of every piece near the ray, up to what it hit. Not only
   near the hit point — aiming into the air above a wall puts the hit on the
   ground far behind the base.
3. Score each socket by how close the ray passes to the vertical axis of the
   piece it would build. The ghost lands where the user is looking, on any
   storey and from any camera angle.
4. Fully validate the closest few; prefer a free socket over a blocked one
   that is nearer by less than a metre.

With no socket within 2 m a foundation stands free; any other piece is shown at
the cursor and marked unsupported.

## Collision

Pieces are convex prisms. Two collide when their vertical spans overlap and
their **shrunken** footprints overlap (separating axis test):

- decks are inset by 0.15 m — more than half a wall's thickness, so a wall on
  a deck's edge never counts as intersecting it;
- walls are shortened by 0.4 m at each end, so walls meeting at a 90° or 60°
  corner do not intersect each other.

Openings in doorways and frames are ignored; nothing can be built inside them.

## Stability

Foundations stand at 100%. Every other piece takes the best stability among the
pieces holding it up, times a factor for how it is held:

| Held up by → piece | Factor |
| ------------------ | ------ |
| foundation → wall  | 1.0    |
| floor → wall       | 0.9    |
| wall → wall        | 0.9    |
| wall → floor       | 1.0    |
| floor → floor      | 0.5    |

A piece below 10% cannot be built. So a floor overhangs three tiles past its
last wall (50%, 25%, 12.5%), and walls lose 10% per storey above the first.
This reproduces the familiar limits; the factors are not datamined.

Stability for the whole base is a widest-path search from the foundations,
computed once per world and cached.

## Demolition

Removing a piece also removes everything whose stability drops below 10%
because of it — the same collapse the game does — as a single undoable step.
The confirm dialog says how many pieces will come down.

## Commands and history

Every change goes through a command in `engine/commands.ts` that returns a
`Patch` (`remove` + `add`) or `null` when the change is not allowed. The store
applies patches and keeps them for undo/redo; it re-validates placements
itself, so no part of the UI can build something the rules forbid.

## Saving

`serialize` writes `{ format, version: 2, pieces: [type, tier, x, y, z, yaw][] }`.
The same format is used for `localStorage` and for exported files. `deserialize`
skips malformed entries and rejects anything that is not a save.
