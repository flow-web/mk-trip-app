export type SpotCategory = "food" | "culture" | "nightlife" | "nature" | "accommodation" | "activity" | "sport";

export const CATEGORY_CONFIG: Record<SpotCategory, { color: string }> = {
  food: { color: "#FF6B4A" },
  culture: { color: "#AF52DE" },
  nightlife: { color: "#FF453A" },
  nature: { color: "#34C759" },
  accommodation: { color: "#2EC4A8" },
  activity: { color: "#FFD60A" },
  sport: { color: "#5AC8FA" },
};

export const ZONES = {
  lisboa: { latitude: 38.7223, longitude: -9.1393, latitudeDelta: 0.04, longitudeDelta: 0.04 },
  alentejo: { latitude: 38.2, longitude: -8.6, latitudeDelta: 0.5, longitudeDelta: 0.5 },
};

export type Spot = {
  id: string;
  name: string;
  description: string;
  category: SpotCategory;
  zone: "lisboa" | "alentejo";
  coordinate: { latitude: number; longitude: number };
  price?: string;
};
