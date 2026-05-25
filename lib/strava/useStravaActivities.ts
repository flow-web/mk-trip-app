'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StravaActivityRow } from './queries'

export function useStravaActivities(tripId: string | null) {
  const [activities, setActivities] = useState<StravaActivityRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tripId) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('strava_activities')
      .select('id, name, sport_type, distance, moving_time, elapsed_time, total_elevation, start_date, start_latlng, end_latlng, average_speed, max_speed, polyline, trip_id')
      .eq('trip_id', tripId)
      .order('start_date', { ascending: true })
      .then(({ data }) => {
        setActivities(data ?? [])
        setLoading(false)
      })
  }, [tripId])

  return { activities, loading }
}
