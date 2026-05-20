import { View, Text, ImageBackground } from "react-native";
import { Sun } from "lucide-react-native";
import { use$ } from "@legendapp/state/react";
import { trips$ } from "../store/trips$";
import { currentTripId$ } from "../store/currentTrip$";

export default function CountdownCard() {
  const tripId = use$(currentTripId$);
  const trip = use$((trips$ as any)[tripId ?? "_"]);

  const destination = trip?.destination ?? "Voyage";
  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const now = new Date();
  const daysUntil = startDate
    ? Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const dateLabel = startDate
    ? startDate.toLocaleString("fr-FR", { month: "long", year: "numeric" })
    : "";
  const dateLabelCap = dateLabel
    ? dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)
    : "";

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
                {destination}
              </Text>
              <Text className="text-txt-main text-lg font-semibold" style={{ letterSpacing: -0.5 }}>
                {trip?.country ?? ""}
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
              J-{daysUntil}
            </Text>
            {dateLabelCap ? (
              <Text className="text-txt-muted text-xs tracking-widest uppercase mt-1">
                {dateLabelCap}
              </Text>
            ) : null}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
