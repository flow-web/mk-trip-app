import { configureSynced } from "@legendapp/state/sync";
import { syncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import { observablePersistSqlite } from "@legendapp/state/persist-plugins/expo-sqlite";
import Storage from "expo-sqlite/kv-store";
import { supabase } from "./supabase";

export const customSynced = configureSynced(syncedSupabase, {
  supabase,
  changesSince: "last-sync",
  fieldCreatedAt: "created_at",
  fieldUpdatedAt: "updated_at",
  persist: {
    plugin: observablePersistSqlite(Storage),
  },
  realtime: { schema: "public" },
});
