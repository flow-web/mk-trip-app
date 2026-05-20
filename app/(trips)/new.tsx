import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { auth$ } from "../../store/auth$";
import { trips$ } from "../../store/trips$";
import { currentTripId$ } from "../../store/currentTrip$";

const TRIP_TYPES = ["city_break", "road_trip", "sport", "hike", "beach", "other"] as const;
const COLORS = ["#FF6B4A", "#2EC4A8", "#AF52DE", "#FFD60A", "#5AC8FA", "#34C759"];

export default function NewTrip() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState<(typeof TRIP_TYPES)[number]>("road_trip");
  const [color, setColor] = useState(COLORS[0]);
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Donne un nom à ton voyage");
      return;
    }
    const userId = auth$.user.peek()?.id;
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        owner_id: userId,
        name: name.trim(),
        destination: destination.trim() || null,
        trip_type: tripType,
        cover_color: color,
        total_budget: budget ? Number(budget) : null,
      })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      Alert.alert("Erreur", error?.message ?? "Création impossible");
      return;
    }
    (trips$ as any)[data.id].set(data);
    currentTripId$.set(data.id);
    router.replace(`/(trips)/${data.id}/(tabs)` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F0F11" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
        <Text style={{ color: "#F2F2F7", fontSize: 18, fontWeight: "700" }}>Nouveau voyage</Text>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <X size={20} color="#8E8E93" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Field label="Nom" value={name} onChange={setName} placeholder="Road trip skatepark Sud" />
        <Field label="Destination" value={destination} onChange={setDestination} placeholder="Sud-France" />
        <Field label="Budget total (€)" value={budget} onChange={setBudget} placeholder="800" keyboard="numeric" />

        <Text style={labelStyle}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TRIP_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTripType(t)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 50,
                backgroundColor: tripType === t ? "#FF6B4A" : "#1C1C1E",
                borderWidth: 1,
                borderColor: tripType === t ? "#FF6B4A" : "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: tripType === t ? "#fff" : "#F2F2F7", fontSize: 13, fontWeight: "600" }}>
                {t.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={labelStyle}>Couleur</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: "#fff",
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={onCreate}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: "#FF6B4A",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 16,
            opacity: pressed || loading ? 0.85 : 1,
          })}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {loading ? "Création..." : "Créer le voyage"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const labelStyle = {
  color: "#8E8E93",
  fontSize: 11,
  fontWeight: "700" as const,
  letterSpacing: 1.2,
  textTransform: "uppercase" as const,
  marginTop: 6,
};

function Field({ label, value, onChange, placeholder, keyboard }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboard?: "numeric" | "default" }) {
  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#48484A"
        keyboardType={keyboard ?? "default"}
        style={{
          backgroundColor: "#1C1C1E",
          color: "#F2F2F7",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          marginTop: 6,
        }}
      />
    </View>
  );
}
