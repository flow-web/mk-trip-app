import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { use$ } from "@legendapp/state/react";
import { BudgetProvider } from "../components/BudgetStore";
import { PlanningProvider } from "../components/PlanningStore";
import { initNotifications } from "../components/NotificationService";
import { auth$, initAuth } from "../store/auth$";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const loaded = use$(auth$.loaded);

  useEffect(() => {
    setColorScheme("dark");
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
    <BudgetProvider>
      <PlanningProvider>
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
      </PlanningProvider>
    </BudgetProvider>
  );
}
