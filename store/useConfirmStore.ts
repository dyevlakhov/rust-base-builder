import { create } from 'zustand'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  /** `destructive` (the default) paints the confirm button oxide red. */
  tone?: 'destructive' | 'neutral'
  onConfirm: () => void
}

interface ConfirmState {
  request: ConfirmRequest | null
  /** Ask the user to confirm a destructive action. */
  confirm: (request: ConfirmRequest) => void
  accept: () => void
  dismiss: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,

  confirm: (request) => set({ request }),

  accept: () => {
    const { request } = get()
    set({ request: null })
    request?.onConfirm()
  },

  dismiss: () => set({ request: null }),
}))

/** Imperative helper for call sites that are not React components. */
export function requestConfirmation(request: ConfirmRequest) {
  useConfirmStore.getState().confirm(request)
}
