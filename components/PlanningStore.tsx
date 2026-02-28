import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "mk_trip_planning";

type PlanningContextType = {
  doneIds: Set<string>;
  toggleDone: (activityId: string) => void;
};

const PlanningContext = createContext<PlanningContextType | null>(null);

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const arr: string[] = JSON.parse(raw);
          setDoneIds(new Set(arr));
        } catch (_) {
          // corrupt — ignore
        }
      }
    });
  }, []);

  const persist = useCallback((next: Set<string>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
  }, []);

  const toggleDone = useCallback(
    (activityId: string) => {
      setDoneIds((prev) => {
        const next = new Set(prev);
        if (next.has(activityId)) {
          next.delete(activityId);
        } else {
          next.add(activityId);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <PlanningContext.Provider value={{ doneIds, toggleDone }}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning(): PlanningContextType {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning must be used inside PlanningProvider");
  return ctx;
}
