import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import {
  UtensilsCrossed,
  Landmark,
  Wine,
  Trees,
  Hotel,
  Zap,
  CheckCircle2,
} from "lucide-react-native";
import { TRIP_DAYS, TripDay, PlannedActivity } from "../../../../components/PlanningData";
import { usePlanning } from "../../../../components/PlanningStore";
import { SpotCategory } from "../../../../components/MapData";
import FloatingDock from "../../../../components/FloatingDock";

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY: Record<SpotCategory, { color: string; Icon: React.ComponentType<any> }> = {
  food:          { color: "#FF6B4A", Icon: UtensilsCrossed },
  culture:       { color: "#AF52DE", Icon: Landmark },
  nightlife:     { color: "#FF453A", Icon: Wine },
  nature:        { color: "#34C759", Icon: Trees },
  accommodation: { color: "#2EC4A8", Icon: Hotel },
  activity:      { color: "#FFD60A", Icon: Zap },
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
  activity: PlannedActivity;
  isLast: boolean;
  accentColor: string;
  isDone: boolean;
  onToggle: () => void;
  isNext: boolean;
}) {
  const cat = CATEGORY[activity.category];
  const { Icon } = cat;
  const catColor = cat.color;

  return (
    <View style={{ flexDirection: "row", minHeight: 80, paddingBottom: isLast ? 0 : 4 }}>
      {/* ── Left timeline column ──────────────────────────────── */}
      <View style={{ width: 72, alignItems: "center", position: "relative" }}>
        {/* time label */}
        <Text
          style={{
            color: isDone ? "#8E8E93" : "#F2F2F7",
            fontSize: 11,
            fontWeight: "600",
            marginTop: 18,
            letterSpacing: 0.2,
          }}
        >
          {activity.time}
        </Text>

        {/* dot on the line */}
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

        {/* vertical line below dot (not rendered for last item) */}
        {!isLast && (
          <View
            style={{
              position: "absolute",
              right: 2,
              top: 30,
              bottom: 0,
              width: 2,
              // solid for done, dashed visual via repeating segments
              backgroundColor: isDone ? "#3A3A3C" : "transparent",
              borderRightWidth: isDone ? 0 : 2,
              borderStyle: isDone ? "solid" : "dashed",
              borderColor: isDone ? "transparent" : "rgba(255,255,255,0.15)",
            }}
          />
        )}
      </View>

      {/* spacer between timeline and card */}
      <View style={{ width: 12 }} />

      {/* ── Activity card ─────────────────────────────────────── */}
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
            borderColor: isNext
              ? accentColor + "55"
              : isDone
              ? "rgba(255,255,255,0.04)"
              : "rgba(255,255,255,0.07)",
            opacity: isDone ? 0.5 : 1,
            // glow for next activity
            ...(isNext && {
              boxShadow: `0 0 12px ${accentColor}33`,
            }),
          }}
        >
          {/* icon bubble */}
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

          {/* text */}
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
              <Text
                style={{
                  color: "#8E8E93",
                  fontSize: 12,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {activity.subtitle}
              </Text>
            )}
          </View>

          {/* done checkmark */}
          {isDone && (
            <CheckCircle2 size={20} color="#34C759" strokeWidth={2} />
          )}
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
  day: TripDay;
  isActive: boolean;
  onPress: () => void;
}) {
  const color = day.zone === "lisboa" ? "#FF6B4A" : "#2EC4A8";

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
        <Text
          style={{
            color: isActive ? "#FFFFFF" : "#8E8E93",
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          {day.dayNumber}
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
        {day.label.slice(0, 3)}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlanningScreen() {
  const [selectedDayId, setSelectedDayId] = useState(TRIP_DAYS[0].id);
  const { doneIds, toggleDone } = usePlanning();
  const pillsRef = useRef<FlatList>(null);

  const selectedDay = TRIP_DAYS.find((d) => d.id === selectedDayId)!;
  const accentColor = selectedDay.zone === "lisboa" ? "#FF6B4A" : "#2EC4A8";

  // first activity not yet done = "next"
  const nextActivityId = selectedDay.activities.find(
    (a) => !doneIds.has(a.id)
  )?.id;

  const handleDaySelect = (day: TripDay, index: number) => {
    setSelectedDayId(day.id);
    pillsRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F11" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text
              style={{
                color: "#F2F2F7",
                fontSize: 20,
                fontWeight: "700",
                letterSpacing: -0.5,
              }}
            >
              Planning
            </Text>
            <View
              style={{
                backgroundColor: accentColor + "22",
                borderRadius: 50,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: accentColor,
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Avril 2026
              </Text>
            </View>
          </View>

          {/* ── Day pills ────────────────────────────────────── */}
          <FlatList
            ref={pillsRef}
            data={TRIP_DAYS}
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

        {/* ── Hero label ─────────────────────────────────────── */}
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
          <Text
            style={{
              color: "#8E8E93",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {selectedDay.label} · {selectedDay.date.split("-").slice(1).join("/")}
          </Text>
          <Text
            style={{
              color: "#F2F2F7",
              fontSize: 18,
              fontWeight: "700",
              letterSpacing: -0.4,
            }}
          >
            Jour {selectedDay.dayNumber} — {selectedDay.theme}
          </Text>

          {/* progress bar */}
          <View style={{ marginTop: 10 }}>
            {(() => {
              const total = selectedDay.activities.length;
              const done = selectedDay.activities.filter((a) => doneIds.has(a.id)).length;
              const ratio = total > 0 ? done / total : 0;
              return (
                <>
                  <View
                    style={{
                      height: 3,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${ratio * 100}%`,
                        backgroundColor: accentColor,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: "#8E8E93",
                      fontSize: 10,
                      marginTop: 5,
                    }}
                  >
                    {done}/{total} activités
                  </Text>
                </>
              );
            })()}
          </View>
        </View>

        {/* ── Timeline ───────────────────────────────────────── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Vertical line background */}
          <View
            style={{
              position: "absolute",
              left: 16 + 70, // paddingLeft + timeline column width - line offset
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          {selectedDay.activities.map((activity, index) => {
            const isDone = doneIds.has(activity.id);
            const isNext = activity.id === nextActivityId;
            const isLast = index === selectedDay.activities.length - 1;

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
