import { SpotCategory } from "./MapData";

export type PlannedActivity = {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  category: SpotCategory;
  spotId?: string;
  done: boolean;
};

export type TripDay = {
  id: string;
  dayNumber: number;
  date: string;
  label: string;
  zone: "lisboa" | "alentejo";
  theme: string;
  activities: PlannedActivity[];
};

export const TRIP_DAYS: TripDay[] = [
  {
    id: "d1",
    dayNumber: 1,
    date: "2026-04-10",
    label: "Vendredi",
    zone: "lisboa",
    theme: "Arrivée & Alfama",
    activities: [
      { id: "d1a1", time: "11:00", title: "Atterrissage Lisbonne", subtitle: "Aéroport → Airbnb en Uber", category: "activity", done: false },
      { id: "d1a2", time: "13:00", title: "Déjeuner Bifana", subtitle: "Street food premiers pas", category: "food", done: false },
      { id: "d1a3", time: "15:00", title: "Tram 28 → Alfama", subtitle: "Balade dans les ruelles", category: "culture", done: false },
      { id: "d1a4", time: "18:00", title: "Miradouro Sra. do Monte", subtitle: "Bière + coucher de soleil", category: "culture", spotId: "miradouro-monte", done: false },
      { id: "d1a5", time: "20:30", title: "Dîner A Provinciana", subtitle: "Cuisine de grand-mère", category: "food", spotId: "provinciana", done: false },
    ],
  },
  {
    id: "d2",
    dayNumber: 2,
    date: "2026-04-11",
    label: "Samedi",
    zone: "lisboa",
    theme: "Belém & LX Factory",
    activities: [
      { id: "d2a1", time: "09:30", title: "Pastéis de Belém", subtitle: "Les originaux depuis 1837", category: "food", done: false },
      { id: "d2a2", time: "10:30", title: "Tour de Belém", subtitle: "Monument emblématique", category: "culture", done: false },
      { id: "d2a3", time: "12:00", title: "MAAT Museum", subtitle: "Marcher sur le toit", category: "culture", spotId: "maat", done: false },
      { id: "d2a4", time: "14:00", title: "LX Factory", subtitle: "Librairies, street art, brunch", category: "culture", spotId: "lxfactory", done: false },
      { id: "d2a5", time: "19:00", title: "Time Out Market", subtitle: "Goûter à tout", category: "food", spotId: "timeout", done: false },
    ],
  },
  {
    id: "d3",
    dayNumber: 3,
    date: "2026-04-12",
    label: "Dimanche",
    zone: "lisboa",
    theme: "Príncipe Real & Food Tour",
    activities: [
      { id: "d3a1", time: "10:00", title: "Marché de Príncipe Real", subtitle: "Bio, brunch, artisanat", category: "culture", done: false },
      { id: "d3a2", time: "12:00", title: "Jardim Botânico", subtitle: "Verdure au cœur de la ville", category: "nature", done: false },
      { id: "d3a3", time: "13:30", title: "Atalho Real", subtitle: "Viande d'exception", category: "food", spotId: "atalho", done: false },
      { id: "d3a4", time: "16:00", title: "Underdogs Gallery", subtitle: "Art urbain / Vhils", category: "culture", spotId: "underdogs", done: false },
      { id: "d3a5", time: "18:00", title: "Miradouro Adamastor", subtitle: "Sunset + bière fraîche", category: "culture", spotId: "miradouro-adamastor", done: false },
    ],
  },
  {
    id: "d4",
    dayNumber: 4,
    date: "2026-04-13",
    label: "Lundi",
    zone: "lisboa",
    theme: "Dernière nuit & Nightlife",
    activities: [
      { id: "d4a1", time: "10:00", title: "Shopping Chiado", subtitle: "Souvenirs & concept stores", category: "activity", done: false },
      { id: "d4a2", time: "13:00", title: "Cervejaria Ramiro", subtitle: "L'institution fruits de mer", category: "food", spotId: "ramiro", done: false },
      { id: "d4a3", time: "16:00", title: "Quartier Intendente", subtitle: "Street art & galeries", category: "culture", spotId: "intendente", done: false },
      { id: "d4a4", time: "19:00", title: "PARK Bar rooftop", subtitle: "Vue 360° sur Lisbonne", category: "nightlife", spotId: "park-bar", done: false },
      { id: "d4a5", time: "22:00", title: "Bairro Alto", subtitle: "Bar-hopping dans les ruelles", category: "nightlife", spotId: "bairro-alto", done: false },
    ],
  },
  {
    id: "d5",
    dayNumber: 5,
    date: "2026-04-14",
    label: "Mardi",
    zone: "alentejo",
    theme: "Road Trip → Côte",
    activities: [
      { id: "d5a1", time: "09:00", title: "Récupérer la voiture", subtitle: "Location à l'aéroport", category: "activity", done: false },
      { id: "d5a2", time: "09:30", title: "Route vers le sud", subtitle: "2h30 — autoroute A2", category: "activity", done: false },
      { id: "d5a3", time: "12:30", title: "Arrivée Milfontes", subtitle: "Check-in Airbnb", category: "accommodation", spotId: "milfontes", done: false },
      { id: "d5a4", time: "14:00", title: "Déjeuner au port", subtitle: "Poisson grillé face à l'estuaire", category: "food", done: false },
      { id: "d5a5", time: "17:00", title: "Plage de Milfontes", subtitle: "Première baignade (16°C...)", category: "nature", done: false },
    ],
  },
  {
    id: "d6",
    dayNumber: 6,
    date: "2026-04-15",
    label: "Mercredi",
    zone: "alentejo",
    theme: "Rando & Surf",
    activities: [
      { id: "d6a1", time: "08:30", title: "Rota Vicentina", subtitle: "Sentier des Pêcheurs — 3h", category: "activity", spotId: "rota-vicentina", done: false },
      { id: "d6a2", time: "12:00", title: "Pique-nique falaises", subtitle: "Fromage + pain + vin", category: "food", done: false },
      { id: "d6a3", time: "14:30", title: "Surf Plage de Malhão", subtitle: "Cours de surf pour 2", category: "activity", spotId: "surf-malhao", done: false },
      { id: "d6a4", time: "18:00", title: "Coucher de soleil Sardão", subtitle: "Phare + Vinho Verde", category: "activity", spotId: "cap-sardao", done: false },
      { id: "d6a5", time: "20:00", title: "Dîner Milfontes village", subtitle: "Carne de Porco à Alentejana", category: "food", done: false },
    ],
  },
  {
    id: "d7",
    dayNumber: 7,
    date: "2026-04-16",
    label: "Jeudi",
    zone: "alentejo",
    theme: "Kayak & Gastronomie",
    activities: [
      { id: "d7a1", time: "09:00", title: "Kayak Rio Mira", subtitle: "2h sur l'eau calme", category: "activity", spotId: "kayak-mira", done: false },
      { id: "d7a2", time: "12:00", title: "Azenha do Mar", subtitle: "Poisson le plus frais du pays", category: "food", spotId: "azenha", done: false },
      { id: "d7a3", time: "15:00", title: "Praia de Odeceixe", subtitle: "Plage rivière + océan", category: "nature", spotId: "praia-odeceixe", done: false },
      { id: "d7a4", time: "18:00", title: "Zambujeira do Mar", subtitle: "Village blanc sur falaise", category: "culture", spotId: "zambujeira", done: false },
      { id: "d7a5", time: "20:30", title: "Percebes + vin", subtitle: "Aventure culinaire", category: "food", done: false },
    ],
  },
  {
    id: "d8",
    dayNumber: 8,
    date: "2026-04-17",
    label: "Vendredi",
    zone: "alentejo",
    theme: "Retour & Derniers spots",
    activities: [
      { id: "d8a1", time: "09:00", title: "Café face à l'océan", subtitle: "Dernier matin tranquille", category: "food", done: false },
      { id: "d8a2", time: "11:00", title: "Route vers Lisbonne", subtitle: "2h30 — rendre la voiture", category: "activity", done: false },
      { id: "d8a3", time: "14:00", title: "Dernier déjeuner Lisboa", subtitle: "Bifana d'adieu", category: "food", done: false },
      { id: "d8a4", time: "16:00", title: "Shopping dernière minute", subtitle: "Conserves & Pastéis", category: "activity", done: false },
      { id: "d8a5", time: "19:00", title: "Vol retour", subtitle: "Saudade...", category: "activity", done: false },
    ],
  },
];
