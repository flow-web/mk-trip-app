import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Member = Database["public"]["Tables"]["trip_members"]["Row"];

export const tripMembers$ = observable<Record<string, Member>>(
  customSynced({
    collection: "trip_members",
    actions: ["read"],
    persist: { name: "trip_members" },
  }) as any,
);
