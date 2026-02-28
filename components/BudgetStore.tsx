import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "hotel"
  | "activity"
  | "drink"
  | "shopping"
  | "other";

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  date: string; // ISO string
};

type BudgetState = {
  totalBudget: number;
  expenses: Expense[];
};

type BudgetAction =
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "REMOVE_EXPENSE"; id: string }
  | { type: "LOAD"; payload: BudgetState };

type BudgetContextType = BudgetState & {
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  totalSpent: number;
  remaining: number;
};

const STORAGE_KEY = "mk_trip_budget";
const DEFAULT_BUDGET = 1650;

const initialState: BudgetState = {
  totalBudget: DEFAULT_BUDGET,
  expenses: [],
};

function reducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "ADD_EXPENSE":
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case "REMOVE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed: BudgetState = JSON.parse(raw);
          dispatch({ type: "LOAD", payload: parsed });
        } catch (_) {
          // corrupt data — ignore
        }
      }
    });
  }, []);

  // Persist on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const addExpense = (expense: Omit<Expense, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: "ADD_EXPENSE", payload: { ...expense, id } });
  };

  const removeExpense = (id: string) => {
    dispatch({ type: "REMOVE_EXPENSE", id });
  };

  const totalSpent = useMemo(
    () => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    [state.expenses]
  );

  const remaining = state.totalBudget - totalSpent;

  return (
    <BudgetContext.Provider
      value={{ ...state, addExpense, removeExpense, totalSpent, remaining }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextType {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}
