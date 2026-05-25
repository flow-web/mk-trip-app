'use client'

import { useEffect, useRef } from 'react'

type Sentinel = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

type WakeLockNav = {
  wakeLock?: { request: (type: 'screen') => Promise<Sentinel> }
}

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<Sentinel | null>(null)

  useEffect(() => {
    const wakeLock = (navigator as unknown as WakeLockNav).wakeLock
    if (!active || !wakeLock) return

    let cancelled = false
    const acquire = async () => {
      try {
        const s = await wakeLock.request('screen')
        if (cancelled) {
          await s.release()
          return
        }
        sentinelRef.current = s
        s.addEventListener('release', () => {
          sentinelRef.current = null
        })
      } catch {
        // permission denied or unavailable — silent
      }
    }
    acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinelRef.current?.release()
      sentinelRef.current = null
    }
  }, [active])
}
