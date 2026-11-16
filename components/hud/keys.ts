import { PIECE_ORDER, PieceType } from '@/engine'

/** Hotbar keys, in hotbar order: the number row, left to right. */
export const HOTBAR_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='] as const

export const HOTBAR: readonly { type: PieceType; key: string }[] = PIECE_ORDER.map((type, i) => ({
  type,
  key: HOTBAR_KEYS[i],
}))

export function pieceForKey(key: string): PieceType | null {
  return HOTBAR.find((slot) => slot.key === key)?.type ?? null
}
