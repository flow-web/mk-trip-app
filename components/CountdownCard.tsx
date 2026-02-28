import { View, Text, ImageBackground } from "react-native";
import { Cloud, Sun } from "lucide-react-native";

const TRIP_DATE = new Date("2026-04-10");

function getDaysUntil(): number {
  const now = new Date();
  const diff = TRIP_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function CountdownCard() {
  const days = getDaysUntil();

  return (
    <View className="mx-4 mt-2 rounded-bento overflow-hidden" style={{ height: 220 }}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=70" }}
        className="flex-1"
        imageStyle={{ borderRadius: 24 }}
      >
        <View className="flex-1 justify-between p-6" style={{ backgroundColor: "rgba(15,15,17,0.55)" }}>
          {/* Top row: location + weather */}
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-txt-muted text-xs font-bold tracking-widest uppercase">
                Lisbonne
              </Text>
              <Text className="text-txt-main text-lg font-semibold" style={{ letterSpacing: -0.5 }}>
                Portugal
              </Text>
            </View>
            <View className="flex-row items-center gap-2 bg-black/40 rounded-pill px-3 py-1.5">
              <Sun size={16} color="#FFD60A" strokeWidth={1.5} />
              <Text className="text-txt-main text-sm font-medium">19°</Text>
            </View>
          </View>

          {/* Bottom: countdown */}
          <View>
            <Text className="text-primary text-6xl font-bold" style={{ letterSpacing: -3 }}>
              J-{days}
            </Text>
            <Text className="text-txt-muted text-xs tracking-widest uppercase mt-1">
              Avril 2026
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
