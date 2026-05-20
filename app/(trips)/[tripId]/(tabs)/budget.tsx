import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  UtensilsCrossed,
  Car,
  Hotel,
  Ticket,
  Wine,
  ShoppingBag,
  HelpCircle,
  Trash2,
} from "lucide-react-native";
import FloatingDock from "../../../../components/FloatingDock";
import { use$ } from "@legendapp/state/react";
import { expenses$ } from "../../../../store/expenses$";
import { trips$ } from "../../../../store/trips$";
import { currentTripId$ } from "../../../../store/currentTrip$";
import { supabase } from "../../../../lib/supabase";

type ExpenseCategory = "food" | "transport" | "hotel" | "activity" | "drink" | "shopping" | "other";

type Expense = {
  id: string;
  trip_id: string;
  payer_id: string;
  amount: number; // EN CENTIMES dans le store, divisé pour affichage
  category: ExpenseCategory;
  note: string | null;
  spent_at: string;
};

// ─── Category config ──────────────────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  color: string;
};

const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  food:      { label: "Food",      Icon: UtensilsCrossed, color: "#FF6B4A" },
  transport: { label: "Transport", Icon: Car,             color: "#2EC4A8" },
  hotel:     { label: "Hotel",     Icon: Hotel,           color: "#AF52DE" },
  activity:  { label: "Activity",  Icon: Ticket,          color: "#FFD60A" },
  drink:     { label: "Drink",     Icon: Wine,            color: "#FF453A" },
  shopping:  { label: "Shopping",  Icon: ShoppingBag,     color: "#30D158" },
  other:     { label: "Other",     Icon: HelpCircle,      color: "#8E8E93" },
};

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function CircularProgress({
  spent,
  total,
  remaining,
}: {
  spent: number;
  total: number;
  remaining: number;
}) {
  const SIZE = 220;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const ratio = Math.min(spent / total, 1);
  const offset = CIRCUMFERENCE * (1 - ratio);

  const isOver = remaining < 0;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 8 }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#2C2C2E"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={isOver ? "#FF453A" : "#FF6B4A"}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center text */}
      <View
        style={{
          position: "absolute",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: isOver ? "#FF453A" : "#F2F2F7",
            fontSize: 42,
            fontWeight: "700",
            letterSpacing: -2,
          }}
        >
          {Math.abs(remaining).toLocaleString("fr-FR")}€
        </Text>
        <Text
          style={{
            color: "#8E8E93",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {isOver ? "dépassé" : "restant"}
        </Text>
        <Text
          style={{
            color: "#8E8E93",
            fontSize: 11,
            marginTop: 6,
          }}
        >
          {spent.toLocaleString("fr-FR")}€ / {total.toLocaleString("fr-FR")}€
        </Text>
      </View>
    </View>
  );
}

// ─── Category breakdown row ───────────────────────────────────────────────────

function CategoryBreakdown({ expenses, total }: { expenses: Expense[]; total: number }) {
  const cats = Object.entries(CATEGORY_META) as [ExpenseCategory, CategoryMeta][];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#1C1C1E",
        borderRadius: 24,
        marginHorizontal: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {cats.map(([key, { Icon, color }]) => {
        const catSpent = expenses
          .filter((e) => e.category === key)
          .reduce((s, e) => s + Number(e.amount) / 100, 0);
        const ratio = total > 0 ? Math.min(catSpent / total, 1) : 0;

        return (
          <View key={key} style={{ alignItems: "center", flex: 1 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: catSpent > 0 ? `${color}22` : "#2C2C2E",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
              }}
            >
              <Icon size={16} color={catSpent > 0 ? color : "#8E8E93"} strokeWidth={1.5} />
            </View>
            {/* Mini progress bar */}
            <View
              style={{
                width: 24,
                height: 3,
                borderRadius: 2,
                backgroundColor: "#2C2C2E",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${ratio * 100}%`,
                  height: "100%",
                  backgroundColor: color,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[expense.category];
  const { Icon, color } = meta;

  const handleDelete = () => {
    Alert.alert(
      "Supprimer",
      `Supprimer cette dépense de ${(Number(expense.amount) / 100).toLocaleString("fr-FR")}€ ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const date = new Date(expense.spent_at);
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.04)",
      }}
    >
      {/* Category icon bubble */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          backgroundColor: `${color}22`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Icon size={18} color={color} strokeWidth={1.5} />
      </View>

      {/* Label + time */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#F2F2F7", fontSize: 15, fontWeight: "500" }}>
          {expense.note || meta.label}
        </Text>
        <Text style={{ color: "#8E8E93", fontSize: 12, marginTop: 2 }}>
          {timeStr}
        </Text>
      </View>

      {/* Amount */}
      <Text
        style={{
          color: "#FF6B4A",
          fontSize: 16,
          fontWeight: "600",
          marginRight: 12,
        }}
      >
        -{(Number(expense.amount) / 100).toLocaleString("fr-FR")}€
      </Text>

      {/* Delete */}
      <Pressable
        onPress={handleDelete}
        className="active:scale-95"
        style={{
          padding: 6,
          borderRadius: 8,
          backgroundColor: "rgba(255,69,58,0.12)",
        }}
      >
        <Trash2 size={15} color="#FF453A" strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Budget() {
  const tripId = use$(currentTripId$);
  const trip = use$((trips$ as any)[tripId ?? "_"]);
  const totalBudget = Number(trip?.total_budget ?? 0);
  const allExpenses = (Object.values(use$(expenses$) ?? {}) as any[])
    .filter((e) => e.trip_id === tripId)
    .sort((a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime());
  const totalSpentCents = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalSpent = totalSpentCents / 100;
  const remaining = totalBudget - totalSpent;

  const removeExpense = async (id: string) => {
    (expenses$ as any)[id].delete();
    await supabase.from("expenses").delete().eq("id", id);
  };

  const expenses = allExpenses as Expense[];

  return (
    <View className="flex-1 bg-bg-dark">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <Text
              style={{
                color: "#F2F2F7",
                fontSize: 20,
                fontWeight: "600",
                letterSpacing: -0.5,
              }}
            >
              Budget
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255,107,74,0.15)",
                borderRadius: 50,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: "#FF6B4A",
                  fontSize: 11,
                  fontWeight: "700",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {trip?.destination ?? "Voyage"}
              </Text>
            </View>
          </View>

          {/* Circular progress */}
          <CircularProgress
            spent={totalSpent}
            total={totalBudget}
            remaining={remaining}
          />

          {/* Category breakdown */}
          <CategoryBreakdown expenses={expenses} total={totalSpent} />

          {/* Recent expenses */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 20,
              backgroundColor: "#1C1C1E",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Text
                style={{
                  color: "#8E8E93",
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Dépenses
              </Text>
            </View>

            {expenses.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ color: "#8E8E93", fontSize: 14 }}>
                  Aucune dépense
                </Text>
              </View>
            ) : (
              expenses.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onDelete={() => removeExpense(expense.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        <FloatingDock />
      </SafeAreaView>
    </View>
  );
}
