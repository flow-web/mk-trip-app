import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Card = Database["public"]["Tables"]["guide_cards"]["Row"];

export const guideCards$ = observable<Record<string, Card>>(
  customSynced({
    collection: "guide_cards",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "guide_cards" },
  }) as any,
);
