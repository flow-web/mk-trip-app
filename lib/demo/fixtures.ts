// lib/demo/fixtures.ts — Voyages fictifs complets pour le Mode Démo.
//
// Couple : Lina + Tom. Trois voyages illustrant les types principaux :
//   - Lisbonne (city_break, 4j, en cours)
//   - Corse (road_trip, 10j, à venir)
//   - Dolomites (hike, 6j, terminé)
//
// IDs préfixés `demo-` pour différencier des données réelles Supabase.

import type {
  LocalProfile,
  LocalTrip,
  LocalTripMember,
  LocalDay,
  LocalActivity,
  LocalActivityCompletion,
  LocalSpot,
  LocalExpense,
  LocalExpenseSplit,
  LocalChecklistItem,
  LocalChecklistCompletion,
  LocalGuideCard,
} from '@/lib/db/schema'

// Voyages additionnels — un fichier par voyage pour limiter la taille de ce module.
import {
  skateparkTrip,
  skateparkMembers,
  skateparkDays,
  skateparkActivities,
  skateparkCompletions,
  skateparkSpots,
  skateparkExpenses,
  skateparkSplits,
  skateparkChecklist,
  skateparkChecklistDone,
  skateparkGuide,
} from './fixtures-skatepark'
import {
  tokyoTrip,
  tokyoMembers,
  tokyoDays,
  tokyoActivities,
  tokyoCompletions,
  tokyoSpots,
  tokyoExpenses,
  tokyoSplits,
  tokyoChecklist,
  tokyoChecklistDone,
  tokyoGuide,
} from './fixtures-tokyo'
import {
  bretagneTrip,
  bretagneMembers,
  bretagneDays,
  bretagneActivities,
  bretagneCompletions,
  bretagneSpots,
  bretagneExpenses,
  bretagneSplits,
  bretagneChecklist,
  bretagneChecklistDone,
  bretagneGuide,
} from './fixtures-bretagne'

// IDs ré-exportés depuis ./ids pour préserver la rétro-compatibilité des imports
// existants. Le module dédié ./ids brise le cycle fixtures ↔ fixtures-*.
export {
  DEMO_USER_ID,
  DEMO_PARTNER_ID,
  DEMO_CAMILLE_ID,
  DEMO_YANIS_ID,
  DEMO_SAM_ID,
  DEMO_INES_ID,
} from './ids'
import {
  DEMO_USER_ID,
  DEMO_PARTNER_ID,
  DEMO_CAMILLE_ID,
  DEMO_YANIS_ID,
  DEMO_SAM_ID,
  DEMO_INES_ID,
} from './ids'

const NOW = new Date('2026-05-21T10:00:00Z').toISOString()

// ─── Profiles ────────────────────────────────────────────────────────────────
export const demoProfiles: LocalProfile[] = [
  {
    id: DEMO_USER_ID,
    display_name: 'Lina Mouret',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: DEMO_PARTNER_ID,
    display_name: 'Tom Brel',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: DEMO_CAMILLE_ID,
    display_name: 'Camille Suarez',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: DEMO_YANIS_ID,
    display_name: 'Yanis Faraj',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: DEMO_SAM_ID,
    display_name: 'Sam Mouret',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: DEMO_INES_ID,
    display_name: 'Inès Mouret',
    avatar_url: null,
    created_at: NOW,
    updated_at: NOW,
  },
]

// ─── Trips ───────────────────────────────────────────────────────────────────
export const demoTrips: LocalTrip[] = [
  {
    id: 'demo-trip-lisboa',
    owner_id: DEMO_USER_ID,
    name: 'Lisbonne à deux',
    destination: 'Lisbonne, Portugal',
    start_date: '2026-05-20',
    end_date: '2026-05-23',
    trip_type: 'city_break',
    currency: 'EUR',
    total_budget: 620,
    cover_color: '#C75A20',
    join_code: 'MKT-DEMO1',
    hero_image_url: '/heroes/city_break/2.jpg',
    hero_image_uploaded: false,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'demo-trip-corse',
    owner_id: DEMO_USER_ID,
    name: 'Corse en van',
    destination: 'Cap Corse → Bonifacio',
    start_date: '2026-06-20',
    end_date: '2026-06-29',
    trip_type: 'road_trip',
    currency: 'EUR',
    total_budget: 1800,
    cover_color: '#5A6E3E',
    join_code: 'MKT-DEMO2',
    hero_image_url: '/heroes/road_trip/3.jpg',
    hero_image_uploaded: false,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'demo-trip-dolomites',
    owner_id: DEMO_USER_ID,
    name: 'Alta Via 1',
    destination: 'Dolomites, Italie',
    start_date: '2026-03-01',
    end_date: '2026-03-06',
    trip_type: 'hike',
    currency: 'EUR',
    total_budget: 900,
    cover_color: '#1E3A5C',
    join_code: 'MKT-DEMO3',
    hero_image_url: '/heroes/hike/2.jpg',
    hero_image_uploaded: false,
    created_at: NOW,
    updated_at: NOW,
  },
  skateparkTrip,
  tokyoTrip,
  bretagneTrip,
]

