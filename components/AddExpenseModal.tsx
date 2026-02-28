import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  UtensilsCrossed,
  Car,
  Hotel,
  Ticket,
  Wine,
  ShoppingBag,
  Delete,
  Check,
  ChevronDown,
} from "lucide-react-native";
import { useBudget, ExpenseCategory } from "./BudgetStore";

type CategoryDef = {
  key: ExpenseCategory;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  color: string;
};

const CATEGORIES: CategoryDef[] = [
  { key: "food",      Icon: UtensilsCrossed, color: "#FF6B4A" },
  { key: "transport", Icon: Car,             color: "#2EC4A8" },
  { key: "hotel",     Icon: Hotel,           color: "#AF52DE" },
  { key: "activity",  Icon: Ticket,          color: "#FFD60A" },
  { key: "drink",     Icon: Wine,            color: "#FF453A" },
  { key: "shopping",  Icon: ShoppingBag,     color: "#30D158" },
];

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","0","⌫","✓"] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddExpenseModal({ visible, onClose }: Props) {
  const { addExpense } = useBudget();
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount]     = useState("0");
  const [note, setNote]         = useState("");
  const [showNote, setShowNote] = useState(false);

  const reset = useCallback(() => {
    setCategory(null);
    setAmount("0");
    setNote("");
    setShowNote(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePad = (key: string) => {
    if (key === "✓") {
      handleConfirm();
      return;
    }
    if (key === "⌫") {
      setAmount((prev) => {
        if (prev.length <= 1) return "0";
        const next = prev.slice(0, -1);
        return next === "" ? "0" : next;
      });
      return;
    }
    // Digit
    setAmount((prev) => {
      if (prev === "0") return key;
      if (prev.length >= 6) return prev; // cap at 6 chars
      return prev + key;
    });
  };

  const handleConfirm = () => {
    const parsed = parseFloat(amount);
    if (!category || !parsed || parsed <= 0) return;
    addExpense({
      amount: parsed,
      category,
      note: note.trim() || undefined,
      date: new Date().toISOString(),
    });
    handleClose();
  };

  const canConfirm = category !== null && parseFloat(amount) > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
        onPress={handleClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
      >
        <View
          style={{
            backgroundColor: "#1C1C1E",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            paddingBottom: Platform.OS === "ios" ? 36 : 20,
            boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Handle + close */}
          <View className="items-center pt-3 pb-2">
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
            />
          </View>

          <Pressable
            onPress={handleClose}
            className="absolute top-4 right-5 active:scale-95"
            style={{ padding: 6 }}
          >
            <ChevronDown size={22} color="#8E8E93" strokeWidth={2} />
          </Pressable>

          {/* Category grid — 2 rows × 3 */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 20,
              gap: 10,
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            {CATEGORIES.map(({ key, Icon, color }) => {
              const active = category === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setCategory(key)}
                  className="active:scale-95"
                  style={{
                    width: "30%",
                    aspectRatio: 1.4,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active
                      ? `${color}33`
                      : "rgba(44,44,46,0.8)",
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? color : "rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon
                    size={24}
                    color={active ? color : "#8E8E93"}
                    strokeWidth={active ? 2 : 1.5}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Amount display */}
          <View className="items-center px-6 mb-4">
            <View className="flex-row items-baseline">
              <Text
                style={{
                  fontSize: 18,
                  color: "#8E8E93",
                  fontWeight: "300",
                  marginRight: 4,
                }}
              >
                €
              </Text>
              <Text
                style={{
                  fontSize: 56,
                  color: canConfirm ? "#F2F2F7" : "#8E8E93",
                  fontWeight: "700",
                  letterSpacing: -2,
                  lineHeight: 64,
                }}
              >
                {amount}
              </Text>
            </View>
          </View>

          {/* Optional note */}
          {showNote ? (
            <View className="mx-5 mb-4">
              <TextInput
                autoFocus
                placeholder="Note (optionnel)"
                placeholderTextColor="#8E8E93"
                value={note}
                onChangeText={setNote}
                maxLength={60}
                style={{
                  backgroundColor: "#2C2C2E",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: "#F2F2F7",
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => setShowNote(true)}
              className="mx-5 mb-4 active:scale-95"
            >
              <Text
                style={{
                  color: "#8E8E93",
                  fontSize: 13,
                  textAlign: "center",
                  textDecorationLine: "underline",
                }}
              >
                + Ajouter une note
              </Text>
            </Pressable>
          )}

          {/* Number pad */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 8,
            }}
          >
            {PAD_KEYS.map((key) => {
              const isConfirm = key === "✓";
              const isBackspace = key === "⌫";

              return (
                <Pressable
                  key={key}
                  onPress={() => handlePad(key)}
                  className="active:scale-95"
                  style={{
                    width: "30%",
                    height: 52,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isConfirm
                      ? canConfirm
                        ? "#FF6B4A"
                        : "rgba(255,107,74,0.25)"
                      : isBackspace
                      ? "rgba(255,255,255,0.05)"
                      : "#2C2C2E",
                  }}
                >
                  {isConfirm ? (
                    <Check size={22} color={canConfirm ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth={2.5} />
                  ) : isBackspace ? (
                    <Delete size={20} color="#8E8E93" strokeWidth={1.5} />
                  ) : (
                    <Text
                      style={{
                        color: "#F2F2F7",
                        fontSize: 20,
                        fontWeight: "500",
                      }}
                    >
                      {key}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
