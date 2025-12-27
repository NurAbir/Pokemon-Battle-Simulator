import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socketService from '../services/socketService';
import {
  getGlobalChat,
  getPrivateChatList,
  getPrivateChat,
  getBattleChat,
  getChatHistory,
  getFriends
} from '../services/api';
import '../styles/ChatBox.css';

const ChatBox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [activeChat, setActiveChat] = useState('global'); // global, private, battle
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [privateChatList, setPrivateChatList] = useState([]);
  const [selectedPrivateChat, setSelectedPrivateChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load global chat
  const loadGlobalChat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getGlobalChat();
      
      if (response.data.success) {
        const { room, messages: msgs } = response.data.data;
        setCurrentRoom(room);
        setMessages(msgs);
        
        // Join socket room
        socketService.joinChatRoom(room.roomId, user.userId);
      }
    } catch (err) {
      setError('Failed to load global chat');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  // Load private chat list
  const loadPrivateChatList = useCallback(async () => {
    try {
      const response = await getPrivateChatList();
      if (response.data.success) {
        setPrivateChatList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load private chats:', err);
    }
  }, []);

  // Load specific private chat
  const loadPrivateChat = useCallback(async (targetUserId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Leave current room
      if (currentRoom) {
        socketService.leaveChatRoom(currentRoom.roomId);
      }
      
      const response = await getPrivateChat(targetUserId);
      
      if (response.data.success) {
        const { room, messages: msgs } = response.data.data;
        setCurrentRoom(room);
        setMessages(msgs);
        setSelectedPrivateChat(room.participant);
        
        socketService.joinChatRoom(room.roomId, user.userId);
      }
    } catch (err) {
      setError('Failed to load chat');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentRoom, user.userId]);

  // Load battle chat
  const loadBattleChat = useCallback(async (battleId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentRoom) {
        socketService.leaveChatRoom(currentRoom.roomId);
      }
      
      const response = await getBattleChat(battleId);
      
      if (response.data.success) {
        const { room, messages: msgs } = response.data.data;
        setCurrentRoom(room);
        setMessages(msgs);
        
        socketService.joinChatRoom(room.roomId, user.userId);
      }
    } catch (err) {
      setError('Battle chat not available');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentRoom, user.userId]);

  // Load friends list for new chat modal
  const loadFriendsList = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await getFriends();
      if (response.data.success) {
        setFriendsList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  // Open new chat modal
  const handleOpenNewChat = () => {
    setShowNewChatModal(true);
    loadFriendsList();
  };

  // Start private chat with selected friend
  const handleStartPrivateChat = (friendUserId) => {
    setShowNewChatModal(false);
    setActiveChat('private');
    loadPrivateChat(friendUserId);
  };

  // Initial load based on navigation state
  useEffect(() => {
    if (location.state?.privateChatWith) {
      setActiveChat('private');
      loadPrivateChat(location.state.privateChatWith);
    } else if (location.state?.battleId) {
      setActiveChat('battle');
      loadBattleChat(location.state.battleId);
    } else {
      loadGlobalChat();
    }
    
    loadPrivateChatList();

    return () => {
      if (currentRoom) {
        socketService.leaveChatRoom(currentRoom.roomId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run only once on mount to handle initial navigation

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleUserTyping = ({ userId, username }) => {
      if (userId !== user.userId) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    const handleChatError = ({ message }) => {
      setError(message);
      setSending(false);
    };

    const handleBattleChatCreated = ({ roomId, battleId }) => {
      // If we're in battle view, auto-switch to battle chat
      if (location.pathname === '/battle') {
        setActiveChat('battle');
        loadBattleChat(battleId);
      }
    };

    const handleBattleChatEnded = () => {
      if (activeChat === 'battle') {
        setActiveChat('global');
        loadGlobalChat();
      }
    };

    socketService.on('newMessage', handleNewMessage);
    socketService.on('userTyping', handleUserTyping);
    socketService.on('userStoppedTyping', handleUserStoppedTyping);
    socketService.on('chatError', handleChatError);
    socketService.on('battleChatCreated', handleBattleChatCreated);
    socketService.on('battleChatEnded', handleBattleChatEnded);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleUserTyping);
      socketService.off('userStoppedTyping', handleUserStoppedTyping);
      socketService.off('chatError', handleChatError);
      socketService.off('battleChatCreated', handleBattleChatCreated);
      socketService.off('battleChatEnded', handleBattleChatEnded);
    };
  }, [activeChat, user.userId, location.pathname, loadBattleChat, loadGlobalChat]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle tab change
  const handleTabChange = (tab) => {
    if (currentRoom) {
      socketService.leaveChatRoom(currentRoom.roomId);
    }
    
    setActiveChat(tab);
    setMessages([]);
    setCurrentRoom(null);
    setSelectedPrivateChat(null);
    setTypingUsers([]);
    
    if (tab === 'global') {
      loadGlobalChat();
    }
  };

  // Handle sending message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentRoom || sending) return;
    
    setSending(true);
    socketService.sendMessage(currentRoom.roomId, user.userId, newMessage.trim());
    setNewMessage('');
    setSending(false);
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.stopTyping(currentRoom.roomId, user.userId);
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!currentRoom) return;
    
    // Send typing indicator
    socketService.startTyping(currentRoom.roomId, user.userId, user.username);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(currentRoom.roomId, user.userId);
    }, 2000);
  };

  // Load more messages
  const handleLoadMore = async () => {
    if (!currentRoom || loadingMore || messages.length === 0) return;
    
    try {
      setLoadingMore(true);
      const oldestMessage = messages[0];
      const response = await getChatHistory(currentRoom.roomId, { 
        limit: 50, 
        before: oldestMessage.createdAt 
      });
      
      if (response.data.success) {
        const olderMessages = response.data.data.messages;
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMoreMessages(response.data.data.hasMore);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Format message time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date separator
  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString();
  };

  // Check if should show date separator
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <h2>Chat</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          Back
        </button>
      </div>

      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeChat === 'global' ? 'active' : ''}`}
          onClick={() => handleTabChange('global')}
        >
          🌍 Global
        </button>
        <button
          className={`chat-tab ${activeChat === 'private' ? 'active' : ''}`}
          onClick={() => handleTabChange('private')}
        >
          💬 Private
        </button>
        {location.state?.battleId && (
          <button
            className={`chat-tab ${activeChat === 'battle' ? 'active' : ''}`}
            onClick={() => handleTabChange('battle')}
          >
            ⚔️ Battle
          </button>
        )}
      </div>

      <div className="chat-container">
        {/* Private chat list sidebar */}
        {activeChat === 'private' && !selectedPrivateChat && (
          <div className="private-chat-list">
            <div className="private-chat-header">
              <h3>Conversations</h3>
              <button className="btn-new-chat" onClick={handleOpenNewChat} title="Start New Chat">
                +
              </button>
            </div>
            {privateChatList.length === 0 ? (
              <div className="no-chats">
                <p>No conversations yet</p>
                <button className="btn-start-chat" onClick={handleOpenNewChat}>
                  Start a Chat
                </button>
              </div>
            ) : (
              privateChatList.map(chat => (
                <div
                  key={chat.roomId}
                  className="private-chat-item"
                  onClick={() => loadPrivateChat(chat.participant.userId)}
                >
                  <img
                    src={chat.participant.avatar || 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif'}
                    alt={chat.participant.username}
                    className="chat-avatar"
                  />
                  <div className="chat-preview">
                    <span className="chat-username">{chat.participant.username}</span>
                    {chat.lastMessage && (
                      <span className="last-message">
                        {chat.lastMessage.content.substring(0, 30)}...
                      </span>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages area */}
        <div className="messages-area">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : error ? (
            <div className="chat-error">{error}</div>
          ) : (
            <>
              {selectedPrivateChat && (
                <div className="chat-partner-header">
                  <button 
                    className="btn-back-list"
                    onClick={() => {
                      setSelectedPrivateChat(null);
                      if (currentRoom) socketService.leaveChatRoom(currentRoom.roomId);
                      setCurrentRoom(null);
                      setMessages([]);
                    }}
                  >
                    ← Back
                  </button>
                  <span>Chat with {selectedPrivateChat.username}</span>
                </div>
              )}
              
              {hasMoreMessages && (
                <button 
                  className="btn-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load older messages'}
                </button>
              )}

              <div className="messages-list">
                {messages.map((msg, index) => (
                  <div key={msg.messageId}>
                    {shouldShowDateSeparator(msg, messages[index - 1]) && (
                      <div className="date-separator">
                        {formatDateSeparator(msg.createdAt)}
                      </div>
                    )}
                    <div
                      className={`message ${msg.senderId === user.userId ? 'own' : ''} ${msg.messageType === 'system' ? 'system' : ''}`}
                    >
                      {msg.messageType !== 'system' && msg.senderId !== user.userId && (
                        <span className="message-sender">{msg.senderUsername}</span>
                      )}
                      <div className="message-content">{msg.content}</div>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Message input */}
      {currentRoom && !loading && (
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTyping}
            maxLength={1000}
            className="message-input"
          />
          <button type="submit" className="btn-send" disabled={!newMessage.trim() || sending}>
            Send
          </button>
        </form>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="new-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start New Chat</h3>
              <button className="btn-close-modal" onClick={() => setShowNewChatModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {loadingFriends ? (
                <div className="modal-loading">Loading friends...</div>
              ) : friendsList.length === 0 ? (
                <div className="modal-empty">
                  <p>You haven't added any friends yet.</p>
                  <button 
                    className="btn-find-friends" 
                    onClick={() => navigate('/friends')}
                  >
                    Find Friends
                  </button>
                </div>
              ) : (
                <div className="friends-select-list">
                  <p className="select-hint">Select a friend to start chatting</p>
                  {friendsList.map(friend => (
                    <div 
                      key={friend.userId} 
                      className="friend-select-item"
                      onClick={() => handleStartPrivateChat(friend.userId)}
                    >
                      <img
                        src={friend.avatar || 'https://hwchamber.co.uk/wp-content/uploads/2022/04/avatar-placeholder.gif'}
                        alt={friend.username}
                        className="friend-select-avatar"
                      />
                      <div className="friend-select-info">
                        <span className="friend-select-name">{friend.username}</span>
                        <span className={`friend-select-status ${friend.isOnline ? 'online' : 'offline'}`}>
                          {friend.isOnline ? '● Online' : '○ Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;