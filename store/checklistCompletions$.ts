import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Completion = Database["public"]["Tables"]["checklist_completions"]["Row"];

export const checklistCompletions$ = observable<Record<string, Completion>>(
  customSynced({
    collection: "checklist_completions",
    actions: ["read", "create", "delete"],
    persist: { name: "checklist_completions" },
  }) as any,
);
