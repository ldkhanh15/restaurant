import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reservation } from '../../data/mockData';

interface ReservationState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
}

const initialState: ReservationState = {
  reservations: [],
  currentReservation: null,
};

const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    setReservations: (state, action: PayloadAction<Reservation[]>) => {
      state.reservations = action.payload;
    },
    addReservation: (state, action: PayloadAction<Reservation>) => {
      state.reservations.push(action.payload);
    },
    setCurrentReservation: (state, action: PayloadAction<Reservation | null>) => {
      state.currentReservation = action.payload;
    },
    updateReservationStatus: (state, action: PayloadAction<{ id: string; status: Reservation['status'] }>) => {
      const reservation = state.reservations.find(res => res.id === action.payload.id);
      if (reservation) {
        reservation.status = action.payload.status;
      }
    },
  },
});

export const { setReservations, addReservation, setCurrentReservation, updateReservationStatus } = reservationSlice.actions;
export default reservationSlice.reducer;