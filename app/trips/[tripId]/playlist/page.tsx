'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Music, Plus, Trash2, ExternalLink } from 'lucide-react'
import { db } from '@/lib/db'
import { accentFor } from '@/lib/design/accent'
import { supabase } from '@/lib/supabase/client'
import { TripSwitcher } from '@/components/design/TripSwitcher'
import { Eyebrow } from '@/components/design/Eyebrow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PlaylistEntry {
  id: string
  url: string
  title: string
  addedBy: string
  addedAt: string
}

const STORAGE_KEY_PREFIX = 'mk_playlist_'

function getEntries(tripId: string): PlaylistEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tripId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(tripId: string, entries: PlaylistEntry[]) {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${tripId}`, JSON.stringify(entries))
}

function extractSpotifyId(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/)
  return match ? `${match[1]}/${match[2]}` : null
}

export default function PlaylistPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId])
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []
  const profMap = new Map(profiles.map((p) => [p.id, p]))

  const [entries, setEntries] = useState<PlaylistEntry[]>(() => getEntries(tripId))
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')

  if (!trip) return null
  const accent = accentFor(trip.trip_type)

  async function handleAdd() {
    if (!newUrl.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const entry: PlaylistEntry = {
      id: crypto.randomUUID(),
      url: newUrl.trim(),
      title: newTitle.trim() || 'Sans titre',
      addedBy: user?.id ?? 'unknown',
      addedAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(tripId, updated)
    setNewUrl('')
    setNewTitle('')
  }

  function handleRemove(id: string) {
    const updated = entries.filter((e) => e.id !== id)
    setEntries(updated)
    saveEntries(tripId, updated)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto">
      <div className="pt-12 px-5">
        <TripSwitcher
          tone="light"
          tripName={trip.name}
          tripType={trip.trip_type}
          sublabel={trip.destination ?? undefined}
        />
      </div>
      <div className="px-5 mt-4">
        <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">MUSIQUE</Eyebrow>
        <h1 className="mk-display text-4xl mt-1">
          La playlist<br />
          <span className="mk-display-italic" style={{ color: accent.base }}>
            du crew.
          </span>
        </h1>

        <div className="mt-6 space-y-3">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Lien Spotify (track, album, playlist)"
          />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre (optionnel)"
          />
          <Button onClick={handleAdd} disabled={!newUrl.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Ajouter à la playlist
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {entries.length === 0 && (
            <div className="text-center py-8">
              <Music className="w-10 h-10 text-ink-mute mx-auto mb-3" />
              <div className="text-sm text-ink-mute">
                Aucun morceau. Colle un lien Spotify pour commencer.
              </div>
            </div>
          )}
          {entries.map((entry) => {
            const spotifyPath = extractSpotifyId(entry.url)
            const addedByName = profMap.get(entry.addedBy)?.display_name ?? 'Inconnu'
            return (
              <div key={entry.id} className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark overflow-hidden">
                {spotifyPath && (
                  <iframe
                    src={`https://open.spotify.com/embed/${spotifyPath}?theme=0`}
                    width="100%"
                    height="80"
                    allow="encrypted-media"
                    loading="lazy"
                    className="border-0"
                  />
                )}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{entry.title}</div>
                    <div className="mk-mono text-[10px] text-ink-mute mt-0.5">
                      Ajouté par {addedByName}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-ink transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
