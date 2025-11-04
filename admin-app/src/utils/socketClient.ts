import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './authUtils';
import { API_CONFIG } from '../config/appConfig';

// Socket.IO client instance
let socket: Socket | null = null;

// Get Socket.IO base URL (without /api path)
const getSocketURL = (): string => {
  return `http://${API_CONFIG.HOST}:${API_CONFIG.PORT}`;
};

/**
 * Initialize Socket.IO connection
 */
export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    console.log('🔌 Socket already connected');
    return socket;
  }

  try {
    const token = await getAuthToken();
    const socketURL = getSocketURL();
    
    console.log('🔌 Initializing socket connection...');
    console.log('🔌 Socket URL:', socketURL);

    socket = io(socketURL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('❌ Socket reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });

    return socket;
  } catch (error) {
    console.error('❌ Failed to initialize socket:', error);
    throw error;
  }
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

/**
 * Reconnect socket
 */
export const reconnectSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }
  
  if (socket) {
    socket.connect();
    return socket;
  }
  
  return initializeSocket();
};
