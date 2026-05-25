'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeRunStats } from './geo'
import type { TracePoint, RunStats } from './types'

type TrackerStatus = 'idle' | 'tracking' | 'stopped' | 'error'

interface TrackerState {
  status: TrackerStatus
  points: TracePoint[]
  stats: RunStats
  error?: string
  currentSpeedKmh: number
  currentAccuracyM?: number
}

export function useGeolocationTracker() {
  const [state, setState] = useState<TrackerState>({
    status: 'idle',
    points: [],
    stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
    currentSpeedKmh: 0,
  })
  const watchIdRef = useRef<number | null>(null)
  const pointsRef = useRef<TracePoint[]>([])

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setState((s) => ({
      ...s,
      status: 'stopped',
      points: [...pointsRef.current],
      stats: computeRunStats(pointsRef.current),
    }))
  }, [])

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, status: 'error', error: 'Geolocation indisponible' }))
      return
    }
    pointsRef.current = []
    setState({
      status: 'tracking',
      points: [],
      stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
      currentSpeedKmh: 0,
    })
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: TracePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: pos.timestamp,
          accuracy: pos.coords.accuracy,
        }
        pointsRef.current.push(pt)
        const stats = computeRunStats(pointsRef.current)
        const speedFromBrowser =
          pos.coords.speed != null && !isNaN(pos.coords.speed)
            ? pos.coords.speed * 3.6
            : null
        setState({
          status: 'tracking',
          points: [...pointsRef.current],
          stats,
          currentSpeedKmh: speedFromBrowser ?? stats.speedAvgKmh,
          currentAccuracyM: pos.coords.accuracy,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          status: 'error',
          error: err.code === err.PERMISSION_DENIED ? 'Permission refusée' : err.message,
        }))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    )
  }, [])

  const reset = useCallback(() => {
    pointsRef.current = []
    setState({
      status: 'idle',
      points: [],
      stats: { durationMs: 0, distanceM: 0, speedAvgKmh: 0, speedMaxKmh: 0 },
      currentSpeedKmh: 0,
    })
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { ...state, start, stop, reset }
}
