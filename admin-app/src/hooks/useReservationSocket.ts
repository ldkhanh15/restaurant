import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socketClient';

/**
 * Hook for Reservation WebSocket Events
 * Handles real-time reservation updates in admin app
 */
export const useReservationSocket = () => {
  const socket = getSocket();
  const listenersRef = useRef<string[]>([]);

  // Join reservation room
  const joinReservation = useCallback((reservationId: string) => {
    if (!socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join reservation:', reservationId);
      return;
    }
    socket.emit('reservation:join', reservationId);
    console.log('🔌 Joined reservation room:', reservationId);
  }, [socket]);

  // Leave reservation room
  const leaveReservation = useCallback((reservationId: string) => {
    if (!socket?.connected) return;
    socket.emit('reservation:leave', reservationId);
    console.log('🔌 Left reservation room:', reservationId);
  }, [socket]);

  // Join table room
  const joinTable = useCallback((tableId: string) => {
    if (!socket?.connected) return;
    socket.emit('reservation:join_table', tableId);
    console.log('🔌 Joined reservation table room:', tableId);
  }, [socket]);

  // Join table group room
  const joinTableGroup = useCallback((tableGroupId: string) => {
    if (!socket?.connected) return;
    socket.emit('reservation:join_table_group', tableGroupId);
    console.log('🔌 Joined table group room:', tableGroupId);
  }, [socket]);

  // Event listeners
  const onReservationCreated = useCallback((callback: (reservation: any) => void) => {
    if (!socket) return;
    socket.on('reservation:created', callback);
    listenersRef.current.push('reservation:created');
  }, [socket]);

  const onReservationUpdated = useCallback((callback: (data: { reservation: any; changes?: any }) => void) => {
    if (!socket) return;
    socket.on('reservation:updated', callback);
    listenersRef.current.push('reservation:updated');
  }, [socket]);

  const onReservationConfirmed = useCallback((callback: (data: { reservationId: string; confirmedAt: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:confirmed', callback);
    listenersRef.current.push('reservation:confirmed');
  }, [socket]);

  const onReservationCancelled = useCallback((callback: (data: { reservationId: string; reason?: string; cancelledBy: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:cancelled', callback);
    listenersRef.current.push('reservation:cancelled');
  }, [socket]);

  const onReservationCompleted = useCallback((callback: (data: { reservationId: string; completedAt: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:completed', callback);
    listenersRef.current.push('reservation:completed');
  }, [socket]);

  const onReservationNoShow = useCallback((callback: (data: { reservationId: string; markedBy: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:no_show', callback);
    listenersRef.current.push('reservation:no_show');
  }, [socket]);

  const onTableAssigned = useCallback((callback: (data: { reservationId: string; tableId: string; tableName: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:table_assigned', callback);
    listenersRef.current.push('reservation:table_assigned');
  }, [socket]);

  const onTableStatusChanged = useCallback((callback: (data: { tableId: string; status: string; reservationId?: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:table_status_changed', callback);
    listenersRef.current.push('reservation:table_status_changed');
  }, [socket]);

  const onReminderSent = useCallback((callback: (data: { reservationId: string; type: string; sentAt: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:reminder_sent', callback);
    listenersRef.current.push('reservation:reminder_sent');
  }, [socket]);

  const onCustomerArrived = useCallback((callback: (data: { reservationId: string; arrivedAt: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:customer_arrived', callback);
    listenersRef.current.push('reservation:customer_arrived');
  }, [socket]);

  const onDepositPaid = useCallback((callback: (data: { reservationId: string; amount: number; method: string }) => void) => {
    if (!socket) return;
    socket.on('reservation:deposit_paid', callback);
    listenersRef.current.push('reservation:deposit_paid');
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        listenersRef.current.forEach(event => {
          socket.off(event);
        });
        listenersRef.current = [];
        console.log('🔌 Cleaned up reservation socket listeners');
      }
    };
  }, [socket]);

  return {
    // Room management
    joinReservation,
    leaveReservation,
    joinTable,
    joinTableGroup,
    
    // Event listeners
    onReservationCreated,
    onReservationUpdated,
    onReservationConfirmed,
    onReservationCancelled,
    onReservationCompleted,
    onReservationNoShow,
    onTableAssigned,
    onTableStatusChanged,
    onReminderSent,
    onCustomerArrived,
    onDepositPaid,
    
    // Connection status
    isConnected: socket?.connected || false,
  };
};
