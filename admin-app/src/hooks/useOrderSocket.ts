import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socketClient';

/**
 * Hook for Order WebSocket Events
 * Handles real-time order updates in admin app
 */
export const useOrderSocket = () => {
  const socket = getSocket();
  const listenersRef = useRef<string[]>([]);

  // Join order room
  const joinOrder = useCallback((orderId: string) => {
    if (!socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join order:', orderId);
      return;
    }
    socket.emit('order:join', orderId);
    console.log('🔌 Joined order room:', orderId);
  }, [socket]);

  // Leave order room
  const leaveOrder = useCallback((orderId: string) => {
    if (!socket?.connected) return;
    socket.emit('order:leave', orderId);
    console.log('🔌 Left order room:', orderId);
  }, [socket]);

  // Join table room (for all orders of a table)
  const joinTable = useCallback((tableId: string) => {
    if (!socket?.connected) return;
    socket.emit('order:join_table', tableId);
    console.log('🔌 Joined table room:', tableId);
  }, [socket]);

  // Leave table room
  const leaveTable = useCallback((tableId: string) => {
    if (!socket?.connected) return;
    socket.emit('order:leave_table', tableId);
  }, [socket]);

  // Event listeners
  const onOrderCreated = useCallback((callback: (order: any) => void) => {
    if (!socket) return;
    socket.on('order:created', callback);
    listenersRef.current.push('order:created');
  }, [socket]);

  const onOrderUpdated = useCallback((callback: (data: { order: any; changes?: any }) => void) => {
    if (!socket) return;
    socket.on('order:updated', callback);
    listenersRef.current.push('order:updated');
  }, [socket]);

  const onOrderStatusChanged = useCallback((callback: (data: { orderId: string; status: string; previousStatus: string }) => void) => {
    if (!socket) return;
    socket.on('order:status_changed', callback);
    listenersRef.current.push('order:status_changed');
  }, [socket]);

  const onOrderItemStatusChanged = useCallback((callback: (data: { orderId: string; itemId: string; status: string }) => void) => {
    if (!socket) return;
    socket.on('order:item_status_changed', callback);
    listenersRef.current.push('order:item_status_changed');
  }, [socket]);

  const onOrderPaid = useCallback((callback: (data: { orderId: string; payment: any }) => void) => {
    if (!socket) return;
    socket.on('order:paid', callback);
    listenersRef.current.push('order:paid');
  }, [socket]);

  const onOrderCancelled = useCallback((callback: (data: { orderId: string; reason?: string }) => void) => {
    if (!socket) return;
    socket.on('order:cancelled', callback);
    listenersRef.current.push('order:cancelled');
  }, [socket]);

  const onOrderNoteAdded = useCallback((callback: (data: { orderId: string; note: any }) => void) => {
    if (!socket) return;
    socket.on('order:note_added', callback);
    listenersRef.current.push('order:note_added');
  }, [socket]);

  const onSupportRequested = useCallback((callback: (data: { orderId: string; customer_id: string; message?: string }) => void) => {
    if (!socket) return;
    socket.on('order:support_requested', callback);
    listenersRef.current.push('order:support_requested');
  }, [socket]);

  const onVoucherApplied = useCallback((callback: (data: { orderId: string; voucher: any; discount: number }) => void) => {
    if (!socket) return;
    socket.on('order:voucher_applied', callback);
    listenersRef.current.push('order:voucher_applied');
  }, [socket]);

  const onVoucherRemoved = useCallback((callback: (data: { orderId: string; voucherCode: string }) => void) => {
    if (!socket) return;
    socket.on('order:voucher_removed', callback);
    listenersRef.current.push('order:voucher_removed');
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        // Remove all registered listeners
        listenersRef.current.forEach(event => {
          socket.off(event);
        });
        listenersRef.current = [];
        console.log('🔌 Cleaned up order socket listeners');
      }
    };
  }, [socket]);

  return {
    // Room management
    joinOrder,
    leaveOrder,
    joinTable,
    leaveTable,
    
    // Event listeners
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onOrderItemStatusChanged,
    onOrderPaid,
    onOrderCancelled,
    onOrderNoteAdded,
    onSupportRequested,
    onVoucherApplied,
    onVoucherRemoved,
    
    // Connection status
    isConnected: socket?.connected || false,
  };
};
