import { PieceType, Tier, isPieceType, isTier } from './catalog'
import { normalizeAngle } from './math'
import { newPieceId } from './commands'
import { Piece } from './pieces'
import { World } from './world'

export const SAVE_FORMAT = 'rust-base-builder'
export const SAVE_VERSION = 2

/** One piece as `[type, tier, x, y, z, yaw]` — compact enough for a share link. */
export type SavedPiece = [PieceType, Tier, number, number, number, number]

export interface SaveFile {
  format: typeof SAVE_FORMAT
  version: typeof SAVE_VERSION
  pieces: SavedPiece[]
}

const round = (value: number) => Math.round(value * 1e4) / 1e4 + 0

export function serialize(world: World): SaveFile {
  return {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    pieces: [...world.pieces.values()].map((p) => [
      p.type,
      p.tier,
      round(p.x),
      round(p.y),
      round(p.z),
      round(p.yaw),
    ]),
  }
}

export class SaveFormatError extends Error {}

/**
 * Read a saved base. Ids are regenerated. Malformed entries are skipped rather
 * than failing the whole file; a file that is not a save at all throws.
 */
export function deserialize(data: unknown): Piece[] {
  if (!data || typeof data !== 'object') throw new SaveFormatError('Not a saved base')
  const record = data as Record<string, unknown>

  if (record.format !== SAVE_FORMAT || !Array.isArray(record.pieces)) {
    throw new SaveFormatError('Not a saved base')
  }
  if (typeof record.version !== 'number' || record.version > SAVE_VERSION) {
    throw new SaveFormatError('This base was saved by a newer version of the app')
  }

  return record.pieces.flatMap(readSavedPiece)
}

function readSavedPiece(entry: unknown): Piece[] {
  if (!Array.isArray(entry) || entry.length !== 6) return []
  const [type, tier, x, y, z, yaw] = entry
  if (!isPieceType(type) || !isTier(tier)) return []
  if (![x, y, z, yaw].every((n) => typeof n === 'number' && Number.isFinite(n))) return []
  return [{ id: newPieceId(), type, tier, x, y, z, yaw: normalizeAngle(yaw) }]
}
