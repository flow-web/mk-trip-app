// lib/stores/syncStatus.ts
import { create } from 'zustand'

interface SyncStatusState {
  online: boolean
  queueLength: number
  failedCount: number
  lastSyncAt: number | null
  setOnline: (v: boolean) => void
  setQueueLength: (n: number) => void
  setFailedCount: (n: number) => void
  setLastSyncAt: (ts: number) => void
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  queueLength: 0,
  failedCount: 0,
  lastSyncAt: null,
  setOnline: (v) => set({ online: v }),
  setQueueLength: (n) => set({ queueLength: n }),
  setFailedCount: (n) => set({ failedCount: n }),
  setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
}))
