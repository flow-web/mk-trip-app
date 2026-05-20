import { observable } from "@legendapp/state";
import { customSynced } from "../lib/legend";
import type { Database } from "../lib/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export const expenses$ = observable<Record<string, Expense>>(
  customSynced({
    collection: "expenses",
    actions: ["read", "create", "update", "delete"],
    persist: { name: "expenses" },
  }) as any,
);
