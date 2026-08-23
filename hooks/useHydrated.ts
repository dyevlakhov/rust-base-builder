'use client'

import { useEffect, useState } from 'react'

/**
 * False during server rendering and on the first client render, true afterwards.
 *
 * The builder store restores itself from localStorage as soon as its module is
 * evaluated, so by the time React hydrates it may already hold a saved design
 * that the server-rendered HTML knows nothing about. Anything that prints
 * persisted data into the DOM has to render the empty version first and fill in
 * on the next pass, or React reports a hydration mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
