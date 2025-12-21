// client/src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(username, token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token,
        username
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Matchmaking
  joinMatchmaking(userId, teamId, username) {
    this.socket.emit('joinMatchmaking', { userId, teamId, username });
  }

  leaveMatchmaking(userId) {
    this.socket.emit('leaveMatchmaking', { userId });
  }

  // Battle actions
  selectMove(battleId, userId, moveName) {
    this.socket.emit('selectMove', { battleId, userId, moveName });
  }

  switchPokemon(battleId, userId, pokemonIndex) {
    this.socket.emit('switchPokemon', { battleId, userId, pokemonIndex });
  }

  forfeit(battleId, userId) {
    this.socket.emit('forfeit', { battleId, userId });
  }

  // Battle log methods
  rejoinBattle(battleId, userId, lastLogTimestamp = null) {
    if (this.socket) {
      this.socket.emit('rejoinBattle', { battleId, userId, lastLogTimestamp });
    }
  }

  // Notification methods
  joinNotificationRoom(userId) {
    if (this.socket) {
      this.socket.emit('joinNotificationRoom', { userId });
    }
  }

  leaveNotificationRoom(userId) {
    if (this.socket) {
      this.socket.emit('leaveNotificationRoom', { userId });
    }
  }

  // Chat methods
  joinChatRoom(roomId, userId) {
    if (this.socket) {
      this.socket.emit('joinChatRoom', { roomId, userId });
    }
  }

  leaveChatRoom(roomId) {
    if (this.socket) {
      this.socket.emit('leaveChatRoom', { roomId });
    }
  }

  sendMessage(roomId, userId, content) {
    if (this.socket) {
      this.socket.emit('sendMessage', { roomId, userId, content });
    }
  }

  startTyping(roomId, userId, username) {
    if (this.socket) {
      this.socket.emit('startTyping', { roomId, userId, username });
    }
  }

  stopTyping(roomId, userId) {
    if (this.socket) {
      this.socket.emit('stopTyping', { roomId, userId });
    }
  }

  markMessagesRead(roomId, userId) {
    if (this.socket) {
      this.socket.emit('markMessagesRead', { roomId, userId });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();