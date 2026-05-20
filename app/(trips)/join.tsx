import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { trips$ } from "../../store/trips$";
import { currentTripId$ } from "../../store/currentTrip$";
import { normalizeJoinCode, isValidJoinCode } from "../../lib/joinCode";

export default function JoinTrip() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onJoin = async () => {
    const normalized = normalizeJoinCode(code);
    if (!isValidJoinCode(normalized)) {
      Alert.alert("Code invalide", "Format attendu : MKT-XXXX");
      return;
    }
    setLoading(true);
    const { data: tripId, error } = await supabase.rpc("join_trip_by_code" as any, { code: normalized });
    if (error) {
      setLoading(false);
      Alert.alert("Erreur", error.message === "TRIP_NOT_FOUND" ? "Code inconnu" : error.message);
      return;
    }
    const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId as any).single();
    setLoading(false);
    if (trip) {
      (trips$ as any)[trip.id].set(trip);
      currentTripId$.set(trip.id);
      router.replace(`/(trips)/${trip.id}/(tabs)` as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F0F11" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <Text style={{ color: "#F2F2F7", fontSize: 18, fontWeight: "700" }}>Rejoindre</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <X size={20} color="#8E8E93" />
        </Pressable>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "#8E8E93", fontSize: 14 }}>
          Saisis le code que ton ami t'a partagé (format MKT-XXXX).
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="MKT-A9F2"
          placeholderTextColor="#48484A"
          maxLength={8}
          style={{
            backgroundColor: "#1C1C1E",
            color: "#F2F2F7",
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 18,
            fontWeight: "600",
            letterSpacing: 2,
            textAlign: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />
        <Pressable
          onPress={onJoin}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: "#FF6B4A",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed || loading ? 0.85 : 1,
          })}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {loading ? "Recherche..." : "Rejoindre"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
