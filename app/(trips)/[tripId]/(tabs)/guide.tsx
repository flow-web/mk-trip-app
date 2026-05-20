import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AlertTriangle,
  Bell,
  Car,
  Luggage,
  Phone,
  Sun,
  UtensilsCrossed,
  Wine,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  isEnabled as notifIsEnabled,
  setEnabled as notifSetEnabled,
} from "../../../../components/NotificationService";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FloatingDock from "../../../../components/FloatingDock";

const CHECKLIST_KEY = "mk_trip_checklist";

const CHECKLIST_ITEMS = [
  "Coupe-vent",
  "Lunettes de soleil",
  "Crème solaire",
  "Bonnes baskets (pavés glissants!)",
  "Pull pour le soir",
  "Maillot de bain",
  "Adaptateur prise (pas nécessaire, même prises)",
];

export default function GuideScreen() {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [notifsOn, setNotifsOn] = useState(false);

  useEffect(() => {
    notifIsEnabled().then(setNotifsOn);
  }, []);

  const toggleNotifs = useCallback(async () => {
    const next = !notifsOn;
    const ok = await notifSetEnabled(next);
    if (ok) setNotifsOn(next);
  }, [notifsOn]);

  useEffect(() => {
    AsyncStorage.getItem(CHECKLIST_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed: number[] = JSON.parse(raw);
          setCheckedItems(new Set(parsed));
        } catch {
          // ignore corrupt data
        }
      }
    });
  }, []);

  const toggleItem = useCallback(
    async (index: number) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify([...next]));
        return next;
      });
    },
    []
  );

  const checkedCount = checkedItems.size;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Guide Pratique</Text>

        {/* NOTIFICATIONS TOGGLE */}
        <Pressable
          onPress={toggleNotifs}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: notifsOn
                ? "rgba(52,199,89,0.35)"
                : "rgba(255,255,255,0.06)",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: notifsOn
                    ? "rgba(52,199,89,0.15)"
                    : "rgba(142,142,147,0.15)",
                },
              ]}
            >
              <Bell size={20} color={notifsOn ? "#34C759" : "#8E8E93"} />
            </View>
            <Text style={styles.cardTitle}>Rappels</Text>
            <View
              style={[
                styles.togglePill,
                notifsOn ? styles.toggleOn : styles.toggleOff,
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  { alignSelf: notifsOn ? "flex-end" : "flex-start" },
                ]}
              />
            </View>
          </View>
          <Text style={styles.cardText}>
            Notification chaque matin à 8h avec le programme du jour.
          </Text>
        </Pressable>

        {/* WARNING — Cannabis */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#FF453A1A" }]}>
              <AlertTriangle size={20} color="#FF453A" />
            </View>
            <Text style={styles.cardTitle}>Cannabis</Text>
          </View>
          <Text style={styles.cardText}>
            Décriminalisé mais{" "}
            <Text style={styles.dangerText}>PAS légal à acheter</Text>. Arnaque
            vendeurs Baixa/Rossio (laurier/bouillon cube).
          </Text>
        </View>

        {/* ALCOOL */}
        <View style={[styles.card, styles.warningCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#FFD60A1A" }]}>
              <Wine size={20} color="#FFD60A" />
            </View>
            <Text style={styles.cardTitle}>Alcool</Text>
          </View>
          <Text style={styles.cardText}>
            Alcool pas cher. On boit dans la rue à Bairro Alto — c'est normal.
            Bières ~1.50€ en terrasse.
          </Text>
        </View>

        {/* TRANSPORT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#2EC4A81A" }]}>
              <Car size={20} color="#2EC4A8" />
            </View>
            <Text style={styles.cardTitle}>Transport</Text>
          </View>
          <View style={styles.tipList}>
            <TipRow accent="#2EC4A8" text="Uber/Bolt très pas cher (~5€ traverser Lisbonne)" />
            <TipRow accent="#2EC4A8" text="Viva Viagem card pour metro/tram/bus" />
            <TipRow accent="#2EC4A8" text="Location voiture à l'aéroport pour Alentejo" />
          </View>
        </View>

        {/* MÉTÉO AVRIL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#5AC8FA1A" }]}>
              <Sun size={20} color="#5AC8FA" />
            </View>
            <Text style={styles.cardTitle}>Météo Avril</Text>
          </View>
          <Text style={styles.cardText}>
            15–22°C, pluie possible, vent constant sur la côte.
          </Text>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherStat}>🌡 15-22°C</Text>
            <View style={styles.weatherDivider} />
            <Text style={styles.weatherStat}>🌧 6j pluie</Text>
            <View style={styles.weatherDivider} />
            <Text style={styles.weatherStat}>💨 Vent côte</Text>
          </View>
        </View>

        {/* VALISE CHECKLIST */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#FF6B4A1A" }]}>
              <Luggage size={20} color="#FF6B4A" />
            </View>
            <View style={styles.checklistTitleRow}>
              <Text style={styles.cardTitle}>Valise</Text>
              <View style={styles.progressBadge}>
                <Text style={styles.progressText}>
                  {checkedCount}/{CHECKLIST_ITEMS.length}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.checklistItems}>
            {CHECKLIST_ITEMS.map((item, index) => {
              const checked = checkedItems.has(index);
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.checklistRow,
                    pressed && styles.checklistRowPressed,
                  ]}
                  onPress={() => toggleItem(index)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked,
                    ]}
                  >
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.checklistLabel,
                      checked && styles.checklistLabelChecked,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* MANGER LOCAL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#FF6B4A1A" }]}>
              <UtensilsCrossed size={20} color="#FF6B4A" />
            </View>
            <Text style={styles.cardTitle}>Manger Local</Text>
          </View>
          <View style={styles.tipList}>
            <TipRow accent="#FF6B4A" text="Bifana > sandwich classique" />
            <TipRow accent="#FF6B4A" text="Pastéis de nata à Belém" />
            <TipRow accent="#FF6B4A" text="Percebes (pouce-pieds) = délicieux" />
            <TipRow accent="#FF6B4A" text="Menu du jour (prato do dia) ~8-12€" />
          </View>
        </View>

        {/* URGENCES */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBubble, { backgroundColor: "#8E8E931A" }]}>
              <Phone size={20} color="#8E8E93" />
            </View>
            <Text style={styles.cardTitle}>Urgences</Text>
          </View>
          <View style={styles.emergencyList}>
            <EmergencyRow label="112" desc="Urgences" />
            <EmergencyRow label="217 654 242" desc="PSP Police" />
            <EmergencyRow label="213 939 100" desc="Ambassade France" />
          </View>
        </View>
      </ScrollView>

      <FloatingDock />
    </SafeAreaView>
  );
}

