import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { use$ } from "@legendapp/state/react";
import { useRouter } from "expo-router";
import { Plus, Hash, LogOut } from "lucide-react-native";
import { trips$ } from "../../store/trips$";
import { auth$, signOut } from "../../store/auth$";
import { currentTripId$ } from "../../store/currentTrip$";

export default function TripsList() {
  const router = useRouter();
  const trips = Object.values(use$(trips$) ?? {});
  const profile = use$(auth$.profile);

  const openTrip = (id: string) => {
    currentTripId$.set(id);
    router.replace(`/(trips)/${id}/(tabs)` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F0F11" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <View>
            <Text style={{ color: "#8E8E93", fontSize: 13 }}>Bonjour</Text>
            <Text style={{ color: "#F2F2F7", fontSize: 22, fontWeight: "700" }}>{profile?.display_name ?? "..."}</Text>
          </View>
          <Pressable onPress={signOut} style={{ padding: 8 }}>
            <LogOut size={20} color="#8E8E93" />
          </Pressable>
        </View>

        <Text style={{ color: "#8E8E93", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
          Mes voyages
        </Text>

        {trips.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text style={{ color: "#8E8E93", fontSize: 14 }}>Aucun voyage pour l'instant.</Text>
          </View>
        ) : (
          trips.map((trip: any) => (
            <Pressable
              key={trip.id}
              onPress={() => openTrip(trip.id)}
              style={{
                backgroundColor: "#1C1C1E",
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 8, height: 40, borderRadius: 4, backgroundColor: trip.cover_color }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#F2F2F7", fontSize: 16, fontWeight: "600" }}>{trip.name}</Text>
                  {trip.destination && <Text style={{ color: "#8E8E93", fontSize: 13, marginTop: 2 }}>{trip.destination}</Text>}
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
          <Pressable
            onPress={() => router.push("/(trips)/new")}
            style={{ flex: 1, backgroundColor: "#FF6B4A", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Plus size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Nouveau</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(trips)/join")}
            style={{ flex: 1, backgroundColor: "#1C1C1E", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Hash size={18} color="#F2F2F7" />
            <Text style={{ color: "#F2F2F7", fontSize: 15, fontWeight: "600" }}>Rejoindre</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
