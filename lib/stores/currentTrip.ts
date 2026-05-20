import { create } from 'zustand'

interface State {
  tripId: string | null
  setTripId: (id: string | null) => void
}

export const useCurrentTripId = create<State>((set) => ({
  tripId: null,
  setTripId: (id) => set({ tripId: id }),
}))
