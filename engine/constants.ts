/**
 * Canonical building dimensions, in metres.
 *
 * Rust has no global building grid: every piece hangs off a socket on a piece
 * that is already there. What it does have is a fixed module — every square and
 * triangle has 3 m edges, every full wall is 3 m tall and one storey is exactly
 * one wall high — and the rest of the engine is derived from these numbers.
 */

/** Edge length of every square and triangle piece, and the length of a wall. */
export const CELL = 3

/** Height of a full wall and the vertical distance between two floors. */
export const STOREY = 3

/** A foundation is a solid block that the first storey stands on. */
export const FOUNDATION_HEIGHT = 1

/**
 * Floors hang inside the top of the walls they rest on, so the top surface of
 * a floor is exactly one storey above the surface below it.
 */
export const FLOOR_THICKNESS = 0.15

export const WALL_THICKNESS = 0.24

export const SQRT3 = Math.sqrt(3)

/** Centroid to edge midpoint of an equilateral triangle piece. */
export const TRIANGLE_INRADIUS = CELL / (2 * SQRT3)

/** Centroid to corner of an equilateral triangle piece. */
export const TRIANGLE_CIRCUMRADIUS = CELL / SQRT3

/** Two positions closer than this are the same position. */
export const EPS = 0.02

/** Spans that overlap by less than this merely touch. */
export const VERTICAL_TOLERANCE = 0.05

/**
 * Collision footprints are shrunk from the visual ones so that pieces meeting
 * exactly at an edge or a corner never count as overlapping:
 *
 *   - a deck (foundation or floor) is inset further than half a wall thickness,
 *     so a wall standing on its edge does not intersect it;
 *   - a wall is shortened at both ends, so walls meeting at a corner — at 90°
 *     on squares or 60° on triangles — do not intersect each other.
 */
export const DECK_INSET = 0.15
export const WALL_END_CLEARANCE = 0.4
export const WALL_SIDE_CLEARANCE = 0.02

/** Angle a single press of the rotate key turns a free-standing piece by. */
export const ROTATION_STEP = Math.PI / 12
