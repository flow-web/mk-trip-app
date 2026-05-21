/// <reference types="node" />
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (
  !url ||
  !serviceKey ||
  url.includes("REPLACE-ME") ||
  serviceKey.includes("REPLACE-ME")
) {
  console.error(
    "Missing or placeholder env. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const TARGET_EMAIL = process.argv[2];
if (!TARGET_EMAIL) {
  console.error("Usage: npm run seed:portugal -- <owner-email>");
  process.exit(1);
}

const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

// ─── Data inline (copie de components/MapData.ts et PlanningData.ts) ──────────

const SPOTS_SEED: Array<{
  name: string;
  description: string;
  category: string;
  zone: string;
  lat: number;
  lng: number;
  price?: string;
}> = [
  // ═══ LISBOA — FOOD ═══
  {
    name: "Cervejaria Ramiro",
    category: "food",
    description: "L'institution fruits de mer. Crevettes tigres + Prego.",
    zone: "lisboa",
    lat: 38.7267,
    lng: -9.1365,
    price: "€€€",
  },
  {
    name: "Atalho Real",
    category: "food",
    description: "Viande d'exception, cadre romantique à Príncipe Real.",
    zone: "lisboa",
    lat: 38.7175,
    lng: -9.1504,
    price: "€€",
  },
  {
    name: "A Provinciana",
    category: "food",
    description: "Cuisine de grand-mère, caché dans une ruelle.",
    zone: "lisboa",
    lat: 38.7139,
    lng: -9.1394,
    price: "€",
  },
  {
    name: "Time Out Market",
    category: "food",
    description: "Food court des meilleurs chefs du pays.",
    zone: "lisboa",
    lat: 38.7069,
    lng: -9.1454,
    price: "€€",
  },

  // ═══ LISBOA — CULTURE ═══
  {
    name: "LX Factory",
    category: "culture",
    description: "Friche industrielle : librairies, street art, restos.",
    zone: "lisboa",
    lat: 38.7036,
    lng: -9.178,
  },
  {
    name: "MAAT",
    category: "culture",
    description: "Architecture futuriste au bord de l'eau. On marche sur le toit.",
    zone: "lisboa",
    lat: 38.6966,
    lng: -9.1929,
    price: "€",
  },
  {
    name: "Underdogs Gallery",
    category: "culture",
    description: "Art urbain contemporain. Vhils, star locale.",
    zone: "lisboa",
    lat: 38.705,
    lng: -9.1466,
  },
  {
    name: "Miradouro Sra. do Monte",
    category: "culture",
    description: "Le plus haut belvédère. Bière + sunset.",
    zone: "lisboa",
    lat: 38.7191,
    lng: -9.1327,
  },
  {
    name: "Miradouro Adamastor",
    category: "culture",
    description: "Le miradouro jeune/bobo. Vue sur le Tage.",
    zone: "lisboa",
    lat: 38.7104,
    lng: -9.1459,
  },

  // ═══ LISBOA — NIGHTLIFE ═══
  {
    name: "Bairro Alto",
    category: "nightlife",
    description: "Bar-hopping dans les ruelles. L'ambiance monte après 23h.",
    zone: "lisboa",
    lat: 38.713,
    lng: -9.144,
  },
  {
    name: "Pink Street",
    category: "nightlife",
    description: "Cais do Sodré — bars alternatifs et ambiance.",
    zone: "lisboa",
    lat: 38.7067,
    lng: -9.144,
  },
  {
    name: "PARK Bar",
    category: "nightlife",
    description: "Rooftop dans un parking transformé. Vue 360°.",
    zone: "lisboa",
    lat: 38.712,
    lng: -9.146,
  },

  // ═══ LISBOA — ACCOMMODATION ═══
  {
    name: "Príncipe Real",
    category: "accommodation",
    description: "Le quartier le plus cool. Concept stores, jardins.",
    zone: "lisboa",
    lat: 38.7175,
    lng: -9.151,
  },
  {
    name: "Intendente / Anjos",
    category: "accommodation",
    description: "Alternatif, multiculturel, street art.",
    zone: "lisboa",
    lat: 38.723,
    lng: -9.136,
  },
  {
    name: "Santos / Madragoa",
    category: "accommodation",
    description: "Design district, proche du fleuve.",
    zone: "lisboa",
    lat: 38.708,
    lng: -9.158,
  },

  // ═══ ALENTEJO — FOOD ═══
  {
    name: "Azenha do Mar",
    category: "food",
    description: "Poisson le plus frais du pays. Pas de résa, arrivez tôt.",
    zone: "alentejo",
    lat: 37.765,
    lng: -8.787,
    price: "€€",
  },

  // ═══ ALENTEJO — ACCOMMODATION ═══
  {
    name: "Vila Nova de Milfontes",
    category: "accommodation",
    description: "Animé, estuaire magnifique. Parfait comme base.",
    zone: "alentejo",
    lat: 37.726,
    lng: -8.783,
  },
  {
    name: "Zambujeira do Mar",
    category: "accommodation",
    description: "Village blanc perché sur la falaise. Ultra mignon.",
    zone: "alentejo",
    lat: 37.526,
    lng: -8.751,
  },

  // ═══ ALENTEJO — ACTIVITY ═══
  {
    name: "Rota Vicentina",
    category: "activity",
    description: "Sentier des Pêcheurs. Un des plus beaux d'Europe.",
    zone: "alentejo",
    lat: 37.599,
    lng: -8.787,
  },
  {
    name: "Plage de Malhão",
    category: "activity",
    description: "Surf. Écoles dispos. Vagues parfaites en avril.",
    zone: "alentejo",
    lat: 37.71,
    lng: -8.792,
  },
  {
    name: "Kayak Rio Mira",
    category: "activity",
    description: "Eau calme, contraste avec l'océan.",
    zone: "alentejo",
    lat: 37.723,
    lng: -8.778,
  },
  {
    name: "Cap Sardão",
    category: "activity",
    description: "Phare. Coucher de soleil + Vinho Verde.",
    zone: "alentejo",
    lat: 37.599,
    lng: -8.815,
  },

  // ═══ ALENTEJO — NATURE ═══
  {
    name: "Praia de Odeceixe",
    category: "nature",
    description: "Plage sauvage entre rivière et océan.",
    zone: "alentejo",
    lat: 37.444,
    lng: -8.796,
  },
];

const TRIP_DAYS_SEED: Array<{
  day_number: number;
  date: string;
  label: string;
  theme: string;
  zone: string;
  activities: Array<{
    time: string;
    title: string;
    subtitle?: string;
    category: string;
  }>;
}> = [
  {
    day_number: 1,
    date: "2026-04-10",
    label: "Vendredi",
    zone: "lisboa",
    theme: "Arrivée & Alfama",
    activities: [
      { time: "11:00", title: "Atterrissage Lisbonne", subtitle: "Aéroport → Airbnb en Uber", category: "activity" },
      { time: "13:00", title: "Déjeuner Bifana", subtitle: "Street food premiers pas", category: "food" },
      { time: "15:00", title: "Tram 28 → Alfama", subtitle: "Balade dans les ruelles", category: "culture" },
      { time: "18:00", title: "Miradouro Sra. du Monte", subtitle: "Bière + coucher de soleil", category: "culture" },
      { time: "20:30", title: "Dîner A Provinciana", subtitle: "Cuisine de grand-mère", category: "food" },
    ],
  },
  {
    day_number: 2,
    date: "2026-04-11",
    label: "Samedi",
    zone: "lisboa",
    theme: "Belém & LX Factory",
    activities: [
      { time: "09:30", title: "Pastéis de Belém", subtitle: "Les originaux depuis 1837", category: "food" },
      { time: "10:30", title: "Tour de Belém", subtitle: "Monument emblématique", category: "culture" },
      { time: "12:00", title: "MAAT Museum", subtitle: "Marcher sur le toit", category: "culture" },
      { time: "14:00", title: "LX Factory", subtitle: "Librairies, street art, brunch", category: "culture" },
      { time: "19:00", title: "Time Out Market", subtitle: "Goûter à tout", category: "food" },
    ],
  },
  {
    day_number: 3,
    date: "2026-04-12",
    label: "Dimanche",
    zone: "lisboa",
    theme: "Príncipe Real & Food Tour",
    activities: [
      { time: "10:00", title: "Marché de Príncipe Real", subtitle: "Bio, brunch, artisanat", category: "culture" },
      { time: "12:00", title: "Jardim Botânico", subtitle: "Verdure au cœur de la ville", category: "nature" },
      { time: "13:30", title: "Atalho Real", subtitle: "Viande d'exception", category: "food" },
      { time: "16:00", title: "Underdogs Gallery", subtitle: "Art urbain / Vhils", category: "culture" },
      { time: "18:00", title: "Miradouro Adamastor", subtitle: "Sunset + bière fraîche", category: "culture" },
    ],
  },
  {
    day_number: 4,
    date: "2026-04-13",
    label: "Lundi",
    zone: "lisboa",
    theme: "Dernière nuit & Nightlife",
    activities: [
      { time: "10:00", title: "Shopping Chiado", subtitle: "Souvenirs & concept stores", category: "activity" },
      { time: "13:00", title: "Cervejaria Ramiro", subtitle: "L'institution fruits de mer", category: "food" },
      { time: "16:00", title: "Quartier Intendente", subtitle: "Street art & galeries", category: "culture" },
      { time: "19:00", title: "PARK Bar rooftop", subtitle: "Vue 360° sur Lisbonne", category: "nightlife" },
      { time: "22:00", title: "Bairro Alto", subtitle: "Bar-hopping dans les ruelles", category: "nightlife" },
    ],
  },
  {
    day_number: 5,
    date: "2026-04-14",
    label: "Mardi",
    zone: "alentejo",
    theme: "Road Trip → Côte",
    activities: [
      { time: "09:00", title: "Récupérer la voiture", subtitle: "Location à l'aéroport", category: "activity" },
      { time: "09:30", title: "Route vers le sud", subtitle: "2h30 — autoroute A2", category: "activity" },
      { time: "12:30", title: "Arrivée Milfontes", subtitle: "Check-in Airbnb", category: "accommodation" },
      { time: "14:00", title: "Déjeuner au port", subtitle: "Poisson grillé face à l'estuaire", category: "food" },
      { time: "17:00", title: "Plage de Milfontes", subtitle: "Première baignade (16°C...)", category: "nature" },
    ],
  },
  {
    day_number: 6,
    date: "2026-04-15",
    label: "Mercredi",
    zone: "alentejo",
    theme: "Rando & Surf",
    activities: [
      { time: "08:30", title: "Rota Vicentina", subtitle: "Sentier des Pêcheurs — 3h", category: "activity" },
      { time: "12:00", title: "Pique-nique falaises", subtitle: "Fromage + pain + vin", category: "food" },
      { time: "14:30", title: "Surf Plage de Malhão", subtitle: "Cours de surf pour 2", category: "activity" },
      { time: "18:00", title: "Coucher de soleil Sardão", subtitle: "Phare + Vinho Verde", category: "activity" },
      { time: "20:00", title: "Dîner Milfontes village", subtitle: "Carne de Porco à Alentejana", category: "food" },
    ],
  },
  {
    day_number: 7,
    date: "2026-04-16",
    label: "Jeudi",
    zone: "alentejo",
    theme: "Kayak & Gastronomie",
    activities: [
      { time: "09:00", title: "Kayak Rio Mira", subtitle: "2h sur l'eau calme", category: "activity" },
      { time: "12:00", title: "Azenha do Mar", subtitle: "Poisson le plus frais du pays", category: "food" },
      { time: "15:00", title: "Praia de Odeceixe", subtitle: "Plage rivière + océan", category: "nature" },
      { time: "18:00", title: "Zambujeira do Mar", subtitle: "Village blanc sur falaise", category: "culture" },
      { time: "20:30", title: "Percebes + vin", subtitle: "Aventure culinaire", category: "food" },
    ],
  },
  {
    day_number: 8,
    date: "2026-04-17",
    label: "Vendredi",
    zone: "alentejo",
    theme: "Retour & Derniers spots",
    activities: [
      { time: "09:00", title: "Café face à l'océan", subtitle: "Dernier matin tranquille", category: "food" },
      { time: "11:00", title: "Route vers Lisbonne", subtitle: "2h30 — rendre la voiture", category: "activity" },
      { time: "14:00", title: "Dernier déjeuner Lisboa", subtitle: "Bifana d'adieu", category: "food" },
      { time: "16:00", title: "Shopping dernière minute", subtitle: "Conserves & Pastéis", category: "activity" },
      { time: "19:00", title: "Vol retour", subtitle: "Saudade...", category: "activity" },
    ],
  },
];

const CHECKLIST_SEED = [
  "Coupe-vent",
  "Lunettes de soleil",
  "Crème solaire",
  "Bonnes baskets (pavés glissants!)",
  "Pull pour le soir",
  "Maillot de bain",
  "Adaptateur prise (pas nécessaire, même prises)",
];

const GUIDE_CARDS_SEED: Array<{
  kind: "danger" | "warning" | "info" | "weather" | "emergency" | "food";
  title: string;
  body: string;
  icon_name: string;
}> = [
  {
    kind: "danger",
    title: "Cannabis",
    body: "Décriminalisé mais PAS légal à acheter. Arnaque vendeurs Baixa/Rossio (laurier/bouillon cube).",
    icon_name: "AlertTriangle",
  },
  {
    kind: "warning",
    title: "Alcool",
    body: "Alcool pas cher. On boit dans la rue à Bairro Alto — c'est normal. Bières ~1.50€ en terrasse.",
    icon_name: "Wine",
  },
  {
    kind: "info",
    title: "Transport",
    body: "Uber/Bolt très pas cher (~5€ traverser Lisbonne). Viva Viagem card pour metro/tram/bus. Location voiture à l'aéroport pour Alentejo.",
    icon_name: "Car",
  },
  {
    kind: "weather",
    title: "Météo Avril",
    body: "15–22°C, pluie possible, vent constant sur la côte.",
    icon_name: "Sun",
  },
  {
    kind: "food",
    title: "Manger Local",
    body: "Bifana > sandwich classique. Pastéis de nata à Belém. Percebes (pouce-pieds) = délicieux. Menu du jour ~8-12€",
    icon_name: "UtensilsCrossed",
  },
  {
    kind: "emergency",
    title: "Urgences",
    body: "112 — Urgences\n217 654 242 — PSP Police\n213 939 100 — Ambassade France",
    icon_name: "Phone",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find user
  const { data: users, error: uErr } = await supa.auth.admin.listUsers();
  if (uErr) throw uErr;
  const user = users.users.find((u: any) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(
      `User ${TARGET_EMAIL} not found in auth.users. Sign in via the app once first.`,
    );
    process.exit(1);
  }

  // 2. Ensure profile
  await supa
    .from("profiles")
    .upsert(
      { id: user.id, display_name: user.email!.split("@")[0] },
      { onConflict: "id", ignoreDuplicates: true },
    );

  // 3. Idempotent : if a trip with this name exists for this owner, delete it
  const TRIP_NAME = "Portugal Avril 2026";
  const { data: existing } = await supa
    .from("trips")
    .select("id")
    .eq("owner_id", user.id)
    .eq("name", TRIP_NAME)
    .maybeSingle();
  if (existing) {
    console.log("Trip already exists, deleting for clean re-seed...");
    await supa.from("trips").delete().eq("id", existing.id);
  }

  // 4. Insert trip
  const { data: trip, error: tErr } = await supa
    .from("trips")
    .insert({
      owner_id: user.id,
      name: TRIP_NAME,
      destination: "Portugal",
      start_date: "2026-04-10",
      end_date: "2026-04-17",
      trip_type: "city_break",
      currency: "EUR",
      total_budget: 1200,
      cover_color: "#FF6B4A",
    })
    .select()
    .single();
  if (tErr || !trip) throw tErr ?? new Error("No trip created");

  // 5. Seed days + activities
  for (const day of TRIP_DAYS_SEED) {
    const { data: dRow, error: dErr } = await supa
      .from("days")
      .insert({
        trip_id: trip.id,
        day_number: day.day_number,
        date: day.date,
        label: day.label,
        theme: day.theme,
        zone: day.zone,
      })
      .select()
      .single();
    if (dErr || !dRow) throw dErr;
    for (let i = 0; i < day.activities.length; i++) {
      const a = day.activities[i];
      await supa.from("activities").insert({
        day_id: dRow.id,
        time: a.time,
        title: a.title,
        subtitle: a.subtitle ?? null,
        category: a.category,
        position: i,
      });
    }
  }

  // 6. Seed spots
  for (const spot of SPOTS_SEED) {
    await supa.from("spots").insert({
      trip_id: trip.id,
      name: spot.name,
      description: spot.description,
      category: spot.category,
      zone: spot.zone,
      lat: spot.lat,
      lng: spot.lng,
      price: spot.price ?? null,
      tags: [],
    });
  }

  // 7. Seed checklist
  for (let i = 0; i < CHECKLIST_SEED.length; i++) {
    await supa.from("checklist_items").insert({
      trip_id: trip.id,
      label: CHECKLIST_SEED[i],
      category: "clothing",
      position: i,
    });
  }

  // 8. Seed guide cards
  for (let i = 0; i < GUIDE_CARDS_SEED.length; i++) {
    const c = GUIDE_CARDS_SEED[i];
    await supa.from("guide_cards").insert({ trip_id: trip.id, ...c, position: i });
  }

  console.log(`✓ Trip "${TRIP_NAME}" seeded for ${TARGET_EMAIL}`);
  console.log(`  Trip ID: ${trip.id}`);
  console.log(`  Join code: ${trip.join_code}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
