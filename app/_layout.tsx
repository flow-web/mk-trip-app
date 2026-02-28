import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { BudgetProvider } from "../components/BudgetStore";
import { PlanningProvider } from "../components/PlanningStore";
import { initNotifications } from "../components/NotificationService";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme("dark");
    initNotifications();
  }, []);

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
