export type SpotCategory = "food" | "culture" | "nightlife" | "nature" | "accommodation" | "activity";

export type Spot = {
  id: string;
  name: string;
  category: SpotCategory;
  description: string;
  zone: "lisboa" | "alentejo";
  coordinate: { latitude: number; longitude: number };
  price?: "€" | "€€" | "€€€";
  emoji?: string;
};

export const SPOTS: Spot[] = [
  // ═══ LISBOA — FOOD ═══
  {
    id: "ramiro",
    name: "Cervejaria Ramiro",
    category: "food",
    description: "L'institution fruits de mer. Crevettes tigres + Prego.",
    zone: "lisboa",
    coordinate: { latitude: 38.7267, longitude: -9.1365 },
    price: "€€€",
  },
  {
    id: "atalho",
    name: "Atalho Real",
    category: "food",
    description: "Viande d'exception, cadre romantique à Príncipe Real.",
    zone: "lisboa",
    coordinate: { latitude: 38.7175, longitude: -9.1504 },
    price: "€€",
  },
  {
    id: "provinciana",
    name: "A Provinciana",
    category: "food",
    description: "Cuisine de grand-mère, caché dans une ruelle.",
    zone: "lisboa",
    coordinate: { latitude: 38.7139, longitude: -9.1394 },
    price: "€",
  },
  {
    id: "timeout",
    name: "Time Out Market",
    category: "food",
    description: "Food court des meilleurs chefs du pays.",
    zone: "lisboa",
    coordinate: { latitude: 38.7069, longitude: -9.1454 },
    price: "€€",
  },

  // ═══ LISBOA — CULTURE ═══
  {
    id: "lxfactory",
    name: "LX Factory",
    category: "culture",
    description: "Friche industrielle : librairies, street art, restos.",
    zone: "lisboa",
    coordinate: { latitude: 38.7036, longitude: -9.1780 },
  },
  {
    id: "maat",
    name: "MAAT",
    category: "culture",
    description: "Architecture futuriste au bord de l'eau. On marche sur le toit.",
    zone: "lisboa",
    coordinate: { latitude: 38.6966, longitude: -9.1929 },
    price: "€",
  },
  {
    id: "underdogs",
    name: "Underdogs Gallery",
    category: "culture",
    description: "Art urbain contemporain. Vhils, star locale.",
    zone: "lisboa",
    coordinate: { latitude: 38.7050, longitude: -9.1466 },
  },
  {
    id: "miradouro-monte",
    name: "Miradouro Sra. do Monte",
    category: "culture",
    description: "Le plus haut belvédère. Bière + sunset.",
    zone: "lisboa",
    coordinate: { latitude: 38.7191, longitude: -9.1327 },
  },
  {
    id: "miradouro-adamastor",
    name: "Miradouro Adamastor",
    category: "culture",
    description: "Le miradouro jeune/bobo. Vue sur le Tage.",
    zone: "lisboa",
    coordinate: { latitude: 38.7104, longitude: -9.1459 },
  },

  // ═══ LISBOA — NIGHTLIFE ═══
  {
    id: "bairro-alto",
    name: "Bairro Alto",
    category: "nightlife",
    description: "Bar-hopping dans les ruelles. L'ambiance monte après 23h.",
    zone: "lisboa",
    coordinate: { latitude: 38.7130, longitude: -9.1440 },
  },
  {
    id: "pink-street",
    name: "Pink Street",
    category: "nightlife",
    description: "Cais do Sodré — bars alternatifs et ambiance.",
    zone: "lisboa",
    coordinate: { latitude: 38.7067, longitude: -9.1440 },
  },
  {
    id: "park-bar",
    name: "PARK Bar",
    category: "nightlife",
    description: "Rooftop dans un parking transformé. Vue 360°.",
    zone: "lisboa",
    coordinate: { latitude: 38.7120, longitude: -9.1460 },
  },

  // ═══ LISBOA — ACCOMMODATION ═══
  {
    id: "principe-real",
    name: "Príncipe Real",
    category: "accommodation",
    description: "Le quartier le plus cool. Concept stores, jardins.",
    zone: "lisboa",
    coordinate: { latitude: 38.7175, longitude: -9.1510 },
  },
  {
    id: "intendente",
    name: "Intendente / Anjos",
    category: "accommodation",
    description: "Alternatif, multiculturel, street art.",
    zone: "lisboa",
    coordinate: { latitude: 38.7230, longitude: -9.1360 },
  },
  {
    id: "santos",
    name: "Santos / Madragoa",
    category: "accommodation",
    description: "Design district, proche du fleuve.",
    zone: "lisboa",
    coordinate: { latitude: 38.7080, longitude: -9.1580 },
  },

  // ═══ ALENTEJO — FOOD ═══
  {
    id: "azenha",
    name: "Azenha do Mar",
    category: "food",
    description: "Poisson le plus frais du pays. Pas de résa, arrivez tôt.",
    zone: "alentejo",
    coordinate: { latitude: 37.7650, longitude: -8.7870 },
    price: "€€",
  },

  // ═══ ALENTEJO — ACCOMMODATION ═══
  {
    id: "milfontes",
    name: "Vila Nova de Milfontes",
    category: "accommodation",
    description: "Animé, estuaire magnifique. Parfait comme base.",
    zone: "alentejo",
    coordinate: { latitude: 37.7260, longitude: -8.7830 },
  },
  {
    id: "zambujeira",
    name: "Zambujeira do Mar",
    category: "accommodation",
    description: "Village blanc perché sur la falaise. Ultra mignon.",
    zone: "alentejo",
    coordinate: { latitude: 37.5260, longitude: -8.7510 },
  },

  // ═══ ALENTEJO — ACTIVITY ═══
  {
    id: "rota-vicentina",
    name: "Rota Vicentina",
    category: "activity",
    description: "Sentier des Pêcheurs. Un des plus beaux d'Europe.",
    zone: "alentejo",
    coordinate: { latitude: 37.5990, longitude: -8.7870 },
  },
  {
    id: "surf-malhao",
    name: "Plage de Malhão",
    category: "activity",
    description: "Surf. Écoles dispos. Vagues parfaites en avril.",
    zone: "alentejo",
    coordinate: { latitude: 37.7100, longitude: -8.7920 },
  },
  {
    id: "kayak-mira",
    name: "Kayak Rio Mira",
    category: "activity",
    description: "Eau calme, contraste avec l'océan.",
    zone: "alentejo",
    coordinate: { latitude: 37.7230, longitude: -8.7780 },
  },
  {
    id: "cap-sardao",
    name: "Cap Sardão",
    category: "activity",
    description: "Phare. Coucher de soleil + Vinho Verde.",
    zone: "alentejo",
    coordinate: { latitude: 37.5990, longitude: -8.8150 },
  },

  // ═══ ALENTEJO — NATURE ═══
  {
    id: "praia-odeceixe",
    name: "Praia de Odeceixe",
    category: "nature",
    description: "Plage sauvage entre rivière et océan.",
    zone: "alentejo",
    coordinate: { latitude: 37.4440, longitude: -8.7960 },
  },
];

// Zone camera presets
export const ZONES = {
  lisboa: {
    latitude: 38.7139,
    longitude: -9.1394,
    latitudeDelta: 0.045,
    longitudeDelta: 0.045,
  },
  alentejo: {
    latitude: 37.6300,
    longitude: -8.7850,
    latitudeDelta: 0.45,
    longitudeDelta: 0.45,
  },
};

// Category visual config
export const CATEGORY_CONFIG: Record<SpotCategory, { color: string; icon: string }> = {
  food: { color: "#FF6B4A", icon: "utensils" },
  culture: { color: "#AF52DE", icon: "landmark" },
  nightlife: { color: "#FF453A", icon: "wine" },
  nature: { color: "#34C759", icon: "trees" },
  accommodation: { color: "#2EC4A8", icon: "hotel" },
  activity: { color: "#FFD60A", icon: "zap" },
};
