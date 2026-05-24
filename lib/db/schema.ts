// lib/db/schema.ts
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']

// Helper : enrichir les rows DB avec _pending_mutation_id + _local_updated_at
export type LocalRow<T> = T & {
  _pending_mutation_id?: string | null
  _local_updated_at?: number
}

export type LocalProfile = LocalRow<Tables['profiles']['Row']>
export type LocalTrip = LocalRow<Tables['trips']['Row']> & {
  // Local-only flag — non synchronisé. True quand l'user a dismissé le panel
  // de suggestions IA pour ce voyage (évite la ré-ouverture auto au mount).
  ai_suggestions_dismissed?: boolean
}
export type LocalTripMember = LocalRow<Tables['trip_members']['Row']>
// LocalDay : étendu avec `note` (souvenir/carnet de bord) — pas encore sur Supabase,
// stocké uniquement côté Dexie pour l'instant. Sera migré quand le mode démo
// sortira et qu'un vrai voyage aura besoin d'écrire des notes synchronisables.
export type LocalDay = LocalRow<Tables['days']['Row']> & {
  note?: string | null
}
export type LocalActivity = LocalRow<Tables['activities']['Row']>
export type LocalActivityCompletion = LocalRow<Tables['activity_completions']['Row']>
// LocalSpot : étendu avec `image_url` (photo du spot). Même statut que note ci-dessus.
export type LocalSpot = LocalRow<Tables['spots']['Row']> & {
  image_url?: string | null
}
export type LocalExpense = LocalRow<Tables['expenses']['Row']>
export type LocalExpenseSplit = LocalRow<Tables['expense_splits']['Row']>
export type LocalChecklistItem = LocalRow<Tables['checklist_items']['Row']>
export type LocalChecklistCompletion = LocalRow<Tables['checklist_completions']['Row']>
export type LocalGuideCard = LocalRow<Tables['guide_cards']['Row']>
export type LocalMessage = LocalRow<Tables['messages']['Row']>

// Sync queue entry
export type SyncQueueOp = 'insert' | 'update' | 'delete'
export type SyncQueueStatus = 'pending' | 'sending' | 'failed'

export interface SyncQueueEntry {
  id: string                  // uuid local
  op: SyncQueueOp
  table: string               // table Postgres cible
  payload: Record<string, unknown>
  row_id: string              // id de la row touchée (temp_id si insert, id réel sinon)
  depends_on?: string[]       // ids d'autres SyncQueueEntry à attendre
  // Pour les tables à PK composée (activity_completions, checklist_completions,
  // expense_splits) : map des colonnes PK → valeur. Si présent, queue.flush
  // l'utilise avec .match() au lieu de .eq('id', row_id).
  composite_keys?: Record<string, string>
  created_at: number
  status: SyncQueueStatus
  attempts: number
  last_error?: string
  // Mapping temp_id → server_id, populé après flush réussi d'un insert
  server_id?: string
}

// Pending uploads (binary blobs pour photos)
export interface PendingUpload {
  id: string                  // uuid local
  trip_id: string
  file: Blob
  filename: string
  status: 'pending' | 'uploading' | 'failed'
  attempts: number
  last_error?: string
  created_at: number
}
