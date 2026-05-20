import { useEffect } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { currentTripId$ } from "../../../store/currentTrip$";

export default function TripLayout() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  useEffect(() => {
    if (tripId) currentTripId$.set(tripId);
  }, [tripId]);

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
