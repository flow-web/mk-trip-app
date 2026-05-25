'use client'

import { useEffect, useCallback, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { getTour, type TourId } from '@/lib/onboarding/tours'

const STORAGE_PREFIX = 'mk_onboarding_seen_'

function hasSeen(tourId: TourId): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tourId}`) === '1'
  } catch {
    return false
  }
}

function markSeen(tourId: TourId): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tourId}`, '1')
  } catch {}
}

export function usePageTour(tourId: TourId, delay = 800) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    if (hasSeen(tourId)) return

    const steps = getTour(tourId)
    if (steps.length === 0) return

    const timer = setTimeout(() => {
      const firstEl = document.querySelector(steps[0].element as string)
      if (!firstEl) return

      const d = driver({
        showProgress: true,
        showButtons: ['next', 'close'],
        nextBtnText: 'Suivant',
        prevBtnText: 'Précédent',
        doneBtnText: 'Compris !',
        progressText: '{{current}} / {{total}}',
        steps,
        onDestroyed: () => markSeen(tourId),
      })
      driverRef.current = d
      d.drive()
    }, delay)

    return () => {
      clearTimeout(timer)
      driverRef.current?.destroy()
    }
  }, [tourId, delay])

  const replay = useCallback(() => {
    const steps = getTour(tourId)
    if (steps.length === 0) return
    const d = driver({
      showProgress: true,
      showButtons: ['next', 'close'],
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Compris !',
      progressText: '{{current}} / {{total}}',
      steps,
    })
    driverRef.current = d
    d.drive()
  }, [tourId])

  return { replay }
}
