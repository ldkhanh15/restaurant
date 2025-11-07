import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socketClient';

/**
 * Hook for Dish/Menu WebSocket Events
 * Handles real-time dish updates in admin app
 * 
 * NOTE: Backend events not yet implemented
 * This hook is ready for when backend adds dish socket events
 */
export const useDishSocket = () => {
  const socket = getSocket();
  const listenersRef = useRef<string[]>([]);

  // Join dish room (watch specific dish)
  const joinDish = useCallback((dishId: string) => {
    if (!socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join dish:', dishId);
      return;
    }
    socket.emit('dish:join', dishId);
    console.log('🔌 Joined dish room:', dishId);
  }, [socket]);

  // Leave dish room
  const leaveDish = useCallback((dishId: string) => {
    if (!socket?.connected) return;
    socket.emit('dish:leave', dishId);
  }, [socket]);

  // Join category room
  const joinCategory = useCallback((categoryId: string) => {
    if (!socket?.connected) return;
    socket.emit('dish:join_category', categoryId);
    console.log('🔌 Joined category room:', categoryId);
  }, [socket]);

  // Leave category room
  const leaveCategory = useCallback((categoryId: string) => {
    if (!socket?.connected) return;
    socket.emit('dish:leave_category', categoryId);
  }, [socket]);

  // Event listeners (ready for backend implementation)
  const onDishCreated = useCallback((callback: (dish: any) => void) => {
    if (!socket) return;
    socket.on('dish:created', callback);
    listenersRef.current.push('dish:created');
  }, [socket]);

  const onDishUpdated = useCallback((callback: (data: { dish: any; changes?: any }) => void) => {
    if (!socket) return;
    socket.on('dish:updated', callback);
    listenersRef.current.push('dish:updated');
  }, [socket]);

  const onDishDeleted = useCallback((callback: (data: { dishId: string; categoryId?: string }) => void) => {
    if (!socket) return;
    socket.on('dish:deleted', callback);
    listenersRef.current.push('dish:deleted');
  }, [socket]);

  const onDishAvailabilityChanged = useCallback((callback: (data: { dishId: string; isAvailable: boolean; categoryId?: string }) => void) => {
    if (!socket) return;
    socket.on('dish:availability_changed', callback);
    listenersRef.current.push('dish:availability_changed');
  }, [socket]);

  const onDishPriceChanged = useCallback((callback: (data: { dishId: string; oldPrice: number; newPrice: number }) => void) => {
    if (!socket) return;
    socket.on('dish:price_changed', callback);
    listenersRef.current.push('dish:price_changed');
  }, [socket]);

  const onCategoryCreated = useCallback((callback: (category: any) => void) => {
    if (!socket) return;
    socket.on('category:created', callback);
    listenersRef.current.push('category:created');
  }, [socket]);

  const onCategoryUpdated = useCallback((callback: (data: { category: any; changes?: any }) => void) => {
    if (!socket) return;
    socket.on('category:updated', callback);
    listenersRef.current.push('category:updated');
  }, [socket]);

  const onCategoryDeleted = useCallback((callback: (data: { categoryId: string }) => void) => {
    if (!socket) return;
    socket.on('category:deleted', callback);
    listenersRef.current.push('category:deleted');
  }, [socket]);

  const onDishBulkUpdated = useCallback((callback: (data: { dishIds: string[]; updateType: string; data: any }) => void) => {
    if (!socket) return;
    socket.on('dish:bulk_updated', callback);
    listenersRef.current.push('dish:bulk_updated');
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        listenersRef.current.forEach(event => {
          socket.off(event);
        });
        listenersRef.current = [];
        console.log('🔌 Cleaned up dish socket listeners');
      }
    };
  }, [socket]);

  return {
    // Room management
    joinDish,
    leaveDish,
    joinCategory,
    leaveCategory,
    
    // Event listeners
    onDishCreated,
    onDishUpdated,
    onDishDeleted,
    onDishAvailabilityChanged,
    onDishPriceChanged,
    onCategoryCreated,
    onCategoryUpdated,
    onCategoryDeleted,
    onDishBulkUpdated,
    
    // Connection status
    isConnected: socket?.connected || false,
  };
};
