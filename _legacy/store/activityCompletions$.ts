import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Completion = Database["public"]["Tables"]["activity_completions"]["Row"];

export const activityCompletions$ = observable<Record<string, Completion>>(
  customSynced({
    collection: "activity_completions",
    actions: ["read", "create", "delete"],
    persist: { name: "activity_completions" },
  }) as any,
);
