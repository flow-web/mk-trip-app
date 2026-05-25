'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, X } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'

interface Photo {
  id: string
  spotId: string | null
  spotName: string
  url: string
  addedAt: string
}

const STORAGE_PREFIX = 'mk_album_'

function getPhotos(tripId: string): Photo[] {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${tripId}`) ?? '[]')
  } catch { return [] }
}

function savePhotos(tripId: string, photos: Photo[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, JSON.stringify(photos))
  } catch {
    // localStorage full — silently fail, data stays in state only
  }
}

export default function AlbumPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const spots = useLiveQuery(() => db.spots.where({ trip_id: tripId }).toArray(), [tripId]) ?? []
  const [photos, setPhotos] = useState<Photo[]>(() => getPhotos(tripId))
  const [selectedSpotId, setSelectedSpotId] = useState<string>('none')

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  function handleUpload(files: FileList | null) {
    if (!files) return
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const spot = selectedSpotId !== 'none' ? spots.find((s) => s.id === selectedSpotId) : null
      newPhotos.push({
        id: crypto.randomUUID(),
        spotId: spot?.id ?? null,
        spotName: spot?.name ?? 'Général',
        url,
        addedAt: new Date().toISOString(),
      })
    }
    const updated = [...photos, ...newPhotos]
    setPhotos(updated)
    savePhotos(tripId, updated)
  }

  function removePhoto(id: string) {
    const photo = photos.find((p) => p.id === id)
    if (photo?.url.startsWith('blob:')) URL.revokeObjectURL(photo.url)
    const updated = photos.filter((p) => p.id !== id)
    setPhotos(updated)
    savePhotos(tripId, updated)
  }

  const groupedBySpot = new Map<string, Photo[]>()
  for (const p of photos) {
    const key = p.spotName
    if (!groupedBySpot.has(key)) groupedBySpot.set(key, [])
    groupedBySpot.get(key)!.push(p)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <TripSwitcher tone="light" tripName={trip.name} tripType={trip.trip_type} sublabel={trip.destination ?? undefined} />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">SOUVENIRS</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          L'album<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>photo.</span>
        </h1>

        <div className="mt-6 flex gap-2">
          <select
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className="flex-1 h-10 px-3 rounded-sm border border-input bg-background text-sm"
          >
            <option value="none">Général</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label className="h-10 px-4 rounded-sm bg-ink text-white flex items-center gap-2 cursor-pointer text-sm font-medium">
            <Camera className="w-4 h-4" />
            Ajouter
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>

        {photos.length === 0 && (
          <div className="mt-12 text-center text-ink-mute">
            <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="text-sm">Aucune photo. Ajoute tes souvenirs !</div>
          </div>
        )}

        {[...groupedBySpot.entries()].map(([spotName, spotPhotos]) => (
          <div key={spotName} className="mt-6">
            <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark text-[10px] mb-2">{spotName.toUpperCase()}</div>
            <div className="grid grid-cols-3 gap-1 rounded-md overflow-hidden">
              {spotPhotos.map((p) => (
                <div key={p.id} className="relative aspect-square group">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
