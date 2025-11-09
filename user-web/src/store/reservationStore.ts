import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ReservationDraft {
  // Step 1: Customer Info
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  num_people: number;
  duration_minutes: number;
  special_requests: string;

  // Step 2: Time Selection
  date: Date | null;
  time: string;

  // Step 3: Table Selection
  selected_table_id: string | null;
  selected_table_name: string | null;
  selected_floor: string | null;

  // Step 4: Event Selection (optional)
  event_id: string | null;
  event_type: string | null; // Keep for backward compatibility
  event_details: string | null;
  selected_services: string[];

  // Step 5: Pre-order Dishes (optional)
  pre_orders: Array<{
    dish_id: string;
    dish_name: string;
    quantity: number;
    price: number;
    customizations?: Record<string, any>;
  }>;

  // Step 6: Payment
  deposit_amount: number;
  payment_method: string | null;
  voucher_code: string | null;
  voucher_discount: number;
}

interface ReservationStore {
  draft: ReservationDraft;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateDraft: (updates: Partial<ReservationDraft>) => void;
  resetDraft: () => void;
  isVIP: boolean; // For skipping deposit
  setIsVIP: (isVIP: boolean) => void;
}

const initialDraft: ReservationDraft = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  num_people: 2,
  duration_minutes: 90,
  special_requests: "",
  date: null,
  time: "",
  selected_table_id: null,
  selected_table_name: null,
  selected_floor: null,
  event_id: null,
  event_type: null,
  event_details: null,
  selected_services: [],
  pre_orders: [],
  deposit_amount: 0,
  payment_method: null,
  voucher_code: null,
  voucher_discount: 0,
};

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set) => ({
      draft: initialDraft,
      currentStep: 1,
      isVIP: false,
      setCurrentStep: (step) => set({ currentStep: step }),
      updateDraft: (updates) =>
        set((state) => ({
          draft: { ...state.draft, ...updates },
        })),
      resetDraft: () => set({ draft: initialDraft, currentStep: 1 }),
      setIsVIP: (isVIP) => set({ isVIP }),
    }),
    {
      name: "reservation-draft",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Convert date string back to Date
          if (parsed.state?.draft?.date) {
            parsed.state.draft.date = new Date(parsed.state.draft.date);
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Date will be serialized to string automatically
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
