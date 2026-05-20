import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  UtensilsCrossed,
  Landmark,
  Wine,
  Trees,
  Hotel,
  Zap,
  MapPin,
} from "lucide-react-native";
import FloatingDock from "../../../../components/FloatingDock";
import SpotCard from "../../../../components/SpotCard";
import {
  SPOTS,
  ZONES,
  CATEGORY_CONFIG,
  type Spot,
  type SpotCategory,
} from "../../../../components/MapData";

// ─── Dark map style ───────────────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

// ─── Category icon helper ─────────────────────────────────────────────────────
function CategoryIcon({ category, color, size = 14 }: { category: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2.5 };
  switch (category) {
    case "food": return <UtensilsCrossed {...props} />;
    case "culture": return <Landmark {...props} />;
    case "nightlife": return <Wine {...props} />;
    case "nature": return <Trees {...props} />;
    case "accommodation": return <Hotel {...props} />;
    case "activity": return <Zap {...props} />;
    default: return <MapPin {...props} />;
  }
}

// ─── Category filter pills ────────────────────────────────────────────────────
const ALL_CATEGORIES: SpotCategory[] = ["food", "culture", "nightlife", "nature", "accommodation", "activity"];

function CategoryPills({
  active,
  onToggle,
}: {
  active: Set<SpotCategory>;
  onToggle: (cat: SpotCategory) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {ALL_CATEGORIES.map((cat) => {
        const cfg = CATEGORY_CONFIG[cat];
        const isActive = active.has(cat);
        return (
          <Pressable
            key={cat}
            onPress={() => onToggle(cat)}
            className="active:scale-95"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 50,
              backgroundColor: isActive ? cfg.color + "30" : "rgba(28,28,30,0.85)",
              borderWidth: 1.5,
              borderColor: isActive ? cfg.color : "rgba(255,255,255,0.10)",
            }}
          >
            <CategoryIcon category={cat} color={isActive ? cfg.color : "#8E8E93"} size={13} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isActive ? cfg.color : "#8E8E93",
                textTransform: "capitalize",
              }}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Zone switcher pills ──────────────────────────────────────────────────────
function ZoneSwitcher({
  active,
  onChange,
}: {
  active: "lisboa" | "alentejo";
  onChange: (z: "lisboa" | "alentejo") => void;
}) {
  return (
    <View
      className="flex-row self-center"
      style={{
        backgroundColor: "rgba(28,28,30,0.85)",
        borderRadius: 50,
        padding: 3,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {(["lisboa", "alentejo"] as const).map((z) => {
        const isActive = active === z;
        const color = z === "lisboa" ? "#FF6B4A" : "#2EC4A8";
        return (
          <Pressable
            key={z}
            onPress={() => onChange(z)}
            className="active:scale-95"
            style={{
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 50,
              backgroundColor: isActive ? color : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isActive ? "#FFFFFF" : "#8E8E93",
                textTransform: "capitalize",
              }}
            >
              {z === "lisboa" ? "Lisboa" : "Alentejo"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Web fallback — Spot Directory ────────────────────────────────────────────
function WebSpotDirectory({
  spots,
  activeCategories,
  onToggleCategory,
  activeZone,
  onChangeZone,
}: {
  spots: Spot[];
  activeCategories: Set<SpotCategory>;
  onToggleCategory: (c: SpotCategory) => void;
  activeZone: "lisboa" | "alentejo";
  onChangeZone: (z: "lisboa" | "alentejo") => void;
}) {
  const filtered = spots.filter(
    (s) => activeCategories.size === 0 || activeCategories.has(s.category)
  );
  const lisboaSpots = filtered.filter((s) => s.zone === "lisboa");
  const alentejoSpots = filtered.filter((s) => s.zone === "alentejo");

  const zones: { key: "lisboa" | "alentejo"; label: string; color: string; spots: Spot[] }[] = [
    { key: "lisboa", label: "Lisboa", color: "#FF6B4A", spots: lisboaSpots },
    { key: "alentejo", label: "Alentejo", color: "#2EC4A8", spots: alentejoSpots },
  ];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="pt-6 pb-4">
        <Text className="text-txt-main font-bold" style={{ fontSize: 24, marginBottom: 4 }}>
          Spot Directory
        </Text>
        <Text className="text-txt-muted" style={{ fontSize: 14 }}>
          {filtered.length} lieux sélectionnés
        </Text>
      </View>

      {/* Zone switcher */}
      <View className="mb-4">
        <ZoneSwitcher active={activeZone} onChange={onChangeZone} />
      </View>

      {/* Category filters */}
      <View className="mb-6" style={{ marginHorizontal: -16 }}>
        <CategoryPills active={activeCategories} onToggle={onToggleCategory} />
      </View>

      {/* Spots by zone */}
      {zones.map(({ key, label, color, spots: zoneSpots }) => {
        if (zoneSpots.length === 0) return null;
        return (
          <View key={key} className="mb-6">
            {/* Zone header */}
            <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
              <Text style={{ color, fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
              </Text>
              <Text className="text-txt-muted" style={{ fontSize: 12 }}>
                {zoneSpots.length} lieux
              </Text>
            </View>

            {/* Spot cards */}
            <View style={{ gap: 8 }}>
              {zoneSpots.map((spot) => {
                const cfg = CATEGORY_CONFIG[spot.category];
                return (
                  <View
                    key={spot.id}
                    style={{
                      backgroundColor: "#1C1C1E",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.06)",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    {/* Icon */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: cfg.color + "20",
                        borderWidth: 1.5,
                        borderColor: cfg.color + "40",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon category={spot.category} color={cfg.color} size={18} />
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text
                          className="text-txt-main font-semibold flex-1 mr-2"
                          style={{ fontSize: 15 }}
                          numberOfLines={1}
                        >
                          {spot.name}
                        </Text>
                        {spot.price && (
                          <Text style={{ color: "#FFD60A", fontSize: 12, fontWeight: "700" }}>
                            {spot.price}
                          </Text>
                        )}
                      </View>
                      <Text className="text-txt-muted" style={{ fontSize: 13, lineHeight: 18 }}>
                        {spot.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Native map view (lazy import) ───────────────────────────────────────────
function NativeMapView({
  spots,
  activeCategories,
  activeZone,
  onChangeZone,
  onToggleCategory,
  selectedSpot,
  onSelectSpot,
}: {
  spots: Spot[];
  activeCategories: Set<SpotCategory>;
  activeZone: "lisboa" | "alentejo";
  onChangeZone: (z: "lisboa" | "alentejo") => void;
  onToggleCategory: (c: SpotCategory) => void;
  selectedSpot: Spot | null;
  onSelectSpot: (s: Spot | null) => void;
}) {
  // Dynamic import only on native — avoids Metro bundling issues on web
  const MapView = require("react-native-maps").default;
  const { Marker } = require("react-native-maps");

  const mapRef = useRef<any>(null);

  const filtered = spots.filter(
    (s) => activeCategories.size === 0 || activeCategories.has(s.category)
  );

  const handleZoneChange = (z: "lisboa" | "alentejo") => {
    onChangeZone(z);
    mapRef.current?.animateToRegion(ZONES[z], 600);
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={ZONES.lisboa}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={() => onSelectSpot(null)}
      >
        {filtered.map((spot) => {
          const cfg = CATEGORY_CONFIG[spot.category];
          const isSelected = selectedSpot?.id === spot.id;
          return (
            <Marker
              key={spot.id}
              coordinate={spot.coordinate}
              onPress={() => onSelectSpot(spot)}
              tracksViewChanges={false}
            >
              <View
                style={{
                  width: isSelected ? 44 : 36,
                  height: isSelected ? 44 : 36,
                  borderRadius: isSelected ? 22 : 18,
                  backgroundColor: isSelected ? cfg.color : cfg.color + "CC",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isSelected ? 3 : 2,
                  borderColor: isSelected ? "#FFFFFF" : cfg.color + "80",
                  shadowColor: cfg.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.8 : 0.4,
                  shadowRadius: isSelected ? 8 : 4,
                  elevation: isSelected ? 8 : 4,
                }}
              >
                <CategoryIcon category={spot.category} color="#FFFFFF" size={isSelected ? 18 : 14} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating overlay controls */}
      <View
        className="absolute top-0 left-0 right-0"
        style={{ paddingTop: 16, gap: 10 }}
        pointerEvents="box-none"
      >
        {/* Zone switcher */}
        <View className="px-4" pointerEvents="auto">
          <ZoneSwitcher active={activeZone} onChange={handleZoneChange} />
        </View>

        {/* Category filters */}
        <View pointerEvents="auto">
          <CategoryPills active={activeCategories} onToggle={onToggleCategory} />
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [activeZone, setActiveZone] = useState<"lisboa" | "alentejo">("lisboa");
  const [activeCategories, setActiveCategories] = useState<Set<SpotCategory>>(new Set());
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const toggleCategory = (cat: SpotCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const isWeb = Platform.OS === "web";

  return (
    <View className="flex-1 bg-bg-dark">
      {isWeb ? (
        <SafeAreaView className="flex-1">
          <WebSpotDirectory
            spots={SPOTS}
            activeCategories={activeCategories}
            onToggleCategory={toggleCategory}
            activeZone={activeZone}
            onChangeZone={setActiveZone}
          />
        </SafeAreaView>
      ) : (
        <View className="flex-1">
          <SafeAreaView className="flex-1" edges={["top"]}>
            <NativeMapView
              spots={SPOTS}
              activeCategories={activeCategories}
              activeZone={activeZone}
              onChangeZone={setActiveZone}
              onToggleCategory={toggleCategory}
              selectedSpot={selectedSpot}
              onSelectSpot={setSelectedSpot}
            />
          </SafeAreaView>

          {/* SpotCard overlay */}
          {selectedSpot && (
            <SpotCard spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
          )}
        </View>
      )}

      <FloatingDock />
    </View>
  );
}
