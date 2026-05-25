'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useGeolocationTracker } from '@/lib/segments/useGeolocationTracker'
import { useWakeLock } from '@/lib/segments/useWakeLock'
import { RunHUD } from '@/components/segments/RunHUD'
import { CountdownGo } from '@/components/segments/CountdownGo'
import { createSegmentFromRun } from '@/lib/segments/actions'
import { ACTIVITY_LABELS } from '@/lib/segments/types'
import type { ActivityKind } from '@/lib/segments/types'

type Step = 'intro' | 'countdown' | 'tracking' | 'review'

const ACTIVITIES: ActivityKind[] = ['skate', 'run', 'bike', 'car', 'walk', 'other']

export function LiveCreateClient() {
  const router = useRouter()
  const tracker = useGeolocationTracker()
  const [step, setStep] = useState<Step>('intro')
  const [name, setName] = useState('')
  const [activity, setActivity] = useState<ActivityKind>('skate')
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useWakeLock(step === 'tracking')

  const begin = () => setStep('countdown')

  const onGo = () => {
    setStartedAt(new Date().toISOString())
    tracker.start()
    setStep('tracking')
  }

  const onStop = () => {
    tracker.stop()
    setStep('review')
  }

  const save = async () => {
    if (!name.trim() || !startedAt) return
    setSaving(true)
    setError(null)
    try {
      const seg = await createSegmentFromRun({
        name: name.trim(),
        activity,
        points: tracker.points,
        durationMs: tracker.stats.durationMs,
        startedAt,
      })
      router.replace(`/segments/${seg.id}` as any)
    } catch (e: any) {
      setError(e.message ?? 'Erreur')
      setSaving(false)
    }
  }

  if (step === 'intro') {
    return (
      <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Créer un segment</h1>
        <p className="text-ink-muted dark:text-ink-muted-dark">
          On va enregistrer ton 1er run. Va au point de départ, choisis l'activité, et tape "Démarrer".
        </p>

        <div>
          <label className="text-sm font-medium block mb-2">Activité</label>
          <div className="flex gap-2 flex-wrap">
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActivity(a)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  activity === a
                    ? 'bg-ink text-paper border-ink'
                    : 'border-hairline dark:border-hairline-dark'
                }`}
              >
                {ACTIVITY_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={begin}
          className="py-4 rounded-2xl bg-ink text-paper font-semibold"
        >
          Démarrer
        </button>
      </div>
    )
  }

  if (step === 'countdown') {
    return <CountdownGo onGo={onGo} />
  }

  if (step === 'tracking') {
    return (
      <RunHUD
        startedAt={Date.parse(startedAt!)}
        currentSpeedKmh={tracker.currentSpeedKmh}
        distanceM={tracker.stats.distanceM}
        accuracyM={tracker.currentAccuracyM}
        onStop={onStop}
      />
    )
  }

  // step === 'review'
  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Récap du run</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Durée</div>
          <div className="text-xl font-semibold tabular-nums">
            {Math.floor(tracker.stats.durationMs / 1000)}s
          </div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Distance</div>
          <div className="text-xl font-semibold tabular-nums">{tracker.stats.distanceM}m</div>
        </div>
        <div className="bg-paper-muted dark:bg-paper-muted-dark rounded-xl p-3">
          <div className="text-xs opacity-60">Vit. moy</div>
          <div className="text-xl font-semibold tabular-nums">
            {tracker.stats.speedAvgKmh.toFixed(1)}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Nom du segment</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Bowl du skatepark des Quinconces"
          className="w-full px-3 py-2 rounded-xl border border-hairline dark:border-hairline-dark bg-paper dark:bg-paper-dark"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={!name.trim() || saving || tracker.points.length < 2}
        className="py-4 rounded-2xl bg-ink text-paper font-semibold disabled:opacity-50"
      >
        {saving ? 'Création…' : 'Créer le segment'}
      </button>

      <button
        type="button"
        onClick={() => {
          tracker.reset()
          setStep('intro')
        }}
        className="text-sm text-ink-muted dark:text-ink-muted-dark"
      >
        Recommencer
      </button>
    </div>
  )
}
