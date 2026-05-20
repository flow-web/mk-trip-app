import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { observablePersistSqlite } from "@legendapp/state/persist-plugins/expo-sqlite";
import Storage from "expo-sqlite/kv-store";

export const currentTripId$ = observable<string | null>(null);

syncObservable(currentTripId$, {
  persist: {
    name: "currentTripId",
    plugin: observablePersistSqlite(Storage),
  },
});
