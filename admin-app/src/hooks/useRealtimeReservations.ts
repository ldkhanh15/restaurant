import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface ReservationUpdate {
  reservationId: string;
  status?: string;
  updates?: any;
}

export interface UseRealtimeReservationsReturn {
  joinReservation: (reservationId: string) => void;
  leaveReservation: (reservationId: string) => void;
  joinTable: (tableId: string) => void;
  leaveTable: (tableId: string) => void;
  onReservationCreated: (callback: (reservation: any) => void) => () => void;
  onReservationUpdated: (callback: (reservation: any) => void) => () => void;
  onReservationCancelled: (callback: (reservation: any) => void) => () => void;
  onTableStatusChanged: (callback: (data: any) => void) => () => void;
  onReservationStatusChanged: (callback: (data: { reservationId: string; status: string }) => void) => () => void;
}

export const useRealtimeReservations = (): UseRealtimeReservationsReturn => {
  const { socket, isConnected, emit, on, off } = useSocket();

  // Join reservation room to receive updates for specific reservation
  const joinReservation = useCallback((reservationId: string) => {
    if (isConnected) {
      console.log('📅 Joining reservation room:', reservationId);
      emit('joinReservation', reservationId);
    }
  }, [isConnected, emit]);

  // Leave reservation room
  const leaveReservation = useCallback((reservationId: string) => {
    if (isConnected) {
      console.log('📅 Leaving reservation room:', reservationId);
      emit('leaveReservation', reservationId);
    }
  }, [isConnected, emit]);

  // Join table room to receive reservation updates for a table
  const joinTable = useCallback((tableId: string) => {
    if (isConnected) {
      console.log('🪑 Joining table room:', tableId);
      emit('joinTable', tableId);
    }
  }, [isConnected, emit]);

  // Leave table room
  const leaveTable = useCallback((tableId: string) => {
    if (isConnected) {
      console.log('🪑 Leaving table room:', tableId);
      emit('leaveTable', tableId);
    }
  }, [isConnected, emit]);

  // Listen to reservation created event
  const onReservationCreated = useCallback((callback: (reservation: any) => void) => {
    console.log('📅 Listening to reservationCreated events');
    on('reservationCreated', callback);
    
    // Return cleanup function
    return () => {
      off('reservationCreated', callback);
    };
  }, [on, off]);

  // Listen to reservation updated event
  const onReservationUpdated = useCallback((callback: (reservation: any) => void) => {
    console.log('📅 Listening to reservationUpdated events');
    on('reservationUpdated', callback);
    
    return () => {
      off('reservationUpdated', callback);
    };
  }, [on, off]);

  // Listen to reservation cancelled event
  const onReservationCancelled = useCallback((callback: (reservation: any) => void) => {
    console.log('📅 Listening to reservationCancelled events');
    on('reservationCancelled', callback);
    
    return () => {
      off('reservationCancelled', callback);
    };
  }, [on, off]);

  // Listen to table status changed event
  const onTableStatusChanged = useCallback((callback: (data: any) => void) => {
    console.log('🪑 Listening to tableStatusChanged events');
    on('tableStatusChanged', callback);
    
    return () => {
      off('tableStatusChanged', callback);
    };
  }, [on, off]);

  // Listen to reservation status changed event
  const onReservationStatusChanged = useCallback((callback: (data: { reservationId: string; status: string }) => void) => {
    console.log('📅 Listening to reservationStatusChanged events');
    on('reservationStatusChanged', callback);
    
    return () => {
      off('reservationStatusChanged', callback);
    };
  }, [on, off]);

  return {
    joinReservation,
    leaveReservation,
    joinTable,
    leaveTable,
    onReservationCreated,
    onReservationUpdated,
    onReservationCancelled,
    onTableStatusChanged,
    onReservationStatusChanged,
  };
};
