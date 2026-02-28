import { View, Text, Pressable } from "react-native";
import { X, UtensilsCrossed, Landmark, Wine, Trees, Hotel, Zap, MapPin } from "lucide-react-native";
import { Spot, CATEGORY_CONFIG } from "./MapData";

type Props = {
  spot: Spot | null;
  onClose: () => void;
};

function CategoryIcon({ category, color, size = 18 }: { category: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2 };
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

const ZONE_LABEL: Record<string, { label: string; color: string }> = {
  lisboa: { label: "Lisboa", color: "#FF6B4A" },
  alentejo: { label: "Alentejo", color: "#2EC4A8" },
};

export default function SpotCard({ spot, onClose }: Props) {
  if (!spot) return null;

  const cfg = CATEGORY_CONFIG[spot.category];
  const zone = ZONE_LABEL[spot.zone];

  return (
    <Pressable
      className="absolute inset-0"
      onPress={onClose}
    >
      <View
        className="absolute left-0 right-0"
        style={{ bottom: 96 }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              marginHorizontal: 12,
              borderRadius: 32,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: "rgba(28,28,30,0.95)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.6)",
              padding: 20,
            }}
          >
            {/* Header row */}
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-row items-center gap-3 flex-1 mr-3">
                {/* Category icon circle */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: cfg.color + "22",
                    borderWidth: 1.5,
                    borderColor: cfg.color + "55",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon category={spot.category} color={cfg.color} size={20} />
                </View>

                {/* Name */}
                <View className="flex-1">
                  <Text
                    className="text-txt-main font-semibold"
                    style={{ fontSize: 18, lineHeight: 22 }}
                    numberOfLines={2}
                  >
                    {spot.name}
                  </Text>
                </View>
              </View>

              {/* Close button */}
              <Pressable
                onPress={onClose}
                className="active:scale-90"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color="#8E8E93" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Description */}
            <Text
              className="text-txt-muted"
              style={{ fontSize: 14, lineHeight: 20, marginBottom: 14 }}
            >
              {spot.description}
            </Text>

            {/* Badges row */}
            <View className="flex-row items-center gap-2">
              {/* Zone badge */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 50,
                  backgroundColor: zone.color + "22",
                  borderWidth: 1,
                  borderColor: zone.color + "44",
                }}
              >
                <Text style={{ color: zone.color, fontSize: 12, fontWeight: "600" }}>
                  {zone.label}
                </Text>
              </View>

              {/* Category badge */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 50,
                  backgroundColor: cfg.color + "18",
                  borderWidth: 1,
                  borderColor: cfg.color + "33",
                }}
              >
                <Text style={{ color: cfg.color, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
                  {spot.category}
                </Text>
              </View>

              {/* Price badge */}
              {spot.price && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 50,
                    backgroundColor: "rgba(255,214,10,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(255,214,10,0.25)",
                  }}
                >
                  <Text style={{ color: "#FFD60A", fontSize: 12, fontWeight: "700" }}>
                    {spot.price}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}
