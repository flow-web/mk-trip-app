import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Item = Database["public"]["Tables"]["checklist_items"]["Row"];

export const checklistItems$ = observable<Record<string, Item>>(
  customSynced({
    collection: "checklist_items",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "checklist_items" },
  }) as any,
);
