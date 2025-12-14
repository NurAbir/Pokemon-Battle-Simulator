import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socket';
import API from '../services/api';
import '../styles/ChatBox.css';

const ChatBox = ({ battleId = null, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(battleId ? 'battle' : 'global');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [privateChats, setPrivateChats] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [dmTarget, setDmTarget] = useState('');
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const currentRoomRef = useRef(null); // Track current room without triggering re-renders
  const shouldScrollRef = useRef(true); // Control when to auto-scroll

  // Auto-scroll to bottom only when appropriate
  const scrollToBottom = useCallback((force = false) => {
    if (shouldScrollRef.current || force) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // Scroll on initial load and when user sends a message
  useEffect(() => {
    if (initialLoadDone && messages.length > 0) {
      scrollToBottom(true);
      setInitialLoadDone(false); // Reset after scrolling
    }
  }, [initialLoadDone, messages.length, scrollToBottom]);

  // Load chat based on active tab
  const loadChat = useCallback(async (tab, targetUsername = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let response;

      if (tab === 'global') {
        response = await API.get('/chat/global', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (tab === 'battle' && battleId) {
        response = await API.get(`/chat/battle/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (tab === 'private' && targetUsername) {
        response = await API.get(`/chat/private/${targetUsername}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response?.data?.success) {
        setMessages(response.data.data.messages || []);
        const room = response.data.data.room;
        setCurrentRoom(room);
        currentRoomRef.current = room;

        // Join socket room
        if (room) {
          socketService.emit('chat:join', room.roomId);
        }
        setInitialLoadDone(true);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  }, [battleId]);

  // Load private chat list
  const loadPrivateChats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('/chat/private', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPrivateChats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load private chats:', error);
    }
  }, []);

  // Initialize chat - only run when isOpen or activeTab changes
  useEffect(() => {
    if (!isOpen) return;

    // Leave previous room if switching
    if (currentRoomRef.current) {
      socketService.emit('chat:leave', currentRoomRef.current.roomId);
      currentRoomRef.current = null;
      setCurrentRoom(null);
    }

    if (activeTab === 'global') {
      loadChat('global');
    } else if (activeTab === 'battle' && battleId) {
      loadChat('battle');
    } else if (activeTab === 'private') {
      loadPrivateChats();
      setLoading(false);
    }

    // Cleanup on unmount or when chat closes
    return () => {
      if (currentRoomRef.current) {
        socketService.emit('chat:leave', currentRoomRef.current.roomId);
      }
    };
  }, [isOpen, activeTab, battleId, loadChat, loadPrivateChats]);

  // Socket message listener
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.roomId === currentRoomRef.current?.roomId) {
        setMessages(prev => [...prev, message]);
        // Auto-scroll for new messages
        shouldScrollRef.current = true;
        setTimeout(() => {
          scrollToBottom();
          shouldScrollRef.current = false;
        }, 50);
      }
    };

    socketService.on('chat:message', handleNewMessage);

    return () => {
      socketService.off('chat:message', handleNewMessage);
    };
  }, []); // Remove currentRoom dependency - use ref instead

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    socketService.emit('chat:send', {
      roomId: currentRoom.roomId,
      content: newMessage.trim()
    });

    setNewMessage('');
    inputRef.current?.focus();
    // Scroll to bottom after sending
    shouldScrollRef.current = true;
  };

  // Start new private chat
  const startPrivateChat = async (e) => {
    e.preventDefault();
    if (!dmTarget.trim()) return;

    setActiveTab('private');
    await loadChat('private', dmTarget.trim());
    setDmTarget('');
  };

  // Switch to existing private chat
  const openPrivateChat = async (username) => {
    await loadChat('private', username);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  if (!isOpen) return null;

  return (
    <div className="chat-box-container">
      <div className="chat-box">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-tabs">
            <button
              className={`tab ${activeTab === 'global' ? 'active' : ''}`}
              onClick={() => setActiveTab('global')}
            >
              🌍 Global
            </button>
            <button
              className={`tab ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              💬 DMs
            </button>
            {battleId && (
              <button
                className={`tab ${activeTab === 'battle' ? 'active' : ''}`}
                onClick={() => setActiveTab('battle')}
              >
                ⚔️ Battle
              </button>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Private chat list */}
        {activeTab === 'private' && !currentRoom && (
          <div className="private-chat-list">
            <form onSubmit={startPrivateChat} className="new-dm-form">
              <input
                type="text"
                placeholder="Start chat with username..."
                value={dmTarget}
                onChange={(e) => setDmTarget(e.target.value)}
              />
              <button type="submit">Chat</button>
            </form>

            <div className="chat-list">
              {privateChats.length === 0 ? (
                <div className="empty">No conversations yet</div>
              ) : (
                privateChats.map((chat) => (
                  <div
                    key={chat.roomId}
                    className="chat-list-item"
                    onClick={() => openPrivateChat(chat.participant?.username)}
                  >
                    <div className="chat-avatar">
                      {chat.participant?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-info">
                      <span className="chat-name">{chat.participant?.username}</span>
                      {chat.lastMessage && (
                        <span className="last-message">{chat.lastMessage.content}</span>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages area */}
        {(activeTab !== 'private' || currentRoom) && (
          <>
            <div className="messages-container">
              {loading ? (
                <div className="loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="empty">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`message ${message.senderId === currentUserId ? 'own' : ''} ${message.isSystem ? 'system' : ''}`}
                  >
                    {!message.isSystem && message.senderId !== currentUserId && (
                      <span className="sender">{message.senderUsername}</span>
                    )}
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="timestamp">{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} className="message-form">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={1000}
                disabled={!currentRoom?.isActive}
              />
              <button type="submit" disabled={!newMessage.trim() || !currentRoom?.isActive}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
