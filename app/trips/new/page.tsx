'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HeroPicker } from '@/components/trips/HeroPicker'
import { mutations } from '@/lib/db/mutations'
import { supabase } from '@/lib/supabase/client'
import { resizeImage } from '@/lib/utils/image-resize'
import { db } from '@/lib/db'
import type { Database } from '@/lib/supabase/types'

type TripType = Database['public']['Enums']['trip_type']

const TYPES: { value: TripType; label: string }[] = [
  { value: 'sport', label: 'Sport (skate, surf urbain…)' },
  { value: 'hike', label: 'Randonnée' },
  { value: 'beach', label: 'Mer / surf' },
  { value: 'city_break', label: 'City break' },
  { value: 'road_trip', label: 'Road trip' },
  { value: 'other', label: 'Autre' },
]

export default function NewTripPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [type, setType] = useState<TripType>('sport')
  const [heroUrl, setHeroUrl] = useState<string | null>('/heroes/sport/1.jpg')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const tripId = crypto.randomUUID()
    const joinCode = `MKT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    await mutations.trip.create({
      id: tripId,
      owner_id: user.id,
      name,
      destination: destination || null,
      trip_type: type,
      currency: 'EUR',
      join_code: joinCode,
      hero_image_url: pendingFile ? null : heroUrl,
      hero_image_uploaded: false,
    })

    if (pendingFile) {
      const blob = await resizeImage(pendingFile)
      await db.pending_uploads.add({
        id: crypto.randomUUID(),
        trip_id: tripId,
        file: blob,
        filename: `${crypto.randomUUID()}.jpg`,
        status: 'pending',
        attempts: 0,
        created_at: Date.now(),
      })
      // (flush des pending_uploads — Task 41 / Phase 5.5)
    }

    setLoading(false)
    router.push(`/trips/${tripId}` as any)
  }

  return (
    <main className="min-h-screen bg-paper p-5 pb-24">
      <div className="mk-eyebrow text-ink-mute">NOUVEAU VOYAGE</div>
      <h1 className="mk-display text-3xl mt-2">On part où ?</h1>

      <div className="mt-6 space-y-3">
        <Input
          placeholder="Nom du voyage"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Destination (libre)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <select
          value={type}
          onChange={(e) => {
            const t = e.target.value as TripType
            setType(t)
            setHeroUrl(`/heroes/${t}/1.jpg`)
            setPendingFile(null)
          }}
          className="w-full h-10 px-3 rounded-sm border border-input bg-background text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <HeroPicker
          type={type}
          value={heroUrl}
          onChange={(url) => {
            setHeroUrl(url)
            setPendingFile(null)
          }}
          onFileSelected={(f) => {
            setPendingFile(f)
            setHeroUrl(URL.createObjectURL(f))
          }}
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={!name || loading}
        className="w-full mt-6"
      >
        {loading ? 'Création…' : 'Créer le voyage'}
      </Button>
    </main>
  )
}
