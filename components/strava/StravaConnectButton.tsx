'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function StravaConnectButton() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setConnected(false)
      const { count } = await supabase
        .from('strava_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setConnected((count ?? 0) > 0)
    })
  }, [])

  const handleConnect = () => {
    window.location.href = '/api/strava/auth'
  }

  const handleDisconnect = async () => {
    setLoading(true)
    await fetch('/api/strava/disconnect', { method: 'POST' })
    setConnected(false)
    setLoading(false)
  }

  const handleSync = async () => {
    setLoading(true)
    await fetch('/api/strava/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setLoading(false)
  }

  if (connected === null) return null

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-3 rounded-xl bg-[#FC4C02] px-5 py-3 text-white font-semibold shadow-md hover:bg-[#e04400] transition-colors"
      >
        <StravaLogo />
        Connecter Strava
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-green-700 dark:text-green-400 text-sm font-medium">
        <StravaLogo />
        Strava connecté
      </div>
      <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
        {loading ? 'Sync...' : 'Synchroniser'}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={loading}>
        Déconnecter
      </Button>
    </div>
  )
}

function StravaLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}
