'use client'

import { useState } from 'react'
import { Plus, Users, Trash2 } from 'lucide-react'
import { Eyebrow } from '@/components/design/Eyebrow'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Circle {
  id: string
  name: string
  members: string[]
  createdAt: string
}

const STORAGE_KEY = 'mk_circles'

function getCircles(): Circle[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveCircles(circles: Circle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(circles))
}

export default function CirclesPage() {
  const [circles, setCircles] = useState<Circle[]>(() => getCircles())
  const [newName, setNewName] = useState('')
  const [newMembers, setNewMembers] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    const members = newMembers.split(',').map((m) => m.trim()).filter(Boolean)
    const circle: Circle = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      members,
      createdAt: new Date().toISOString(),
    }
    const updated = [...circles, circle]
    setCircles(updated)
    saveCircles(updated)
    setNewName('')
    setNewMembers('')
  }

  function handleDelete(id: string) {
    const updated = circles.filter((c) => c.id !== id)
    setCircles(updated)
    saveCircles(updated)
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark pb-24 md:max-w-[720px] md:mx-auto p-6">
      <Eyebrow className="text-ink-mute dark:text-ink-mute-dark">CERCLES D'AMIS</Eyebrow>
      <h1 className="mk-display text-4xl mt-2">
        Tes crews<br />
        <span className="mk-display-italic" style={{ color: '#C75A20' }}>de voyage.</span>
      </h1>
      <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-2 max-w-[320px]">
        Crée des groupes d'amis réutilisables pour tes prochains voyages.
      </p>

      <div className="mt-6 space-y-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du cercle (ex: Le crew skate)" />
        <Input value={newMembers} onChange={(e) => setNewMembers(e.target.value)} placeholder="Membres (séparés par des virgules)" />
        <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Créer le cercle
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {circles.length === 0 && (
          <div className="text-center py-8 text-ink-mute">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div className="text-sm">Aucun cercle. Crée ton premier crew !</div>
          </div>
        )}
        {circles.map((c) => (
          <div key={c.id} className="bg-white dark:bg-paper-dark-deep rounded-md border border-hairline dark:border-hairline-dark p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-lg">{c.name}</div>
                <div className="mk-mono text-[10px] text-ink-mute mt-0.5">
                  {c.members.length} membre{c.members.length > 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-mute hover:text-red-600 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {c.members.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.members.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded-pill bg-paper dark:bg-paper-dark text-xs">{m}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
