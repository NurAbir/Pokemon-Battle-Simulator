import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to socket server with auth token
   */
  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No auth token found, cannot connect to socket');
      return;
    }

    if (this.socket?.connected) {
      return; // Already connected
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  /**
   * Listen for an event from the server
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Join a chat room
   */
  joinChatRoom(roomId) {
    this.emit('chat:join', roomId);
  }

  /**
   * Leave a chat room
   */
  leaveChatRoom(roomId) {
    this.emit('chat:leave', roomId);
  }

  /**
   * Send a chat message
   */
  sendChatMessage(roomId, content) {
    this.emit('chat:send', { roomId, content });
  }

  /**
   * Mark messages as read
   */
  markChatRead(roomId) {
    this.emit('chat:read', roomId);
  }

  /**
   * Join a battle room
   */
  joinBattleRoom(battleId) {
    this.emit('battle:join', battleId);
  }

  /**
   * Leave a battle room
   */
  leaveBattleRoom(battleId) {
    this.emit('battle:leave', battleId);
  }

  /**
   * Submit a battle action
   */
  submitBattleAction(battleId, action) {
    this.emit('battle:action', { battleId, action });
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId) {
    this.emit('notification:read', notificationId);
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
