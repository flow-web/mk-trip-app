import { Tabs, Redirect } from "expo-router";
import { use$ } from "@legendapp/state/react";
import { auth$ } from "../../store/auth$";

export default function TabsLayout() {
  const session = use$(auth$.session);
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="planning" />
      <Tabs.Screen name="guide" />
    </Tabs>
  );
}
