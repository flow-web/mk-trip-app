import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CountdownCard from "../../components/CountdownCard";
import TimelineScroll from "../../components/TimelineScroll";
import FloatingDock from "../../components/FloatingDock";
import { useBudget } from "../../components/BudgetStore";
import AnimatedEntry from "../../components/AnimatedEntry";

export default function Dashboard() {
  const { totalBudget, totalSpent, remaining } = useBudget();
  const spentRatio = Math.min(totalSpent / totalBudget, 1);

  return (
    <View className="flex-1 bg-bg-dark">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header — minimal */}
          <AnimatedEntry delay={0}>
            <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
              <Text
                className="text-txt-main text-xl font-semibold"
                style={{ letterSpacing: -0.5 }}
              >
                MK Trip
              </Text>
              <View className="bg-primary/15 rounded-pill px-3 py-1">
                <Text className="text-primary text-xs font-bold tracking-wider uppercase">
                  Avril
                </Text>
              </View>
            </View>
          </AnimatedEntry>

          {/* Hero — Countdown + Weather */}
          <AnimatedEntry delay={100}>
            <CountdownCard />
          </AnimatedEntry>

          {/* Timeline */}
          <AnimatedEntry delay={200}>
            <TimelineScroll />
          </AnimatedEntry>

          {/* Quick Stats row */}
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
                  8
                </Text>
                <Text className="text-txt-muted text-sm">jours</Text>
              </View>
              <View className="flex-row mt-3 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <View
                    key={d}
                    className="flex-1 h-1.5 rounded-full"
                    style={{
                      backgroundColor: d <= 4 ? "#FF6B4A" : "#2EC4A8",
                      opacity: 0.6,
                    }}
                  />
                ))}
              </View>
              <View className="flex-row justify-between mt-1.5">
                <Text className="text-[9px] text-primary font-medium">Lisboa</Text>
                <Text className="text-[9px] text-secondary font-medium">Alentejo</Text>
              </View>
            </View>
          </View>
          </AnimatedEntry>

          {/* Spacer for dock */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Dock */}
        <FloatingDock />
      </SafeAreaView>
    </View>
  );
}
