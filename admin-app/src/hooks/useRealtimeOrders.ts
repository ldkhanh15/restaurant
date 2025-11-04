import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export interface OrderUpdate {
  orderId: string;
  status?: string;
  updates?: any;
}

export interface UseRealtimeOrdersReturn {
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
  joinTable: (tableId: string) => void;
  leaveTable: (tableId: string) => void;
  onOrderCreated: (callback: (order: any) => void) => () => void;
  onOrderUpdated: (callback: (order: any) => void) => () => void;
  onOrderStatusChanged: (callback: (update: OrderUpdate) => void) => () => void;
  onPaymentRequested: (callback: (order: any) => void) => () => void;
  onPaymentCompleted: (callback: (order: any) => void) => () => void;
}

export const useRealtimeOrders = (): UseRealtimeOrdersReturn => {
  const { socket, isConnected, emit, on, off } = useSocket();

  // Join order room to receive updates for specific order
  const joinOrder = useCallback((orderId: string) => {
    if (isConnected) {
      console.log('📦 Joining order room:', orderId);
      emit('joinOrder', orderId);
    }
  }, [isConnected, emit]);

  // Leave order room
  const leaveOrder = useCallback((orderId: string) => {
    if (isConnected) {
      console.log('📦 Leaving order room:', orderId);
      emit('leaveOrder', orderId);
    }
  }, [isConnected, emit]);

  // Join table room to receive all orders for a table
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

  // Listen to order created event
  const onOrderCreated = useCallback((callback: (order: any) => void) => {
    console.log('📦 Listening to orderCreated events');
    on('orderCreated', callback);
    
    // Return cleanup function
    return () => {
      off('orderCreated', callback);
    };
  }, [on, off]);

  // Listen to order updated event
  const onOrderUpdated = useCallback((callback: (order: any) => void) => {
    console.log('📦 Listening to orderUpdated events');
    on('orderUpdated', callback);
    
    return () => {
      off('orderUpdated', callback);
    };
  }, [on, off]);

  // Listen to order status changed event
  const onOrderStatusChanged = useCallback((callback: (update: OrderUpdate) => void) => {
    console.log('📦 Listening to orderStatusChanged events');
    on('orderStatusChanged', callback);
    
    return () => {
      off('orderStatusChanged', callback);
    };
  }, [on, off]);

  // Listen to payment requested event
  const onPaymentRequested = useCallback((callback: (order: any) => void) => {
    console.log('💳 Listening to paymentRequested events');
    on('paymentRequested', callback);
    
    return () => {
      off('paymentRequested', callback);
    };
  }, [on, off]);

  // Listen to payment completed event
  const onPaymentCompleted = useCallback((callback: (order: any) => void) => {
    console.log('💳 Listening to paymentCompleted events');
    on('paymentCompleted', callback);
    
    return () => {
      off('paymentCompleted', callback);
    };
  }, [on, off]);

  return {
    joinOrder,
    leaveOrder,
    joinTable,
    leaveTable,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusChanged,
    onPaymentRequested,
    onPaymentCompleted,
  };
};
