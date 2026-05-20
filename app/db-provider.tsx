'use client'

import { useEffect, type ReactNode } from 'react'
import { hydrateAllTrips } from '@/lib/db/hydrate'
import { flush, refreshStatus } from '@/lib/db/queue'

export function DbProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refreshStatus()
      if (cancelled) return
      try { await hydrateAllTrips() } catch (e) { console.warn('hydrate failed', e) }
      if (cancelled) return
      flush()
    })()
    return () => { cancelled = true }
  }, [])
  return <>{children}</>
}
