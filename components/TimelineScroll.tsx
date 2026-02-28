import { View, Text, ScrollView, Pressable } from "react-native";
import {
  UtensilsCrossed,
  Landmark,
  Wine,
  Trees,
  Hotel,
  Zap,
} from "lucide-react-native";
import { TRIP_DAYS } from "./PlanningData";
import { SpotCategory } from "./MapData";
import React from "react";

const CATEGORY_ICON: Record<SpotCategory, { Icon: React.ComponentType<any>; color: string }> = {
  food:          { Icon: UtensilsCrossed, color: "#FF6B4A" },
  culture:       { Icon: Landmark,        color: "#AF52DE" },
  nightlife:     { Icon: Wine,            color: "#FF453A" },
  nature:        { Icon: Trees,           color: "#34C759" },
  accommodation: { Icon: Hotel,           color: "#2EC4A8" },
  activity:      { Icon: Zap,             color: "#FFD60A" },
};

export default function TimelineScroll() {
  // Show Day 1 activities (first 5) — the closest upcoming day
  const day = TRIP_DAYS[0];
  const activities = day.activities.slice(0, 5);

  return (
    <View className="mt-5">
      <Text className="text-txt-muted text-[10px] font-bold tracking-widest uppercase mx-4 mb-3">
        Jour 1 — {day.theme}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {activities.map((act) => {
          const cat = CATEGORY_ICON[act.category];
          const { Icon, color } = cat;

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
                {act.time}
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
