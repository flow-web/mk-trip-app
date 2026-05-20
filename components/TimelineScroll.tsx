import { View, Text, ScrollView, Pressable } from "react-native";
import {
  UtensilsCrossed,
  Landmark,
  Wine,
  Trees,
  Hotel,
  Zap,
} from "lucide-react-native";
import React from "react";
import { use$ } from "@legendapp/state/react";
import { days$ } from "../store/days$";
import { activities$ } from "../store/activities$";
import { currentTripId$ } from "../store/currentTrip$";

type SpotCategory = "food" | "culture" | "nightlife" | "nature" | "accommodation" | "activity";

const CATEGORY_ICON: Record<SpotCategory, { Icon: React.ComponentType<any>; color: string }> = {
  food:          { Icon: UtensilsCrossed, color: "#FF6B4A" },
  culture:       { Icon: Landmark,        color: "#AF52DE" },
  nightlife:     { Icon: Wine,            color: "#FF453A" },
  nature:        { Icon: Trees,           color: "#34C759" },
  accommodation: { Icon: Hotel,           color: "#2EC4A8" },
  activity:      { Icon: Zap,             color: "#FFD60A" },
};

export default function TimelineScroll() {
  const tripId = use$(currentTripId$);
  const days = (Object.values(use$(days$) ?? {}) as any[])
    .filter((d) => d.trip_id === tripId)
    .sort((a, b) => a.day_number - b.day_number);

  const allActivities = (Object.values(use$(activities$) ?? {}) as any[]);

  // Show first day's activities (closest upcoming)
  const day = days[0];
  const dayActivities = day
    ? allActivities
        .filter((a) => a.day_id === day.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .slice(0, 5)
    : [];

  if (!day) return null;

  return (
    <View className="mt-5">
      <Text className="text-txt-muted text-[10px] font-bold tracking-widest uppercase mx-4 mb-3">
        Jour {day.day_number}{day.theme ? ` — ${day.theme}` : ""}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {dayActivities.map((act) => {
          const catKey = (act.category ?? "activity") as SpotCategory;
          const cat = CATEGORY_ICON[catKey] ?? CATEGORY_ICON["activity"];
          const { Icon, color } = cat;

          const timeLabel = act.time
            ? String(act.time).slice(0, 5)
            : "";

          return (
            <Pressable
              key={act.id}
              className="bg-card-dark rounded-bento items-center justify-center active:scale-95"
              style={{
                width: 88,
                height: 100,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Text className="text-txt-muted text-[10px] font-bold tracking-wider mb-2">
                {timeLabel}
              </Text>
              <View
                className="rounded-2xl items-center justify-center mb-1.5"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: color + "18",
                }}
              >
                <Icon size={22} color={color} strokeWidth={1.5} />
              </View>
              <Text
                className="text-txt-main text-[11px] font-medium text-center"
                numberOfLines={2}
                style={{ paddingHorizontal: 6 }}
              >
                {act.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
