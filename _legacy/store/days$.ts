import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Day = Database["public"]["Tables"]["days"]["Row"];

export const days$ = observable<Record<string, Day>>(
  customSynced({
    collection: "days",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "days" },
  }) as any,
);
