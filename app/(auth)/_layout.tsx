import { Stack, Redirect } from "expo-router";
import { use$ } from "@legendapp/state/react";
import { auth$ } from "../../store/auth$";

export default function AuthLayout() {
  const session = use$(auth$.session);
  if (session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
