import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Split = Database["public"]["Tables"]["expense_splits"]["Row"];

export const expenseSplits$ = observable<Record<string, Split>>(
  customSynced({
    collection: "expense_splits",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "expense_splits" },
  }) as any,
);
