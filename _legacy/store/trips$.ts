import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

export const trips$ = observable<Record<string, Trip>>(
  customSynced({
    collection: "trips",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "trips" },
  }) as any,
);