function TipRow({ accent, text }: { accent: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={[styles.tipDot, { backgroundColor: accent }]} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function EmergencyRow({ label, desc }: { label: string; desc: string }) {
  return (
    <View style={styles.emergencyRow}>
      <Text style={styles.emergencyLabel}>{label}</Text>
      <Text style={styles.emergencyDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F0F11",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 12,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F2F2F7",
    marginBottom: 4,
  },

  // Cards
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    gap: 10,
  },
  dangerCard: {
    borderColor: "rgba(255,69,58,0.35)",
  },
  warningCard: {
    borderColor: "rgba(255,214,10,0.25)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#F2F2F7",
    flex: 1,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  dangerText: {
    color: "#FF453A",
    fontWeight: "600",
  },

  // Tips
  tipList: {
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
    flex: 1,
  },

  // Weather
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(90,200,250,0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  weatherStat: {
    fontSize: 13,
    color: "#F2F2F7",
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  weatherDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  // Checklist
  checklistTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBadge: {
    backgroundColor: "rgba(255,107,74,0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B4A",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#FF6B4A",
    borderRadius: 2,
  },
  checklistItems: {
    gap: 4,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  checklistRowPressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#FF6B4A",
    borderColor: "#FF6B4A",
  },
  checkmark: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
    lineHeight: 16,
  },
  checklistLabel: {
    fontSize: 14,
    color: "#F2F2F7",
    flex: 1,
    lineHeight: 20,
  },
  checklistLabelChecked: {
    color: "#8E8E93",
    textDecorationLine: "line-through",
  },

  // Emergency
  emergencyList: {
    gap: 8,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
  },
  emergencyLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F2F2F7",
    fontVariant: ["tabular-nums"],
  },
  emergencyDesc: {
    fontSize: 13,
    color: "#8E8E93",
  },

  // Toggle
  togglePill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: "#34C759",
  },
  toggleOff: {
    backgroundColor: "#3A3A3C",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
});
