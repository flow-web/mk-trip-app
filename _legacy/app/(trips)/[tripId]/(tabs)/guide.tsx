import { AlertTriangle, Bell, Car, Luggage, Phone, Sun, UtensilsCrossed, Wine } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { use$ } from "@legendapp/state/react";
import { isEnabled as notifIsEnabled, setEnabled as notifSetEnabled } from "../../../../components/NotificationService";
import FloatingDock from "../../../../components/FloatingDock";
import { checklistItems$ } from "../../../../store/checklistItems$";
import { checklistCompletions$ } from "../../../../store/checklistCompletions$";
import { guideCards$ } from "../../../../store/guideCards$";
import { currentTripId$ } from "../../../../store/currentTrip$";
import { auth$ } from "../../../../store/auth$";
import { supabase } from "../../../../lib/supabase";

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle, Wine, Car, Sun, UtensilsCrossed, Phone, Luggage, Bell,
};

const KIND_COLOR: Record<string, string> = {
  danger: "#FF453A",
  warning: "#FFD60A",
  info: "#2EC4A8",
  weather: "#5AC8FA",
  food: "#FF6B4A",
  emergency: "#8E8E93",
};

export default function GuideScreen() {
  const tripId = use$(currentTripId$);
  const user = use$(auth$.user);
  const userId = user?.id;
  const [notifsOn, setNotifsOn] = useState(false);

  useEffect(() => { notifIsEnabled().then(setNotifsOn); }, []);
  const toggleNotifs = useCallback(async () => {
    const next = !notifsOn;
    const ok = await notifSetEnabled(next);
    if (ok) setNotifsOn(next);
  }, [notifsOn]);

  const items = (Object.values(use$(checklistItems$) ?? {}) as any[])
    .filter((i) => i.trip_id === tripId)
    .sort((a, b) => a.position - b.position);
  const completions = (Object.values(use$(checklistCompletions$) ?? {}) as any[])
    .filter((c) => c.user_id === userId);
  const completedItems = new Set(completions.map((c) => c.item_id));
  const cards = (Object.values(use$(guideCards$) ?? {}) as any[])
    .filter((c) => c.trip_id === tripId)
    .sort((a, b) => a.position - b.position);

  const toggleItem = useCallback(async (itemId: string) => {
    if (!userId) return;
    const key = `${itemId}_${userId}`;
    if (completedItems.has(itemId)) {
      (checklistCompletions$ as any)[key].delete();
      await supabase.from("checklist_completions").delete().eq("item_id", itemId).eq("user_id", userId);
    } else {
      const row = { item_id: itemId, user_id: userId, completed_at: new Date().toISOString() };
      (checklistCompletions$ as any)[key].set(row);
      await supabase.from("checklist_completions").insert(row as any);
    }
  }, [userId, completedItems]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Guide Pratique</Text>

        <Pressable onPress={toggleNotifs} style={[styles.card, { borderColor: notifsOn ? "rgba(52,199,89,0.35)" : "rgba(255,255,255,0.06)" }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: notifsOn ? "rgba(52,199,89,0.15)" : "rgba(142,142,147,0.15)" }]}>
              <Bell size={20} color={notifsOn ? "#34C759" : "#8E8E93"} />
            </View>
            <Text style={styles.cardTitle}>Rappels</Text>
            <View style={[styles.togglePill, notifsOn ? styles.toggleOn : styles.toggleOff]}>
              <View style={[styles.toggleDot, { alignSelf: notifsOn ? "flex-end" : "flex-start" }]} />
            </View>
          </View>
          <Text style={styles.cardText}>Notification chaque matin à 8h avec le programme du jour.</Text>
        </Pressable>

        {cards.map((card) => {
          const Icon = ICON_MAP[card.icon_name ?? ""] ?? AlertTriangle;
          const color = KIND_COLOR[card.kind] ?? "#8E8E93";
          return (
            <View key={card.id} style={[styles.card, card.kind === "danger" && { borderColor: "rgba(255,69,58,0.35)" }, card.kind === "warning" && { borderColor: "rgba(255,214,10,0.25)" }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBubble, { backgroundColor: color + "1A" }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardText}>{card.body}</Text>
            </View>
          );
        })}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#FF6B4A1A" }]}>
              <Luggage size={20} color="#FF6B4A" />
            </View>
            <Text style={styles.cardTitle}>Valise</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{completions.length}/{items.length}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${items.length ? (completions.length / items.length) * 100 : 0}%` }]} />
          </View>
          <View style={styles.checklistItems}>
            {items.map((item) => {
              const checked = completedItems.has(item.id);
              return (
                <Pressable key={item.id} style={({ pressed }) => [styles.checklistRow, pressed && styles.checklistRowPressed]} onPress={() => toggleItem(item.id)}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checklistLabel, checked && styles.checklistLabelChecked]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <FloatingDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F11" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 12 },
  header: { fontSize: 28, fontWeight: "700", color: "#F2F2F7", marginBottom: 4 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#F2F2F7", flex: 1 },
  cardText: { fontSize: 14, lineHeight: 20, color: "#8E8E93" },
  progressBadge: { backgroundColor: "rgba(255,107,74,0.15)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  progressText: { fontSize: 12, fontWeight: "600", color: "#FF6B4A" },
  progressBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: 4, backgroundColor: "#FF6B4A", borderRadius: 2 },
  checklistItems: { gap: 4 },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  checklistRowPressed: { backgroundColor: "rgba(255,255,255,0.04)" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#FF6B4A", borderColor: "#FF6B4A" },
  checkmark: { fontSize: 13, color: "#FFFFFF", fontWeight: "700", lineHeight: 16 },
  checklistLabel: { fontSize: 14, color: "#F2F2F7", flex: 1, lineHeight: 20 },
  checklistLabelChecked: { color: "#8E8E93", textDecorationLine: "line-through" },
  togglePill: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: "#34C759" },
  toggleOff: { backgroundColor: "#3A3A3C" },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
});
