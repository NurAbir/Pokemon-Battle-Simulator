# Social Features Documentation

This document covers three integrated features: **Notification Board**, **Friend Finder**, and **Chat Box**.

## Notification Board

Real-time notification system supporting match invites, friend requests, and battle results.

### Notification Types
- `matchInvite` - Battle invitation (5-minute expiry)
- `friendRequest` - Friend request with accept/deny
- `battleResult` - Post-battle summary
- `friendRequestAccepted/Denied` - Response notifications
- `matchInviteAccepted/Denied` - Response notifications
- `system` - System messages

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications (query: `limit`, `unreadOnly`, `type`) |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| POST | `/api/notifications/match-invite` | Send battle invite |
| POST | `/api/notifications/:id/respond-match` | Accept/deny battle |
| DELETE | `/api/notifications/:id` | Delete notification |

### Socket Events

**Client → Server:**
- `joinNotificationRoom` - Join user's notification room
- `leaveNotificationRoom` - Leave notification room

**Server → Client:**
- `newNotification` - New notification received
- `unreadNotificationCount` - Initial unread count

---

## Friend Finder

User search and friend management system.

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends/search?username=` | Search user (case-insensitive) |
| GET | `/api/friends` | Get friends list |
| GET | `/api/friends/pending` | Get pending requests |
| POST | `/api/friends/request` | Send friend request |
| POST | `/api/friends/respond` | Accept/deny request |
| DELETE | `/api/friends/:userId` | Remove friend |

### Request Payloads

**Send Request:**
```json
{ "username": "TargetUser" }
```

**Respond to Request:**
```json
{ "requestId": "freq_xxx", "action": "accept" }
```

### Socket Events

**Server → Client:**
- `friendAdded` - New friend added
- `friendRemoved` - Friend removed
- `userOnline` - Friend came online
- `userOffline` - Friend went offline

---

## Chat Box

Multi-room chat system with global, private, and battle chats.

### Chat Types
- `global` - All authenticated users
- `private` - One-to-one messaging
- `battle` - Temporary battle chat (auto-archived)

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/global` | Get global chat + history |
| GET | `/api/chat/private` | List private conversations |
| GET | `/api/chat/private/:userId` | Get/create private chat |
| GET | `/api/chat/battle/:battleId` | Get battle chat |
| GET | `/api/chat/history/:roomId` | Paginated history |
| PUT | `/api/chat/:roomId/read` | Mark messages read |

### Socket Events

**Client → Server:**
- `joinChatRoom` - Join a chat room
- `leaveChatRoom` - Leave a chat room
- `sendMessage` - Send message
- `startTyping` / `stopTyping` - Typing indicators
- `markMessagesRead` - Mark messages read

**Server → Client:**
- `newMessage` - Message received
- `userTyping` / `userStoppedTyping` - Typing indicators
- `messagesRead` - Read receipts
- `chatError` - Error notification
- `battleChatCreated` - Battle chat ready
- `battleChatEnded` - Battle chat archived

### Message Format
```json
{
  "messageId": "msg_xxx",
  "roomId": "chat_xxx",
  "senderId": "user_xxx",
  "senderUsername": "Player1",
  "content": "Hello!",
  "messageType": "text",
  "createdAt": "2025-12-21T10:00:00Z"
}
```

---

## Data Models

### Notification
| Field | Type | Description |
|-------|------|-------------|
| notificationId | String | Unique ID |
| recipientId | String | Target user |
| senderId | String | Sender (null for system) |
| type | String | Notification type |
| payload | Object | Type-specific data |
| status | String | pending/accepted/denied/expired |
| isRead | Boolean | Read state |
| expiresAt | Date | Expiration (match invites) |

### FriendRequest
| Field | Type | Description |
|-------|------|-------------|
| requestId | String | Unique ID |
| fromUserId | String | Sender |
| toUserId | String | Recipient |
| status | String | pending/accepted/rejected |

### ChatRoom
| Field | Type | Description |
|-------|------|-------------|
| roomId | String | Unique ID |
| type | String | global/private/battle |
| participants | String[] | User IDs (private/battle) |
| battleId | String | Associated battle |
| isArchived | Boolean | Battle chat archived |

### Message
| Field | Type | Description |
|-------|------|-------------|
| messageId | String | Unique ID |
| roomId | String | Parent room |
| senderId | String | Sender |
| senderUsername | String | Display name |
| content | String | Message text (max 1000) |
| messageType | String | text/system |
| readBy | String[] | Users who read |

---

## Battle Integration

When a battle ends:
1. Both players receive `battleResult` notifications
2. Battle chat is archived with final message
3. Notifications are persisted for offline users

Battle result payload:
```json
{
  "battleId": "battle_xxx",
  "winner": "user_xxx",
  "isWinner": true,
  "opponentUsername": "Player2",
  "summary": "Last 5 battle log entries"
}
```

---

## Security

- All endpoints require JWT authentication
- Users can only access their own notifications
- Friend request responses require recipient authorization
- Chat room access validated per room type
- Rate limiting on chat messages (10/10s)
