import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Reservation } from "@/services/reservationService";

interface ReservationListStore {
  // State
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  detailError: string | null;

  // Actions
  setReservations: (reservations: Reservation[]) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingDetail: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDetailError: (error: string | null) => void;

  // Update reservation in list
  updateReservationInList: (
    reservationId: string,
    updates: Partial<Reservation>
  ) => void;

  // Update selected reservation
  updateSelectedReservation: (updates: Partial<Reservation>) => void;

  // Add new reservation
  addReservation: (reservation: Reservation) => void;

  // Remove reservation
  removeReservation: (reservationId: string) => void;

  // Update pre-order items
  updatePreOrderItems: (
    reservationId: string,
    items: Reservation["pre_order_items"]
  ) => void;
}

export const useReservationListStore = create<ReservationListStore>()(
  persist(
    (set) => ({
      // Initial state
      reservations: [],
      selectedReservation: null,
      isLoading: false,
      isLoadingDetail: false,
      error: null,
      detailError: null,

      // Basic setters
      setReservations: (reservations) => set({ reservations }),
      setSelectedReservation: (reservation) =>
        set({ selectedReservation: reservation }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingDetail: (loading) => set({ isLoadingDetail: loading }),
      setError: (error) => set({ error }),
      setDetailError: (error) => set({ detailError: error }),

      // Update reservation in list
      updateReservationInList: (reservationId, updates) =>
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === reservationId
              ? { ...reservation, ...updates }
              : reservation
          ),
          // Also update selected reservation if it's the same
          selectedReservation:
            state.selectedReservation?.id === reservationId
              ? { ...state.selectedReservation, ...updates }
              : state.selectedReservation,
        })),

      // Update selected reservation
      updateSelectedReservation: (updates) =>
        set((state) => ({
          selectedReservation: state.selectedReservation
            ? { ...state.selectedReservation, ...updates }
            : null,
          // Also update in list
          reservations: state.selectedReservation
            ? state.reservations.map((reservation) =>
                reservation.id === state.selectedReservation!.id
                  ? { ...reservation, ...updates }
                  : reservation
              )
            : state.reservations,
        })),

      // Add new reservation
      addReservation: (reservation) =>
        set((state) => {
          // Check if reservation already exists
          const exists = state.reservations.find(
            (r) => r.id === reservation.id
          );
          if (exists) {
            return {
              reservations: state.reservations.map((r) =>
                r.id === reservation.id ? reservation : r
              ),
            };
          }
          return {
            reservations: [reservation, ...state.reservations],
          };
        }),

      // Remove reservation
      removeReservation: (reservationId) =>
        set((state) => ({
          reservations: state.reservations.filter(
            (reservation) => reservation.id !== reservationId
          ),
          selectedReservation:
            state.selectedReservation?.id === reservationId
              ? null
              : state.selectedReservation,
        })),

      // Update pre-order items
      updatePreOrderItems: (reservationId, items) =>
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === reservationId
              ? { ...reservation, pre_order_items: items }
              : reservation
          ),
          selectedReservation:
            state.selectedReservation?.id === reservationId
              ? {
                  ...state.selectedReservation,
                  pre_order_items: items,
                }
              : state.selectedReservation,
        })),
    }),
    {
      name: "reservation-list-store",
      partialize: (state) => ({
        reservations: state.reservations,
        selectedReservation: state.selectedReservation,
      }),
    }
  )
);
