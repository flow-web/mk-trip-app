import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { use$ } from "@legendapp/state/react";
import { initNotifications } from "../components/NotificationService";
import { auth$, initAuth } from "../store/auth$";

const LEGACY_CLEARED_KEY = "mk_legacy_cleared_v1";

async function clearLegacyKeys() {
  if (await AsyncStorage.getItem(LEGACY_CLEARED_KEY)) return;
  await AsyncStorage.multiRemove([
    "mk_trip_checklist",
    "mk_budget",
    "mk_planning_done",
  ]);
  await AsyncStorage.setItem(LEGACY_CLEARED_KEY, "1");
}

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const loaded = use$(auth$.loaded);

  useEffect(() => {
    setColorScheme("dark");
    clearLegacyKeys();
    initAuth();
    initNotifications();
  }, []);

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F0F11",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#FF6B4A" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F0F11" }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F0F11" },
          animation: "fade",
        }}
      />
    </View>
  );
}
