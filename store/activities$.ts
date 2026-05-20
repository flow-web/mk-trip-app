import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export const activities$ = observable<Record<string, Activity>>(
  customSynced({
    collection: "activities",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "activities" },
  }) as any,
);
