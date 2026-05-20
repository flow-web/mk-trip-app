import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, Plus, Hash } from "lucide-react-native";
import { useRouter } from "expo-router";
import { use$ } from "@legendapp/state/react";
import { trips$ } from "../store/trips$";
import { currentTripId$ } from "../store/currentTrip$";

export default function TripSwitcher() {
  const [open, setOpen] = useState(false);
  const trips = Object.values(use$(trips$) ?? {}) as any[];
  const currentId = use$(currentTripId$);
  const current = trips.find((t) => t.id === currentId);
  const router = useRouter();

  const switchTo = (id: string) => {
    currentTripId$.set(id);
    setOpen(false);
    router.replace(`/(trips)/${id}/(tabs)` as any);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Text
          style={{
            color: "#F2F2F7",
            fontSize: 20,
            fontWeight: "600",
            letterSpacing: -0.5,
          }}
        >
          {current?.name ?? "MK Trip"}
        </Text>
        <ChevronDown size={16} color="#8E8E93" />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#1C1C1E",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 32,
              paddingTop: 16,
              paddingHorizontal: 20,
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#48484A",
                }}
              />
            </View>
            <FlatList
              data={trips}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => switchTo(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 32,
                      borderRadius: 3,
                      backgroundColor: item.cover_color,
                    }}
                  />
                  <Text
                    style={{
                      color: item.id === currentId ? "#FF6B4A" : "#F2F2F7",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setOpen(false);
                  router.push("/(trips)/new");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#FF6B4A",
                  borderRadius: 12,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Nouveau
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setOpen(false);
                  router.push("/(trips)/join");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#2C2C2E",
                  borderRadius: 12,
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Hash size={16} color="#F2F2F7" />
                <Text style={{ color: "#F2F2F7", fontWeight: "600" }}>
                  Rejoindre
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