// ─── Trip Members ────────────────────────────────────────────────────────────
// Lisbonne / Corse / Dolomites = couple Lina+Tom (logique simple).
// Les voyages additionnels (skatepark, tokyo, bretagne) ont leurs propres membres
// car la composition diffère (4 amis / solo / famille 4 pers).
const COUPLE_TRIP_IDS = ['demo-trip-lisboa', 'demo-trip-corse', 'demo-trip-dolomites']
export const demoTripMembers: LocalTripMember[] = [
  ...COUPLE_TRIP_IDS.flatMap((id) => [
    { trip_id: id, user_id: DEMO_USER_ID, role: 'owner' as const, joined_at: NOW },
    { trip_id: id, user_id: DEMO_PARTNER_ID, role: 'editor' as const, joined_at: NOW },
  ]),
  ...skateparkMembers,
  ...tokyoMembers,
  ...bretagneMembers,
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
type Cat = 'food' | 'culture' | 'nightlife' | 'nature' | 'accommodation' | 'activity' | 'sport'

function mkDay(tripId: string, n: number, date: string, theme: string, zone?: string, note?: string): LocalDay {
  return {
    id: `${tripId}-d${n}`,
    trip_id: tripId,
    day_number: n,
    date,
    label: `Jour ${n}`,
    theme,
    zone: zone ?? null,
    note: note ?? null,
    created_at: NOW,
    updated_at: NOW,
  }
}

function mkActivity(
  dayId: string,
  pos: number,
  time: string | null,
  title: string,
  subtitle: string | null,
  category: Cat,
): LocalActivity {
  return {
    id: `${dayId}-a${pos}`,
    day_id: dayId,
    time,
    title,
    subtitle,
    category,
    position: pos,
    created_at: NOW,
    updated_at: NOW,
  }
}

// ─── LISBONNE (city_break) ───────────────────────────────────────────────────
const LISBOA = 'demo-trip-lisboa'
const lisboaDays: LocalDay[] = [
  mkDay(LISBOA, 1, '2026-05-20', 'Arrivée · Alfama', 'Alfama'),
  mkDay(LISBOA, 2, '2026-05-21', 'Baixa · Chiado', 'Centre'),
  mkDay(LISBOA, 3, '2026-05-22', 'Belém · Pastel', 'Belém'),
  mkDay(LISBOA, 4, '2026-05-23', 'Marché · Retour', 'Time Out'),
]

const lisboaActivities: LocalActivity[] = [
  // J1
  mkActivity(`${LISBOA}-d1`, 0, '14:00', 'Atterrissage TP 433', 'Aéroport · Métro rouge', 'activity'),
  mkActivity(`${LISBOA}-d1`, 1, '16:30', 'Check-in Casa do Bairro', 'Alfama · 3 nuits', 'accommodation'),
  mkActivity(`${LISBOA}-d1`, 2, '18:00', 'Miradouro de Santa Luzia', 'Coucher de soleil', 'culture'),
  mkActivity(`${LISBOA}-d1`, 3, '20:30', 'Dîner — Taberna da Rua das Flores', '12 couverts, sans résa', 'food'),
  // J2
  mkActivity(`${LISBOA}-d2`, 0, '09:00', 'Café A Brasileira', 'Pastel de nata + bica', 'food'),
  mkActivity(`${LISBOA}-d2`, 1, '10:30', 'Tram 28 — Estrela → Graça', 'Y monter en début de ligne', 'activity'),
  mkActivity(`${LISBOA}-d2`, 2, '13:00', 'Time Out Market', 'Pastéis de bacalhau · 14€/tête', 'food'),
  mkActivity(`${LISBOA}-d2`, 3, '15:00', 'Livraria Bertrand', 'La plus vieille librairie au monde', 'culture'),
  mkActivity(`${LISBOA}-d2`, 4, '19:00', 'Fado au Mesa de Frades', 'Réservation obligatoire', 'nightlife'),
  // J3
  mkActivity(`${LISBOA}-d3`, 0, '08:30', 'Train Cais → Belém', '15 min · 1,50€', 'activity'),
  mkActivity(`${LISBOA}-d3`, 1, '09:30', 'Pastéis de Belém', 'Faire la queue ça vaut le coup', 'food'),
  mkActivity(`${LISBOA}-d3`, 2, '11:00', 'Mosteiro dos Jerónimos', '12€ · ouvre à 9h30', 'culture'),
  mkActivity(`${LISBOA}-d3`, 3, '14:30', 'MAAT — Musée d\'art & techno', 'Vue sur le Tage', 'culture'),
  mkActivity(`${LISBOA}-d3`, 4, '20:00', 'Cervejaria Ramiro', 'Crevettes XL · 35€/tête', 'food'),
  // J4
  mkActivity(`${LISBOA}-d4`, 0, '09:30', 'Marché LX Factory', 'Brunch · livres · concept stores', 'food'),
  mkActivity(`${LISBOA}-d4`, 1, '12:30', 'Check-out Casa do Bairro', '', 'accommodation'),
  mkActivity(`${LISBOA}-d4`, 2, '15:00', 'Aéroport · Vol TP 432', 'Boarding 14:30', 'activity'),
]

// J1 toutes faites, J2 partiellement (Lina a tout fait, Tom a sauté le café)
const lisboaCompletions: LocalActivityCompletion[] = [
  // J1 — toutes faites par les 2
  ...['0', '1', '2', '3'].flatMap((p) => [
    { activity_id: `${LISBOA}-d1-a${p}`, user_id: DEMO_USER_ID, completed_at: '2026-05-20T22:00:00Z' },
    { activity_id: `${LISBOA}-d1-a${p}`, user_id: DEMO_PARTNER_ID, completed_at: '2026-05-20T22:00:00Z' },
  ]),
  // J2 — Lina a tout fait
  ...['0', '1', '2'].map((p) => ({
    activity_id: `${LISBOA}-d2-a${p}`,
    user_id: DEMO_USER_ID,
    completed_at: '2026-05-21T14:00:00Z',
  })),
  // J2 — Tom skip le café matinal mais a fait le reste
  ...['1', '2'].map((p) => ({
    activity_id: `${LISBOA}-d2-a${p}`,
    user_id: DEMO_PARTNER_ID,
    completed_at: '2026-05-21T14:00:00Z',
  })),
]

const lisboaSpots: LocalSpot[] = [
  { id: `${LISBOA}-s1`, trip_id: LISBOA, day_id: `${LISBOA}-d1`, name: 'Casa do Bairro', description: 'Appart 2 chambres, vue tuiles', category: 'accommodation', zone: 'Alfama', lat: 38.7117, lng: -9.1303, price: '95€/nuit', tags: ['airbnb', 'central'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s2`, trip_id: LISBOA, day_id: `${LISBOA}-d1`, name: 'Miradouro de Santa Luzia', description: 'Le plus joli point de vue d\'Alfama', category: 'nature', zone: 'Alfama', lat: 38.7115, lng: -9.1294, price: null, tags: ['vue', 'gratuit'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s3`, trip_id: LISBOA, day_id: `${LISBOA}-d2`, name: 'Taberna da Rua das Flores', description: 'Petit, sans résa, magique', category: 'food', zone: 'Chiado', lat: 38.7106, lng: -9.1422, price: '30€/tête', tags: ['portugais', 'tapas'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s4`, trip_id: LISBOA, day_id: `${LISBOA}-d2`, name: 'Time Out Market', description: 'Halle de chefs', category: 'food', zone: 'Cais do Sodré', lat: 38.7066, lng: -9.1457, price: '15€/tête', tags: ['rapide'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s5`, trip_id: LISBOA, day_id: `${LISBOA}-d3`, name: 'Mosteiro dos Jerónimos', description: 'Chef-d\'œuvre manuélin', category: 'culture', zone: 'Belém', lat: 38.6979, lng: -9.2065, price: '12€', tags: ['unesco'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s6`, trip_id: LISBOA, day_id: `${LISBOA}-d3`, name: 'Pastéis de Belém', description: 'La recette originale depuis 1837', category: 'food', zone: 'Belém', lat: 38.6975, lng: -9.2030, price: '1,40€/pièce', tags: ['institution'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s7`, trip_id: LISBOA, day_id: `${LISBOA}-d1`, name: 'Mesa de Frades', description: 'Ancienne chapelle, fado vivant', category: 'nightlife', zone: 'Alfama', lat: 38.7130, lng: -9.1273, price: '45€ + boissons', tags: ['fado', 'résa'], created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-s8`, trip_id: LISBOA, day_id: `${LISBOA}-d4`, name: 'LX Factory', description: 'Concept stores · brunch · librairie Ler Devagar', category: 'culture', zone: 'Alcântara', lat: 38.7037, lng: -9.1750, price: 'libre', tags: ['shopping', 'café'], created_at: NOW, updated_at: NOW },
]

const lisboaExpenses: LocalExpense[] = [
  { id: `${LISBOA}-e1`, trip_id: LISBOA, payer_id: DEMO_USER_ID, amount: 28400, currency: 'EUR', category: 'hotel', note: 'Casa do Bairro · 3 nuits', spent_at: '2026-05-20T16:30:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e2`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 12600, currency: 'EUR', category: 'transport', note: 'Vols A/R Easyjet × 2', spent_at: '2026-04-12T11:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e3`, trip_id: LISBOA, payer_id: DEMO_USER_ID, amount: 6800, currency: 'EUR', category: 'food', note: 'Taberna das Flores', spent_at: '2026-05-20T22:30:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e4`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 850, currency: 'EUR', category: 'food', note: 'Bicas + pastéis', spent_at: '2026-05-21T09:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e5`, trip_id: LISBOA, payer_id: DEMO_USER_ID, amount: 600, currency: 'EUR', category: 'transport', note: 'Tickets tram 28 × 2', spent_at: '2026-05-21T10:45:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e6`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 2800, currency: 'EUR', category: 'food', note: 'Time Out · plats', spent_at: '2026-05-21T13:30:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e7`, trip_id: LISBOA, payer_id: DEMO_USER_ID, amount: 9000, currency: 'EUR', category: 'activity', note: 'Soirée fado Mesa de Frades', spent_at: '2026-05-21T19:00:00Z', split_mode: 'custom', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e8`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 2400, currency: 'EUR', category: 'activity', note: 'Mosteiro Jerónimos × 2', spent_at: '2026-05-22T11:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e9`, trip_id: LISBOA, payer_id: DEMO_USER_ID, amount: 7000, currency: 'EUR', category: 'food', note: 'Cervejaria Ramiro — crevettes', spent_at: '2026-05-22T20:30:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e10`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 1850, currency: 'EUR', category: 'shopping', note: 'Carreaux azulejos + bouquin', spent_at: '2026-05-22T16:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-e11`, trip_id: LISBOA, payer_id: DEMO_PARTNER_ID, amount: 4500, currency: 'EUR', category: 'settlement', note: 'Remboursement → Lina', spent_at: '2026-05-23T10:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
]

const lisboaSplits: LocalExpenseSplit[] = lisboaExpenses.flatMap((e) => {
  if (e.id === `${LISBOA}-e7`) {
    return [
      { expense_id: e.id, user_id: DEMO_USER_ID, share: 0.6 },
      { expense_id: e.id, user_id: DEMO_PARTNER_ID, share: 0.4 },
    ]
  }
  if (e.id === `${LISBOA}-e11`) {
    return [{ expense_id: e.id, user_id: DEMO_USER_ID, share: 1 }]
  }
  return [
    { expense_id: e.id, user_id: DEMO_USER_ID, share: 0.5 },
    { expense_id: e.id, user_id: DEMO_PARTNER_ID, share: 0.5 },
  ]
})

const lisboaChecklist: LocalChecklistItem[] = [
  { id: `${LISBOA}-c1`, trip_id: LISBOA, label: 'Passeports + photos secours', category: 'docs', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c2`, trip_id: LISBOA, label: 'Cartes bancaires + Revolut', category: 'docs', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c3`, trip_id: LISBOA, label: 'Adaptateur prise type F', category: 'gear', position: 2, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c4`, trip_id: LISBOA, label: 'Réserver Mesa de Frades', category: 'other', position: 3, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c5`, trip_id: LISBOA, label: 'Chaussures confort tram 28', category: 'clothing', position: 4, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c6`, trip_id: LISBOA, label: 'Veste légère soirée', category: 'clothing', position: 5, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c7`, trip_id: LISBOA, label: 'App Bolt + Metro Lisboa', category: 'other', position: 6, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c8`, trip_id: LISBOA, label: 'Crème solaire', category: 'gear', position: 7, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c9`, trip_id: LISBOA, label: 'eSIM Portugal', category: 'docs', position: 8, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-c10`, trip_id: LISBOA, label: 'Cadeau hôte Casa do Bairro', category: 'other', position: 9, created_at: NOW, updated_at: NOW },
]

// 7 sur 10 cochés (préparatifs)
const lisboaChecklistDone: LocalChecklistCompletion[] = ['c1', 'c2', 'c3', 'c4', 'c5', 'c7', 'c9'].flatMap((c) => [
  { item_id: `${LISBOA}-${c}`, user_id: DEMO_USER_ID, completed_at: '2026-05-18T12:00:00Z' },
  { item_id: `${LISBOA}-${c}`, user_id: DEMO_PARTNER_ID, completed_at: '2026-05-19T08:00:00Z' },
])

const lisboaGuide: LocalGuideCard[] = [
  { id: `${LISBOA}-g1`, trip_id: LISBOA, kind: 'info', title: 'Métro 24h', body: 'Pass 24h à 6,80€ — rentable dès 5 trajets. Acheter à la station avec une carte rechargeable Viva Viagem.', icon_name: 'Train', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-g2`, trip_id: LISBOA, kind: 'warning', title: 'Pickpockets tram 28', body: 'Le tram touristique est ciblé. Sac devant, téléphone pas dans la poche arrière.', icon_name: 'AlertTriangle', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-g3`, trip_id: LISBOA, kind: 'food', title: 'Resto sans résa', body: 'Beaucoup de bonnes adresses ne réservent pas. Arriver à 19h30 max pour avoir une table.', icon_name: 'UtensilsCrossed', position: 2, created_at: NOW, updated_at: NOW },
  { id: `${LISBOA}-g4`, trip_id: LISBOA, kind: 'weather', title: 'Vent océan', body: 'Soirées fraîches même en mai. Toujours une couche de plus.', icon_name: 'Wind', position: 3, created_at: NOW, updated_at: NOW },
]

// ─── CORSE (road_trip) ───────────────────────────────────────────────────────
const CORSE = 'demo-trip-corse'
const corseDays: LocalDay[] = [
  mkDay(CORSE, 1, '2026-06-20', 'Ferry · Bastia', 'Cap Corse'),
  mkDay(CORSE, 2, '2026-06-21', 'Cap Corse · Centuri', 'Nord'),
  mkDay(CORSE, 3, '2026-06-22', 'Saint-Florent · Désert', 'Nebbio'),
  mkDay(CORSE, 4, '2026-06-23', 'Calvi · Balagne', 'Balagne'),
  mkDay(CORSE, 5, '2026-06-24', 'Porto · Calanche', 'Ouest'),
  mkDay(CORSE, 6, '2026-06-25', 'Ajaccio · Sanguinaires', 'Sud-ouest'),
  mkDay(CORSE, 7, '2026-06-26', 'Bonifacio · Falaises', 'Sud'),
  mkDay(CORSE, 8, '2026-06-27', 'Porto-Vecchio · Palombaggia', 'Sud-est'),
  mkDay(CORSE, 9, '2026-06-28', 'Corte · Restonica', 'Centre'),
  mkDay(CORSE, 10, '2026-06-29', 'Retour Bastia', 'Cap Corse'),
]

const corseActivities: LocalActivity[] = [
  // J1
  mkActivity(`${CORSE}-d1`, 0, '06:30', 'Embarquement Ferry Toulon', 'Corsica Linea · Pasiphae', 'activity'),
  mkActivity(`${CORSE}-d1`, 1, '14:30', 'Arrivée Port de Bastia', 'Récupérer le van', 'activity'),
  mkActivity(`${CORSE}-d1`, 2, '17:00', 'Erbalunga — village pêcheurs', 'Apéro tour génoise', 'culture'),
  mkActivity(`${CORSE}-d1`, 3, '20:00', 'Bivouac Pietracorbara', 'Camping municipal', 'accommodation'),
  // J2
  mkActivity(`${CORSE}-d2`, 0, '09:00', 'Sentier des Douaniers', '3h aller-retour, baskets', 'sport'),
  mkActivity(`${CORSE}-d2`, 1, '13:00', 'Centuri — langoustes', 'Port de pêche, table d\'hôte', 'food'),
  mkActivity(`${CORSE}-d2`, 2, '16:00', 'Plage de Tamarone', 'Eau turquoise, peu fréquentée', 'nature'),
  mkActivity(`${CORSE}-d2`, 3, '20:30', 'Bivouac Macinaggio', 'Aire camping-cars', 'accommodation'),
  // J3
  mkActivity(`${CORSE}-d3`, 0, '10:00', 'Saint-Florent — marché', 'Fromages corses, charcuterie', 'food'),
  mkActivity(`${CORSE}-d3`, 1, '14:00', 'Désert des Agriates — Saleccia', 'Bateau-navette 17€/pers', 'activity'),
  mkActivity(`${CORSE}-d3`, 2, '19:30', 'Dîner U Capannile', 'Sur le port', 'food'),
  // J4
  mkActivity(`${CORSE}-d4`, 0, '09:30', 'Route Balagne — Pigna, Sant\'Antonino', 'Villages perchés', 'culture'),
  mkActivity(`${CORSE}-d4`, 1, '13:00', 'Calvi — citadelle', 'Bateau pirate, pizzetta', 'culture'),
  mkActivity(`${CORSE}-d4`, 2, '16:00', 'Plage de l\'Alga', 'À vélo depuis Calvi', 'nature'),
  mkActivity(`${CORSE}-d4`, 3, '21:00', 'Dîner A Candella', 'Vue baie de Calvi', 'food'),
  // J5
  mkActivity(`${CORSE}-d5`, 0, '08:00', 'Route D81 — gorges de Spelunca', 'Vertige, photos', 'nature'),
  mkActivity(`${CORSE}-d5`, 1, '12:00', 'Porto — golfe', 'Casse-croûte vue tour', 'food'),
  mkActivity(`${CORSE}-d5`, 2, '15:00', 'Réserve de Scandola', 'Excursion bateau 2h', 'activity'),
  mkActivity(`${CORSE}-d5`, 3, '19:00', 'Calanches de Piana au coucher', 'Roches rouges en feu', 'nature'),
  // J6
  mkActivity(`${CORSE}-d6`, 0, '10:00', 'Cargèse', 'Villages grec & latin', 'culture'),
  mkActivity(`${CORSE}-d6`, 1, '13:30', 'Ajaccio — Maison Bonaparte', '7€, 1h de visite', 'culture'),
  mkActivity(`${CORSE}-d6`, 2, '18:00', 'Pointe de la Parata', 'Coucher Sanguinaires', 'nature'),
  mkActivity(`${CORSE}-d6`, 3, '21:00', 'Dîner Le Spago', 'Cuisine corse moderne', 'food'),
  // J7
  mkActivity(`${CORSE}-d7`, 0, '09:00', 'Plage de Roccapina', 'Lion de pierre + crique', 'nature'),
  mkActivity(`${CORSE}-d7`, 1, '13:00', 'Bonifacio — ville haute', 'Citadelle, ruelles', 'culture'),
  mkActivity(`${CORSE}-d7`, 2, '16:00', 'Grotte du Sdragonatu', 'Excursion bateau 40 min', 'activity'),
  mkActivity(`${CORSE}-d7`, 3, '20:30', 'Cantina Doria', 'Spécialités, 35€/tête', 'food'),
  // J8
  mkActivity(`${CORSE}-d8`, 0, '10:30', 'Plage Palombaggia', 'Sable blanc, pins parasol', 'nature'),
  mkActivity(`${CORSE}-d8`, 1, '14:00', 'Plage Santa Giulia', 'Lagon, paddle 25€/h', 'sport'),
  mkActivity(`${CORSE}-d8`, 2, '19:30', 'Porto-Vecchio — marché du soir', 'Vin Domaine de Torraccia', 'food'),
  // J9
  mkActivity(`${CORSE}-d9`, 0, '08:30', 'Route vers Corte', 'Halte Aleria archéo', 'culture'),
  mkActivity(`${CORSE}-d9`, 1, '12:00', 'Citadelle de Corte', 'Musée corse 5€', 'culture'),
  mkActivity(`${CORSE}-d9`, 2, '15:00', 'Gorges de la Restonica', 'Lac de Melu 1h30 montée', 'sport'),
  mkActivity(`${CORSE}-d9`, 3, '20:00', 'U Museu — chez Antò', 'Cabri rôti', 'food'),
  // J10
  mkActivity(`${CORSE}-d10`, 0, '09:00', 'Route Bastia via Vescovato', '1h30 tranquille', 'activity'),
  mkActivity(`${CORSE}-d10`, 1, '14:00', 'Embarquement ferry retour', 'Restitution van avant', 'activity'),
]

const corseCompletions: LocalActivityCompletion[] = [] // À venir : rien de coché

const corseSpots: LocalSpot[] = [
  { id: `${CORSE}-s1`, trip_id: CORSE, day_id: null, name: 'Erbalunga', description: 'Village de pêcheurs marine de Cap Corse', category: 'culture', zone: 'Cap Corse', lat: 42.7560, lng: 9.4860, price: 'libre', tags: ['village', 'apéro'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s2`, trip_id: CORSE, day_id: null, name: 'Plage de Tamarone', description: 'Cristalline, déserte hors-saison', category: 'nature', zone: 'Cap Corse', lat: 43.0177, lng: 9.4533, price: null, tags: ['plage', 'turquoise'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s3`, trip_id: CORSE, day_id: null, name: 'Saleccia (Agriates)', description: 'Plage du désert, accès bateau ou 4×4', category: 'nature', zone: 'Nebbio', lat: 42.7728, lng: 9.1881, price: '17€ bateau', tags: ['accès difficile'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s4`, trip_id: CORSE, day_id: null, name: 'Citadelle de Calvi', description: 'Vue baie, ruelles vivantes', category: 'culture', zone: 'Balagne', lat: 42.5667, lng: 8.7569, price: 'libre', tags: ['fortification'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s5`, trip_id: CORSE, day_id: null, name: 'Calanche de Piana', description: 'Patrimoine Unesco, roches rouges', category: 'nature', zone: 'Ouest', lat: 42.2522, lng: 8.6300, price: null, tags: ['unesco', 'sunset'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s6`, trip_id: CORSE, day_id: null, name: 'Scandola', description: 'Réserve naturelle, accès bateau seulement', category: 'activity', zone: 'Ouest', lat: 42.3667, lng: 8.5500, price: '55€/pers', tags: ['bateau', 'unesco'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s7`, trip_id: CORSE, day_id: null, name: 'Pointe de la Parata', description: 'Tour génoise + Iles Sanguinaires', category: 'nature', zone: 'Ajaccio', lat: 41.9111, lng: 8.6056, price: 'libre', tags: ['sunset', 'rando courte'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s8`, trip_id: CORSE, day_id: null, name: 'Bonifacio — citadelle', description: 'Falaises de calcaire, ville haute', category: 'culture', zone: 'Sud', lat: 41.3878, lng: 9.1597, price: 'parking 6€', tags: ['village', 'falaise'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s9`, trip_id: CORSE, day_id: null, name: 'Palombaggia', description: 'Pins parasol, eau cristalline', category: 'nature', zone: 'Porto-Vecchio', lat: 41.5544, lng: 9.3344, price: 'parking 5€', tags: ['plage'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s10`, trip_id: CORSE, day_id: null, name: 'Lac de Melu', description: 'Lac glaciaire, montée 1h30', category: 'nature', zone: 'Restonica', lat: 42.2589, lng: 9.0489, price: 'parking 6€', tags: ['rando', 'altitude'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s11`, trip_id: CORSE, day_id: null, name: 'Domaine de Torraccia', description: 'Vins corses, dégustation libre', category: 'food', zone: 'Lecci', lat: 41.6800, lng: 9.3633, price: '8€ déguste', tags: ['vin', 'bio'], created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-s12`, trip_id: CORSE, day_id: null, name: 'U Museu', description: 'Cabri rôti, ambiance familiale Corte', category: 'food', zone: 'Corte', lat: 42.3061, lng: 9.1492, price: '32€/tête', tags: ['authentique'], created_at: NOW, updated_at: NOW },
]

const corseExpenses: LocalExpense[] = [
  { id: `${CORSE}-e1`, trip_id: CORSE, payer_id: DEMO_USER_ID, amount: 84000, currency: 'EUR', category: 'transport', note: 'Ferry A/R Toulon-Bastia + cabine', spent_at: '2026-05-02T14:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-e2`, trip_id: CORSE, payer_id: DEMO_PARTNER_ID, amount: 95000, currency: 'EUR', category: 'transport', note: 'Location van Roadsurfer 10j', spent_at: '2026-04-22T10:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-e3`, trip_id: CORSE, payer_id: DEMO_USER_ID, amount: 14500, currency: 'EUR', category: 'activity', note: 'Excursion Scandola × 2', spent_at: '2026-05-15T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-e4`, trip_id: CORSE, payer_id: DEMO_USER_ID, amount: 12000, currency: 'EUR', category: 'food', note: 'Courses Carrefour départ', spent_at: '2026-06-19T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-e5`, trip_id: CORSE, payer_id: DEMO_PARTNER_ID, amount: 6500, currency: 'EUR', category: 'hotel', note: 'Campings × 4 nuits réservées', spent_at: '2026-05-20T11:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-e6`, trip_id: CORSE, payer_id: DEMO_USER_ID, amount: 4200, currency: 'EUR', category: 'shopping', note: 'Topo + glacière + tabouret van', spent_at: '2026-05-18T15:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
]

const corseSplits: LocalExpenseSplit[] = corseExpenses.flatMap((e) => [
  { expense_id: e.id, user_id: DEMO_USER_ID, share: 0.5 },
  { expense_id: e.id, user_id: DEMO_PARTNER_ID, share: 0.5 },
])

const corseChecklist: LocalChecklistItem[] = [
  { id: `${CORSE}-c1`, trip_id: CORSE, label: 'Réserver ferry A/R', category: 'docs', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c2`, trip_id: CORSE, label: 'Confirmer Roadsurfer', category: 'docs', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c3`, trip_id: CORSE, label: 'Permis van + carte grise scan', category: 'docs', position: 2, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c4`, trip_id: CORSE, label: 'Trousse pharmacie van', category: 'gear', position: 3, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c5`, trip_id: CORSE, label: 'Glacière + accumulateurs', category: 'gear', position: 4, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c6`, trip_id: CORSE, label: 'Maillots + serviette micro', category: 'clothing', position: 5, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c7`, trip_id: CORSE, label: 'Chaussures rando + tongs', category: 'clothing', position: 6, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c8`, trip_id: CORSE, label: 'Sac de couchage léger', category: 'gear', position: 7, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c9`, trip_id: CORSE, label: 'Carte IGN top 25 Cap Corse', category: 'gear', position: 8, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c10`, trip_id: CORSE, label: 'Application iGN Rando', category: 'other', position: 9, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c11`, trip_id: CORSE, label: 'Réserve eau 10L', category: 'gear', position: 10, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c12`, trip_id: CORSE, label: 'Adaptateur 12V → 220V', category: 'gear', position: 11, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c13`, trip_id: CORSE, label: 'Réserver bateau Scandola', category: 'docs', position: 12, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-c14`, trip_id: CORSE, label: 'Mug café + filtres', category: 'gear', position: 13, created_at: NOW, updated_at: NOW },
]

const corseChecklistDone: LocalChecklistCompletion[] = ['c1', 'c2', 'c3', 'c5', 'c13'].flatMap((c) => [
  { item_id: `${CORSE}-${c}`, user_id: DEMO_USER_ID, completed_at: '2026-05-15T10:00:00Z' },
])

const corseGuide: LocalGuideCard[] = [
  { id: `${CORSE}-g1`, trip_id: CORSE, kind: 'info', title: 'Bivouac en Corse', body: 'Camping sauvage interdit. Aires camping-cars de l\'ATC ou campings. Respect des PNRC.', icon_name: 'Tent', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-g2`, trip_id: CORSE, kind: 'weather', title: 'Mistral fin juin', body: 'Vent NW possible, surveille la météo marine si tu prends un bateau côté ouest.', icon_name: 'Wind', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-g3`, trip_id: CORSE, kind: 'warning', title: 'Routes étroites', body: 'D81 et Cap Corse : 30 km/h moyenne. Compter 2× le temps GPS. Pas de stress.', icon_name: 'AlertTriangle', position: 2, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-g4`, trip_id: CORSE, kind: 'food', title: 'Fromages locaux', body: 'Brocciu frais (printemps), tomme de brebis, casgiu merzu (l\'aventureux).', icon_name: 'UtensilsCrossed', position: 3, created_at: NOW, updated_at: NOW },
  { id: `${CORSE}-g5`, trip_id: CORSE, kind: 'emergency', title: 'Secours montagne', body: 'PGHM Corse : 04 95 61 13 95. Hors zone réseau : balise PLB recommandée.', icon_name: 'Flame', position: 4, created_at: NOW, updated_at: NOW },
]

// ─── DOLOMITES (hike) ────────────────────────────────────────────────────────
const DOLO = 'demo-trip-dolomites'
const doloDays: LocalDay[] = [
  mkDay(DOLO, 1, '2026-03-01', 'Lago di Braies → Sennes', 'Étape 1',
    "Première montée raide, sacs trop chargés (on fera le tri demain). Le lac est aussi turquoise qu'on l'imaginait — mais la file de selfie-sticks à 9h, brutal. À midi on était seuls. Sennes : dortoir 6 places, ronfleur olympique au lit 3. Bière brune locale parfaite."),
  mkDay(DOLO, 2, '2026-03-02', 'Sennes → Lavarella', 'Étape 2',
    "Étape longue mais plate, on récupère. Premier coup d'œil sur les Tofane depuis Passo Limo — Tom a juste dit \"putain\". Pique-nique au lac Lavarella, eau glaciale. Bière de monastère le soir, le moine sourit en remplissant la chope."),
  mkDay(DOLO, 3, '2026-03-03', 'Lavarella → Lagazuoi', 'Étape 3',
    "Le jour qu'on redoutait. La Cengia del Banc avec les câbles : 15 min de pure adrénaline. Lagazuoi à 2752m, panorama vertigineux. Coucher de soleil rose sur les Tofane — le moment du voyage."),
  mkDay(DOLO, 4, '2026-03-04', 'Lagazuoi → Nuvolau', 'Étape 4',
    "Téléphérique pour descendre (genoux remercient). Tunnels Grande Guerre humides, ambiance étrange. Cinque Torri photogéniques, on fait nos influenceurs de la montagne. Nuvolau, le plus vieux refuge — patron grognon mais polenta divine."),
  mkDay(DOLO, 5, '2026-03-05', 'Nuvolau → Coldai', 'Étape 5',
    "Réveil 5h30 pour le lever de soleil sur la Tofana — vaut chaque minute de sommeil perdue. Descente Forcella Giau brutale (Lina a glissé deux fois, plus de peur que de mal). 14 km, on arrive cassés au lac Coldai, plongeon à 6°C, on hurle, on rit."),
  mkDay(DOLO, 6, '2026-03-06', 'Coldai → La Pissa', 'Étape 6 — fin',
    "Dernière étape, photo au Lago Coldai miroir (l'image qui sera imprimée). Forcella Col Negro tranquille. Café au Vazzoler avec une bande de grimpeurs allemands, on échange des contacts. La Pissa, bus pour Belluno, on a réussi."),
]

const doloActivities: LocalActivity[] = [
  // J1 — 6h, 5km
  mkActivity(`${DOLO}-d1`, 0, '07:30', 'Bus Dobbiaco → Lago di Braies', '40 min', 'activity'),
  mkActivity(`${DOLO}-d1`, 1, '09:00', 'Départ sentier 1 — rive ouest', 'Vue carte postale', 'sport'),
  mkActivity(`${DOLO}-d1`, 2, '13:00', 'Pause Forc. Sora Forno', 'Sandwich + thé', 'food'),
  mkActivity(`${DOLO}-d1`, 3, '15:30', 'Rifugio Sennes', 'Dortoir 6 places', 'accommodation'),
  // J2 — 5h, 12km
  mkActivity(`${DOLO}-d2`, 0, '08:00', 'Petit-déj Sennes', 'Yaourt + miel + speck', 'food'),
  mkActivity(`${DOLO}-d2`, 1, '09:00', 'Passo Limo', 'Première vue Tofane', 'nature'),
  mkActivity(`${DOLO}-d2`, 2, '12:30', 'Lac Lavarella', 'Pique-nique au bord', 'food'),
  mkActivity(`${DOLO}-d2`, 3, '15:00', 'Rifugio Fanes', 'Halte courte', 'culture'),
  mkActivity(`${DOLO}-d2`, 4, '17:00', 'Rifugio Lavarella', 'Bière + ravioli', 'accommodation'),
  // J3 — 7h, 11km
  mkActivity(`${DOLO}-d3`, 0, '07:30', 'Départ tôt — col Limo', 'Crampons recommandés', 'sport'),
  mkActivity(`${DOLO}-d3`, 1, '11:00', 'Forcella del Lago', '2486 m', 'nature'),
  mkActivity(`${DOLO}-d3`, 2, '13:30', 'Cengia del Banc', 'Câbles, attention', 'sport'),
  mkActivity(`${DOLO}-d3`, 3, '16:30', 'Rifugio Lagazuoi', '2752 m, top du trek', 'accommodation'),
  // J4 — 5h, 9km
  mkActivity(`${DOLO}-d4`, 0, '08:30', 'Téléphérique Lagazuoi descente', '15€/pers', 'activity'),
  mkActivity(`${DOLO}-d4`, 1, '10:00', 'Tunnels de la Grande Guerre', 'Lampe frontale', 'culture'),
  mkActivity(`${DOLO}-d4`, 2, '13:00', 'Cinque Torri', 'Photo des 5 tours', 'nature'),
  mkActivity(`${DOLO}-d4`, 3, '16:00', 'Rifugio Nuvolau', '2575 m, panorama 360°', 'accommodation'),
  // J5 — 8h, 14km
  mkActivity(`${DOLO}-d5`, 0, '07:00', 'Lever soleil Tofana', 'Crucial météo', 'nature'),
  mkActivity(`${DOLO}-d5`, 1, '08:30', 'Forcella Giau', 'Descente raide', 'sport'),
  mkActivity(`${DOLO}-d5`, 2, '12:00', 'Passo Staulanza', 'Refuge fermé, casse-croûte', 'food'),
  mkActivity(`${DOLO}-d5`, 3, '15:30', 'Mont Coldai', 'Lac glaciaire', 'nature'),
  mkActivity(`${DOLO}-d5`, 4, '17:30', 'Rifugio Coldai', '2135 m', 'accommodation'),
  // J6 — 5h, 10km
  mkActivity(`${DOLO}-d6`, 0, '08:00', 'Lago Coldai miroir', 'Photo à 10 min du refuge', 'nature'),
  mkActivity(`${DOLO}-d6`, 1, '09:30', 'Forcella Col Negro', 'Dernier col', 'sport'),
  mkActivity(`${DOLO}-d6`, 2, '13:00', 'Rifugio Vazzoler', 'Café final', 'food'),
  mkActivity(`${DOLO}-d6`, 3, '15:30', 'La Pissa — fin AV1', 'Bus retour Belluno', 'activity'),
]

// Trek terminé : TOUT coché par les 2
const doloCompletions: LocalActivityCompletion[] = doloActivities.flatMap((a) => [
  { activity_id: a.id, user_id: DEMO_USER_ID, completed_at: a.id.includes('-d1') ? '2026-03-01T18:00:00Z' : a.id.includes('-d2') ? '2026-03-02T18:00:00Z' : a.id.includes('-d3') ? '2026-03-03T18:00:00Z' : a.id.includes('-d4') ? '2026-03-04T18:00:00Z' : a.id.includes('-d5') ? '2026-03-05T18:00:00Z' : '2026-03-06T16:00:00Z' },
  { activity_id: a.id, user_id: DEMO_PARTNER_ID, completed_at: a.id.includes('-d1') ? '2026-03-01T18:00:00Z' : a.id.includes('-d2') ? '2026-03-02T18:00:00Z' : a.id.includes('-d3') ? '2026-03-03T18:00:00Z' : a.id.includes('-d4') ? '2026-03-04T18:00:00Z' : a.id.includes('-d5') ? '2026-03-05T18:00:00Z' : '2026-03-06T16:00:00Z' },
])

const doloSpots: LocalSpot[] = [
  { id: `${DOLO}-s1`, trip_id: DOLO, day_id: null, name: 'Lago di Braies', description: 'Lac de Pragser, départ AV1', category: 'nature', zone: 'Étape 1', lat: 46.6943, lng: 12.0850, price: 'parking 8€', tags: ['lac', 'photo'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s2`, trip_id: DOLO, day_id: null, name: 'Rifugio Sennes', description: 'Refuge gardé, bivouac confortable', category: 'accommodation', zone: 'Étape 1', lat: 46.6650, lng: 12.0883, price: '60€ demi-pension', tags: ['refuge', 'gardé'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s3`, trip_id: DOLO, day_id: null, name: 'Rifugio Lavarella', description: 'Bière de monastère locale', category: 'accommodation', zone: 'Étape 2', lat: 46.6411, lng: 12.0319, price: '62€ demi-pension', tags: ['refuge', 'bière'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s4`, trip_id: DOLO, day_id: null, name: 'Rifugio Lagazuoi', description: '2752 m — top du trek', category: 'accommodation', zone: 'Étape 3', lat: 46.5197, lng: 12.0231, price: '75€ demi-pension', tags: ['refuge', 'altitude'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s5`, trip_id: DOLO, day_id: null, name: 'Cinque Torri', description: 'Formation rocheuse iconique', category: 'nature', zone: 'Étape 4', lat: 46.5328, lng: 12.0747, price: null, tags: ['formation', 'unesco'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s6`, trip_id: DOLO, day_id: null, name: 'Rifugio Nuvolau', description: 'Le plus vieux refuge des Dolomites', category: 'accommodation', zone: 'Étape 4', lat: 46.5039, lng: 12.0883, price: '65€ demi-pension', tags: ['refuge', 'historique'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s7`, trip_id: DOLO, day_id: null, name: 'Lago di Coldai', description: 'Lac glaciaire, lever de soleil', category: 'nature', zone: 'Étape 5', lat: 46.4225, lng: 12.0739, price: null, tags: ['lac', 'glaciaire'], created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-s8`, trip_id: DOLO, day_id: null, name: 'Rifugio Coldai', description: 'Dernier refuge avant La Pissa', category: 'accommodation', zone: 'Étape 5', lat: 46.4214, lng: 12.0653, price: '58€ demi-pension', tags: ['refuge'], created_at: NOW, updated_at: NOW },
]

const doloExpenses: LocalExpense[] = [
  { id: `${DOLO}-e1`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 24000, currency: 'EUR', category: 'transport', note: 'Train Paris-Bolzano A/R × 2', spent_at: '2026-02-15T10:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e2`, trip_id: DOLO, payer_id: DEMO_PARTNER_ID, amount: 4800, currency: 'EUR', category: 'transport', note: 'Bus Bolzano → Dobbiaco', spent_at: '2026-03-01T06:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e3`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 12000, currency: 'EUR', category: 'hotel', note: 'Rifugio Sennes × 2', spent_at: '2026-03-01T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e4`, trip_id: DOLO, payer_id: DEMO_PARTNER_ID, amount: 12400, currency: 'EUR', category: 'hotel', note: 'Rifugio Lavarella × 2', spent_at: '2026-03-02T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e5`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 15000, currency: 'EUR', category: 'hotel', note: 'Rifugio Lagazuoi × 2', spent_at: '2026-03-03T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e6`, trip_id: DOLO, payer_id: DEMO_PARTNER_ID, amount: 13000, currency: 'EUR', category: 'hotel', note: 'Rifugio Nuvolau × 2', spent_at: '2026-03-04T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e7`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 11600, currency: 'EUR', category: 'hotel', note: 'Rifugio Coldai × 2', spent_at: '2026-03-05T18:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e8`, trip_id: DOLO, payer_id: DEMO_PARTNER_ID, amount: 3000, currency: 'EUR', category: 'transport', note: 'Téléphérique Lagazuoi descente × 2', spent_at: '2026-03-04T09:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e9`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 2400, currency: 'EUR', category: 'drink', note: 'Bières d\'altitude (toutes étapes)', spent_at: '2026-03-03T19:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e10`, trip_id: DOLO, payer_id: DEMO_PARTNER_ID, amount: 4500, currency: 'EUR', category: 'shopping', note: 'Topo + carte Tabacco 03', spent_at: '2026-02-20T16:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-e11`, trip_id: DOLO, payer_id: DEMO_USER_ID, amount: 7800, currency: 'EUR', category: 'food', note: 'Casse-croûtes 6 jours', spent_at: '2026-02-28T15:00:00Z', split_mode: 'equal', created_at: NOW, updated_at: NOW },
]

const doloSplits: LocalExpenseSplit[] = doloExpenses.flatMap((e) => [
  { expense_id: e.id, user_id: DEMO_USER_ID, share: 0.5 },
  { expense_id: e.id, user_id: DEMO_PARTNER_ID, share: 0.5 },
])

const doloChecklist: LocalChecklistItem[] = [
  { id: `${DOLO}-c1`, trip_id: DOLO, label: 'Chaussures rando hautes', category: 'clothing', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c2`, trip_id: DOLO, label: 'Bâtons télescopiques', category: 'gear', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c3`, trip_id: DOLO, label: 'Sac 35-40L', category: 'gear', position: 2, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c4`, trip_id: DOLO, label: 'Veste imperméable Gore-Tex', category: 'clothing', position: 3, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c5`, trip_id: DOLO, label: 'Polaire + doudoune légère', category: 'clothing', position: 4, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c6`, trip_id: DOLO, label: 'Drap de sac de couchage', category: 'gear', position: 5, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c7`, trip_id: DOLO, label: 'Lampe frontale + piles', category: 'gear', position: 6, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c8`, trip_id: DOLO, label: 'Pharma — ampoules, ibuprofène', category: 'gear', position: 7, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c9`, trip_id: DOLO, label: 'Réserver refuges (AV1.it)', category: 'docs', position: 8, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c10`, trip_id: DOLO, label: 'Assurance secours montagne', category: 'docs', position: 9, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c11`, trip_id: DOLO, label: 'Carte Tabacco 03 + 025', category: 'gear', position: 10, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-c12`, trip_id: DOLO, label: 'Cash €€ — refuges parfois sans CB', category: 'other', position: 11, created_at: NOW, updated_at: NOW },
]

// Trek terminé : tous cochés par les 2
const doloChecklistDone: LocalChecklistCompletion[] = doloChecklist.flatMap((it) => [
  { item_id: it.id, user_id: DEMO_USER_ID, completed_at: '2026-02-28T20:00:00Z' },
  { item_id: it.id, user_id: DEMO_PARTNER_ID, completed_at: '2026-02-28T20:00:00Z' },
])

const doloGuide: LocalGuideCard[] = [
  { id: `${DOLO}-g1`, trip_id: DOLO, kind: 'warning', title: 'Câbles via ferrata', body: 'Cengia del Banc J3 : passages exposés. Kit via ferrata pas obligatoire mais recommandé.', icon_name: 'AlertTriangle', position: 0, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-g2`, trip_id: DOLO, kind: 'weather', title: 'Orages d\'après-midi', body: 'Été dolomites : départs tôt obligatoires. Refuges atteints avant 16h.', icon_name: 'Cloud', position: 1, created_at: NOW, updated_at: NOW },
  { id: `${DOLO}-g3`, trip_id: DOLO, kind: 'emergency', title: 'CNSAS — secours alpin', body: '118 (numéro unique). Mentionner: Alta Via 1, étape, GPS.', icon_name: 'Flame', position: 2, created_at: NOW, updated_at: NOW },
]

// ─── EXPORTS AGRÉGÉS ─────────────────────────────────────────────────────────
export const demoDays: LocalDay[] = [
  ...lisboaDays, ...corseDays, ...doloDays,
  ...skateparkDays, ...tokyoDays, ...bretagneDays,
]
export const demoActivities: LocalActivity[] = [
  ...lisboaActivities, ...corseActivities, ...doloActivities,
  ...skateparkActivities, ...tokyoActivities, ...bretagneActivities,
]
export const demoActivityCompletions: LocalActivityCompletion[] = [
  ...lisboaCompletions, ...corseCompletions, ...doloCompletions,
  ...skateparkCompletions, ...tokyoCompletions, ...bretagneCompletions,
]
export const demoSpots: LocalSpot[] = [
  ...lisboaSpots, ...corseSpots, ...doloSpots,
  ...skateparkSpots, ...tokyoSpots, ...bretagneSpots,
]
export const demoExpenses: LocalExpense[] = [
  ...lisboaExpenses, ...corseExpenses, ...doloExpenses,
  ...skateparkExpenses, ...tokyoExpenses, ...bretagneExpenses,
]
export const demoExpenseSplits: LocalExpenseSplit[] = [
  ...lisboaSplits, ...corseSplits, ...doloSplits,
  ...skateparkSplits, ...tokyoSplits, ...bretagneSplits,
]
export const demoChecklistItems: LocalChecklistItem[] = [
  ...lisboaChecklist, ...corseChecklist, ...doloChecklist,
  ...skateparkChecklist, ...tokyoChecklist, ...bretagneChecklist,
]
export const demoChecklistCompletions: LocalChecklistCompletion[] = [
  ...lisboaChecklistDone, ...corseChecklistDone, ...doloChecklistDone,
  ...skateparkChecklistDone, ...tokyoChecklistDone, ...bretagneChecklistDone,
]
export const demoGuideCards: LocalGuideCard[] = [
  ...lisboaGuide, ...corseGuide, ...doloGuide,
  ...skateparkGuide, ...tokyoGuide, ...bretagneGuide,
]

export const DEMO_TRIP_IDS = demoTrips.map((t) => t.id)
export function isDemoTripId(id: string): boolean {
  return id.startsWith('demo-trip-')
}
