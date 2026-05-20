import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

export const spots$ = observable<Record<string, Spot>>(
  customSynced({
    collection: "spots",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "spots" },
  }) as any,
);
