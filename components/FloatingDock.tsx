import { View, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Map, Wallet, Plus, CalendarDays, BookOpen } from "lucide-react-native";
import { useState } from "react";
import AddExpenseModal from "./AddExpenseModal";

export default function FloatingDock() {
  const router = useRouter();
  const path = usePathname();
  const [modalVisible, setModalVisible] = useState(false);

  const items = [
    { icon: CalendarDays, route: "/(tabs)/planning" as const, label: "planning" },
    { icon: Map, route: "/(tabs)/map" as const, label: "map" },
    { icon: Plus, route: null, label: "add", isPrimary: true },
    { icon: Wallet, route: "/(tabs)/budget" as const, label: "budget" },
    { icon: BookOpen, route: "/(tabs)/guide" as const, label: "guide" },
  ];

  return (
    <>
      <AddExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <View
        className="absolute bottom-8 self-center flex-row items-center rounded-pill px-3 py-2"
        style={{
          backgroundColor: "rgba(28,28,30,0.75)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          gap: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          elevation: 20,
        }}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          const isActive = item.route && path.includes(item.label);

          if (item.isPrimary) {
            return (
              <Pressable
                key={i}
                className="bg-primary rounded-full items-center justify-center active:scale-90"
                style={{ width: 50, height: 50 }}
                onPress={() => setModalVisible(true)}
              >
                <Icon size={24} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={i}
              className="items-center justify-center active:scale-90"
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
              }}
              onPress={() => item.route && router.push(item.route)}
            >
              <Icon
                size={22}
                color={isActive ? "#F2F2F7" : "#8E8E93"}
                strokeWidth={1.5}
              />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
