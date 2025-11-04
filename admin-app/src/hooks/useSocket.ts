import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { 
  initializeSocket, 
  disconnectSocket, 
  getSocket, 
  isSocketConnected 
} from '../utils/socketClient';

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  // Emit events
  emit: (event: string, data?: any) => void;
  // Listen to events
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (connectingRef.current || isConnected) {
      return;
    }

    try {
      connectingRef.current = true;
      setError(null);
      
      console.log('📱 useSocket: Connecting...');
      const newSocket = await initializeSocket();
      
      setSocket(newSocket);
      setIsConnected(newSocket.connected);
      
      // Update connection status
      newSocket.on('connect', () => {
        console.log('📱 useSocket: Connected');
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', () => {
        console.log('📱 useSocket: Disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error('📱 useSocket: Connection error:', err.message);
        setError(err.message);
        setIsConnected(false);
      });
      
    } catch (err: any) {
      console.error('📱 useSocket: Failed to connect:', err);
      setError(err.message || 'Failed to connect');
      setIsConnected(false);
    } finally {
      connectingRef.current = false;
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    console.log('📱 useSocket: Disconnecting...');
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const currentSocket = socket || getSocket();
    if (currentSocket?.connected) {
      currentSocket.emit(event, data);
    } else {
      console.warn('📱 useSocket: Cannot emit, socket not connected');
    }
  }, [socket]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const currentSocket = socket || getSocket();
    if (currentSocket) {
      currentSocket.on(event, callback);
    }
  }, [socket]);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    const currentSocket = socket || getSocket();
    if (currentSocket) {
      if (callback) {
        currentSocket.off(event, callback);
      } else {
        currentSocket.off(event);
      }
    }
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      // Don't disconnect on unmount to keep connection alive
      // disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
