/// <reference types="node" />
// scripts/seed-sudouest.ts — Seed le voyage "Sud-Ouest skate" pour valider
// l'accent skate vs city_break du Portugal.
//
// Idempotence : on supprime d'abord le trip existant par join_code (cascade DB
// vers days/activities/spots/expenses/checklist/guide via FK), puis on insère.
// Usage : npm run seed:sudouest -- <owner-email>

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(
    'Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const TARGET_EMAIL = process.argv[2]
if (!TARGET_EMAIL) {
  console.error('Usage: npm run seed:sudouest -- <owner-email>')
  process.exit(1)
}

const JOIN_CODE = 'MKT-SO26'

const supa = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false },
})

async function main() {
  // 1. Trouver le profile correspondant à l'email
  const { data: usersList, error: usersErr } = await supa.auth.admin.listUsers()
  if (usersErr) throw usersErr
  const user = usersList.users.find((u) => u.email === TARGET_EMAIL)
  if (!user) {
    console.error(`No auth user matching ${TARGET_EMAIL}`)
    process.exit(1)
  }
  const ownerId = user.id

  // 2. Supprimer l'ancien trip avec ce join_code (si exists)
  const { data: existing } = await supa
    .from('trips')
    .select('id')
    .eq('join_code', JOIN_CODE)
    .maybeSingle()
  if (existing) {
    await supa.from('trips').delete().eq('id', existing.id)
    console.log(`Existing trip ${existing.id} purged.`)
  }

  // 3. Générer les UUIDs
  const tripId = crypto.randomUUID()
  const dayIds = Array.from({ length: 7 }, () => crypto.randomUUID())
  const themes = [
    'Bayonne',
    'Anglet',
    'Hossegor',
    'Capbreton',
    'Mimizan',
    'Lacanau',
    'Bordeaux',
  ]

  // 4. Insert trip
  await supa.from('trips').insert({
    id: tripId,
    owner_id: ownerId,
    name: 'Sud-Ouest skate',
    destination: 'Bayonne → Bordeaux',
    trip_type: 'sport',
    currency: 'EUR',
    total_budget: 800,
    cover_color: '#C75A20',
    join_code: JOIN_CODE,
    start_date: '2026-05-28',
    end_date: '2026-06-04',
    hero_image_url: '/heroes/sport/1.jpg',
  })

  // 5. trip_members (owner)
  await supa.from('trip_members').insert({
    trip_id: tripId,
    user_id: ownerId,
    role: 'owner',
  })

  // 6. Days
  const days = dayIds.map((id, i) => ({
    id,
    trip_id: tripId,
    day_number: i + 1,
    date: new Date(Date.UTC(2026, 4, 28 + i)).toISOString().slice(0, 10),
    label: `Jour ${i + 1}`,
    theme: themes[i],
    zone: 'sud-ouest',
  }))
  await supa.from('days').insert(days)

  // 7. Activities (4 par jour)
  const activities = days.flatMap((d) => [
    {
      id: crypto.randomUUID(),
      day_id: d.id,
      time: '09:30',
      title: 'Café + briefing',
      subtitle: 'Bouge ce van',
      category: 'food' as const,
      position: 0,
    },
    {
      id: crypto.randomUUID(),
      day_id: d.id,
      time: '11:00',
      title: `Skatepark de ${d.theme}`,
      subtitle: 'Spot · Bowl béton',
      category: 'sport' as const,
      position: 1,
    },
    {
      id: crypto.randomUUID(),
      day_id: d.id,
      time: '14:30',
      title: 'Session vidéo',
      subtitle: 'GoPro + drone',
      category: 'sport' as const,
      position: 2,
    },
    {
      id: crypto.randomUUID(),
      day_id: d.id,
      time: '19:30',
      title: 'Bouffe — Chez Manu',
      subtitle: 'Tapas · 28€/tête',
      category: 'food' as const,
      position: 3,
    },
  ])
  await supa.from('activities').insert(activities)

  // 8. Spots
  const spots = [
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      name: 'Skatepark Bayonne',
      category: 'sport' as const,
      lat: 43.4929,
      lng: -1.4748,
      tags: ['bowl', 'street'],
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      name: 'Anglet Skatepark',
      category: 'sport' as const,
      lat: 43.4942,
      lng: -1.532,
      tags: ['bowl'],
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      name: 'Hossegor Spot',
      category: 'sport' as const,
      lat: 43.6671,
      lng: -1.396,
      tags: ['indoor'],
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      name: 'Airbnb Hossegor',
      category: 'accommodation' as const,
      lat: 43.668,
      lng: -1.4,
      tags: [],
    },
  ]
  await supa.from('spots').insert(spots)

  // 9. Expenses
  const expenses = [
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      payer_id: ownerId,
      amount: 4820,
      currency: 'EUR',
      category: 'transport' as const,
      note: 'Plein Total',
      spent_at: '2026-05-28T11:30:00Z',
      split_mode: 'equal' as const,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      payer_id: ownerId,
      amount: 2340,
      currency: 'EUR',
      category: 'food' as const,
      note: 'Boulangerie Aupy',
      spent_at: '2026-05-28T09:15:00Z',
      split_mode: 'equal' as const,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      payer_id: ownerId,
      amount: 9800,
      currency: 'EUR',
      category: 'hotel' as const,
      note: 'Airbnb Hossegor',
      spent_at: '2026-05-29T18:00:00Z',
      split_mode: 'equal' as const,
    },
  ]
  await supa.from('expenses').insert(expenses)

  // 10. Checklist matos skate
  const checklist = [
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      label: 'Board principale + roues de spare',
      category: 'gear' as const,
      position: 0,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      label: 'Casque + genouillères',
      category: 'gear' as const,
      position: 1,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      label: 'GoPro + 3 batteries',
      category: 'gear' as const,
      position: 2,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      label: 'Pharmacie crew',
      category: 'gear' as const,
      position: 3,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      label: 'Câbles + chargeurs van',
      category: 'gear' as const,
      position: 4,
    },
  ]
  await supa.from('checklist_items').insert(checklist)

  // 11. Guide cards
  await supa.from('guide_cards').insert([
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      kind: 'info' as const,
      title: 'Local crew',
      body: 'Demander au local crew avant de tourner. Toujours OK.',
      icon_name: 'Users',
      position: 0,
    },
    {
      id: crypto.randomUUID(),
      trip_id: tripId,
      kind: 'warning' as const,
      title: 'Casque obligatoire',
      body: 'Bowl deep end de Bayonne. Pas de discussion.',
      icon_name: 'AlertTriangle',
      position: 1,
    },
  ])

  console.log(`✓ Sud-Ouest skate seeded (trip ${tripId})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
