import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { use$ } from "@legendapp/state/react";
import CountdownCard from "../../../../components/CountdownCard";
import TimelineScroll from "../../../../components/TimelineScroll";
import FloatingDock from "../../../../components/FloatingDock";
import AnimatedEntry from "../../../../components/AnimatedEntry";
import TripSwitcher from "../../../../components/TripSwitcher";
import { trips$ } from "../../../../store/trips$";
import { days$ } from "../../../../store/days$";
import { expenses$ } from "../../../../store/expenses$";
import { currentTripId$ } from "../../../../store/currentTrip$";

export default function Dashboard() {
  const tripId = use$(currentTripId$);
  const trip = use$((trips$ as any)[tripId ?? "_"]);
  const days = (Object.values(use$(days$) ?? {}) as any[])
    .filter((d) => d.trip_id === tripId)
    .sort((a, b) => a.day_number - b.day_number);

  const allExpenses = (Object.values(use$(expenses$) ?? {}) as any[])
    .filter((e) => e.trip_id === tripId);
  const totalBudget = Number(trip?.total_budget ?? 0);
  const totalSpent = allExpenses.reduce((s, e) => s + Number(e.amount), 0) / 100;
  const remaining = totalBudget - totalSpent;
  const spentRatio = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;

  const month = trip?.start_date
    ? new Date(trip.start_date).toLocaleString("fr-FR", { month: "long" })
    : "";
  const monthCap = month ? month.charAt(0).toUpperCase() + month.slice(1) : "";

  const zoneList = Array.from(new Set(days.map((d) => d.zone).filter(Boolean))) as string[];
  const zonesText = zoneList.map((z) => z.charAt(0).toUpperCase() + z.slice(1)).join(" · ");

  return (
    <View className="flex-1 bg-bg-dark">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <AnimatedEntry delay={0}>
            <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
              <TripSwitcher />
              {monthCap ? (
                <View className="bg-primary/15 rounded-pill px-3 py-1">
                  <Text className="text-primary text-xs font-bold tracking-wider uppercase">
                    {monthCap}
                  </Text>
                </View>
              ) : null}
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <CountdownCard />
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <TimelineScroll />
          </AnimatedEntry>

          <AnimatedEntry delay={300}>
            <View className="flex-row mx-4 mt-5 gap-3">
              <View
                className="flex-1 bg-card-dark rounded-bento p-5"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
              >
                <Text className="text-txt-muted text-[10px] font-bold tracking-widest uppercase mb-2">
                  Budget
                </Text>
                <Text className="text-txt-main text-2xl font-bold" style={{ letterSpacing: -1 }}>
                  {remaining.toLocaleString("fr-FR")}€
                </Text>
                <View className="bg-surface-dark rounded-full h-1.5 mt-3 overflow-hidden">
                  <View
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${spentRatio * 100}%` }}
                  />
                </View>
              </View>
              <View
                className="flex-1 bg-card-dark rounded-bento p-5"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
              >
                <Text className="text-txt-muted text-[10px] font-bold tracking-widest uppercase mb-2">
                  Jours
                </Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-txt-main text-2xl font-bold" style={{ letterSpacing: -1 }}>
                    {days.length || 0}
                  </Text>
                  <Text className="text-txt-muted text-sm">jours</Text>
                </View>
                {days.length > 0 ? (
                  <>
                    <View className="flex-row mt-3 gap-1">
                      {days.map((d, idx) => (
                        <View
                          key={d.id}
                          className="flex-1 h-1.5 rounded-full"
                          style={{
                            backgroundColor: d.zone === "alentejo" ? "#2EC4A8" : "#FF6B4A",
                            opacity: 0.6,
                          }}
                        />
                      ))}
                    </View>
                    {zonesText ? (
                      <Text className="text-[9px] text-txt-muted font-medium mt-1.5">
                        {zonesText}
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </View>
            </View>
          </AnimatedEntry>

          <View style={{ height: 120 }} />
        </ScrollView>

        <FloatingDock />
      </SafeAreaView>
    </View>
  );
}
