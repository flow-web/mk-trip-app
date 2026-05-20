import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Landmark,
  Wine,
  Trees,
  Hotel,
  Zap,
  CheckCircle2,
} from "lucide-react-native";
import { use$ } from "@legendapp/state/react";
import { days$ } from "../../../../store/days$";
import { activities$ } from "../../../../store/activities$";
import { activityCompletions$ } from "../../../../store/activityCompletions$";
import { currentTripId$ } from "../../../../store/currentTrip$";
import { auth$ } from "../../../../store/auth$";
import { supabase } from "../../../../lib/supabase";
import type { SpotCategory } from "../../../../lib/mapConfig";
import FloatingDock from "../../../../components/FloatingDock";

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY: Record<SpotCategory, { color: string; Icon: React.ComponentType<any> }> = {
  food: { color: "#FF6B4A", Icon: UtensilsCrossed },
  culture: { color: "#AF52DE", Icon: Landmark },
  nightlife: { color: "#FF453A", Icon: Wine },
  nature: { color: "#34C759", Icon: Trees },
  accommodation: { color: "#2EC4A8", Icon: Hotel },
  activity: { color: "#FFD60A", Icon: Zap },
  sport: { color: "#5AC8FA", Icon: Zap },
};

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  isLast,
  accentColor,
  isDone,
  onToggle,
  isNext,
}: {
  activity: any;
  isLast: boolean;
  accentColor: string;
  isDone: boolean;
  onToggle: () => void;
  isNext: boolean;
}) {
  const cat = CATEGORY[activity.category as SpotCategory] ?? CATEGORY.activity;
  const { Icon } = cat;
  const catColor = cat.color;

  return (
    <View style={{ flexDirection: "row", minHeight: 80, paddingBottom: isLast ? 0 : 4 }}>
      <View style={{ width: 72, alignItems: "center", position: "relative" }}>
        <Text
          style={{
            color: isDone ? "#8E8E93" : "#F2F2F7",
            fontSize: 11,
            fontWeight: "600",
            marginTop: 18,
            letterSpacing: 0.2,
          }}
        >
          {activity.time?.slice(0, 5) ?? ""}
        </Text>
        <View
          style={{
            position: "absolute",
            right: -1,
            top: 20,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isDone ? "#3A3A3C" : accentColor,
            zIndex: 2,
          }}
        />
        {!isLast && (
          <View
            style={{
              position: "absolute",
              right: 2,
              top: 30,
              bottom: 0,
              width: 2,
              backgroundColor: isDone ? "#3A3A3C" : "transparent",
              borderRightWidth: isDone ? 0 : 2,
              borderStyle: isDone ? "solid" : "dashed",
              borderColor: isDone ? "transparent" : "rgba(255,255,255,0.15)",
            }}
          />
        )}
      </View>

      <View style={{ width: 12 }} />

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          flex: 1,
          marginBottom: 12,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <View
          style={{
            backgroundColor: "#1C1C1E",
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: isNext ? accentColor + "55" : isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)",
            opacity: isDone ? 0.5 : 1,
            ...(isNext && { boxShadow: `0 0 12px ${accentColor}33` }),
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: catColor + "1A",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={18} color={catColor} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: isDone ? "#8E8E93" : "#F2F2F7",
                fontSize: 14,
                fontWeight: "600",
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {activity.title}
            </Text>
            {activity.subtitle && (
              <Text style={{ color: "#8E8E93", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {activity.subtitle}
              </Text>
            )}
          </View>
          {isDone && <CheckCircle2 size={20} color="#34C759" strokeWidth={2} />}
        </View>
      </Pressable>
    </View>
  );
}

// ─── Day pill ─────────────────────────────────────────────────────────────────

function DayPill({
  day,
  isActive,
  onPress,
}: {
  day: any;
  isActive: boolean;
  onPress: () => void;
}) {
  const color = day.zone === "alentejo" ? "#2EC4A8" : "#FF6B4A";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.95 : 1 }],
        alignItems: "center",
        gap: 4,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isActive ? color : "rgba(44,44,46,0.8)",
          borderWidth: isActive ? 0 : 1,
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: isActive ? `0 4px 12px ${color}44` : undefined,
        }}
      >
        <Text style={{ color: isActive ? "#FFFFFF" : "#8E8E93", fontSize: 14, fontWeight: "700" }}>
          {day.day_number}
        </Text>
      </View>
      <Text
        style={{
          color: isActive ? color : "#8E8E93",
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {(day.label ?? "").slice(0, 3)}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlanningScreen() {
  const tripId = use$(currentTripId$);
  const user = use$(auth$.user);
  const userId = user?.id;
  const pillsRef = useRef<FlatList>(null);

  const days = (Object.values(use$(days$) ?? {}) as any[])
    .filter((d) => d.trip_id === tripId)
    .sort((a, b) => a.day_number - b.day_number);
  const allActivities = Object.values(use$(activities$) ?? {}) as any[];
  const completions = (Object.values(use$(activityCompletions$) ?? {}) as any[])
    .filter((c) => c.user_id === userId);
  const doneIds = new Set(completions.map((c) => c.activity_id));

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedDayId && days[0]) setSelectedDayId(days[0].id);
  }, [days, selectedDayId]);

  const selectedDay = days.find((d) => d.id === selectedDayId);
  const accentColor = selectedDay?.zone === "alentejo" ? "#2EC4A8" : "#FF6B4A";
  const selectedActivities = allActivities
    .filter((a) => a.day_id === selectedDayId)
    .sort((a, b) => a.position - b.position);
  const nextActivityId = selectedActivities.find((a) => !doneIds.has(a.id))?.id;

  const toggleDone = async (activityId: string) => {
    if (!userId) return;
    const key = `${activityId}_${userId}`;
    if (doneIds.has(activityId)) {
      (activityCompletions$ as any)[key].delete();
      await supabase.from("activity_completions").delete().eq("activity_id", activityId).eq("user_id", userId);
    } else {
      const row = { activity_id: activityId, user_id: userId, completed_at: new Date().toISOString() };
      (activityCompletions$ as any)[key].set(row);
      await supabase.from("activity_completions").insert(row as any);
    }
  };

  const handleDaySelect = (day: any, index: number) => {
    setSelectedDayId(day.id);
    pillsRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F11" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: "#F2F2F7", fontSize: 20, fontWeight: "700", letterSpacing: -0.5 }}>
              Planning
            </Text>
            <View style={{ backgroundColor: accentColor + "22", borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ color: accentColor, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>
                {selectedDay?.date ? new Date(selectedDay.date).toLocaleString("fr-FR", { month: "long", year: "numeric" }) : ""}
              </Text>
            </View>
          </View>

          <FlatList
            ref={pillsRef}
            data={days}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index }) => (
              <DayPill
                day={item}
                isActive={item.id === selectedDayId}
                onPress={() => handleDaySelect(item, index)}
              />
            )}
          />
        </View>

        {selectedDay && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: "#1C1C1E",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: accentColor + "30",
              boxShadow: `0 4px 20px ${accentColor}18`,
            }}
          >
            <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              {selectedDay.label ?? ""}
            </Text>
            <Text style={{ color: "#F2F2F7", fontSize: 18, fontWeight: "700", letterSpacing: -0.4 }}>
              Jour {selectedDay.day_number} — {selectedDay.theme ?? ""}
            </Text>

            <View style={{ marginTop: 10 }}>
              {(() => {
                const total = selectedActivities.length;
                const done = selectedActivities.filter((a) => doneIds.has(a.id)).length;
                const ratio = total > 0 ? done / total : 0;
                return (
                  <>
                    <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${ratio * 100}%`, backgroundColor: accentColor, borderRadius: 2 }} />
                    </View>
                    <Text style={{ color: "#8E8E93", fontSize: 10, marginTop: 5 }}>
                      {done}/{total} activités
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              position: "absolute",
              left: 16 + 70,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          {selectedActivities.map((activity, index) => {
            const isDone = doneIds.has(activity.id);
            const isNext = activity.id === nextActivityId;
            const isLast = index === selectedActivities.length - 1;

            return (
              <ActivityRow
                key={activity.id}
                activity={activity}
                isLast={isLast}
                accentColor={accentColor}
                isDone={isDone}
                isNext={isNext}
                onToggle={() => toggleDone(activity.id)}
              />
            );
          })}
        </ScrollView>

        <FloatingDock />
      </SafeAreaView>
    </View>
  );
}
