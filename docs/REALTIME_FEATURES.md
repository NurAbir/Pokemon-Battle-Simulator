# Real-Time Features Documentation

## Overview

Three integrated real-time features using Socket.IO:
1. **Notification Board** - Match invites, friend requests, battle results
2. **Chat Box** - Global, private, and battle chats
3. **Battle Log** - Server-authoritative battle event logging

---

## 1. Notification Board

### Notification Types
| Type | Description |
|------|-------------|
| `matchInvite` | Battle invitation to another user |
| `friendRequest` | Friend request to another user |
| `battleResult` | Post-battle summary notification |
| `matchInviteResponse` | Response to a match invite |
| `friendRequestResponse` | Response to a friend request |
| `system` | System-generated messages |

### API Endpoints

```
GET    /api/notifications              # Get user's notifications
GET    /api/notifications/unread-count # Get unread count
POST   /api/notifications/match-invite # Send match invite
POST   /api/notifications/friend-request # Send friend request
PUT    /api/notifications/:id/respond-match  # Accept/deny match
PUT    /api/notifications/:id/respond-friend # Accept/deny friend
PUT    /api/notifications/:id/read     # Mark as read
PUT    /api/notifications/read-all     # Mark all read
```

### Socket Events
| Event | Direction | Data |
|-------|-----------|------|
| `notification:new` | Server→Client | Notification object |
| `notification:read` | Client→Server | notificationId |
| `battle:start` | Server→Client | { battleId, players } |

### Request Examples

**Send Match Invite:**
```json
POST /api/notifications/match-invite
{
  "targetUsername": "PlayerTwo",
  "battleMode": "ranked"
}
```

**Respond to Match Invite:**
```json
PUT /api/notifications/:id/respond-match
{
  "accept": true
}
```

---

## 2. Chat Box

### Chat Types
| Type | Description |
|------|-------------|
| `global` | All authenticated users |
| `private` | One-to-one messaging |
| `battle` | Temporary during battles |

### API Endpoints

```
GET    /api/chat/global               # Get global chat
GET    /api/chat/private              # List private chats
GET    /api/chat/private/:username    # Get/create private chat
GET    /api/chat/battle/:battleId     # Get battle chat
GET    /api/chat/room/:roomId         # Get room history
POST   /api/chat/room/:roomId/message # Send message (HTTP fallback)
```

### Socket Events
| Event | Direction | Data |
|-------|-----------|------|
| `chat:join` | Client→Server | roomId |
| `chat:leave` | Client→Server | roomId |
| `chat:send` | Client→Server | { roomId, content } |
| `chat:message` | Server→Client | Message object |
| `chat:joined` | Server→Client | { roomId } |
| `chat:read` | Client→Server | roomId |

### Message Schema
```json
{
  "messageId": "msg_xxx",
  "roomId": "room_xxx",
  "senderId": "user_xxx",
  "senderUsername": "Player1",
  "content": "Hello!",
  "isSystem": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Battle Chat Lifecycle
1. Battle starts → `createBattleChatRoom(battleId, [player1, player2])`
2. Players join socket room `battle:${battleId}`
3. Battle ends → `archiveBattleChatRoom(battleId)`
4. Room marked inactive, system message sent

---

## 3. Battle Log

### Event Types
| Type | Description |
|------|-------------|
| `MOVE` | Move used by Pokemon |
| `DAMAGE` | Damage dealt |
| `STATUS` | Status effect applied/removed |
| `FAINT` | Pokemon fainted |
| `SWITCH` | Pokemon switched |
| `ABILITY` | Ability activation |
| `ITEM` | Item used |
| `INFO` | General information |
| `SYSTEM` | Turn/battle start/end |
| `WARNING` | Inactivity warning |
| `TIMEOUT` | Player timed out |

### API Endpoints

```
GET    /api/battle-log/:battleId       # Get full log
GET    /api/battle-log/:battleId/after # Get logs after timestamp
```

### Socket Events
| Event | Direction | Data |
|-------|-----------|------|
| `battle:join` | Client→Server | battleId |
| `battle:leave` | Client→Server | battleId |
| `battle:action` | Client→Server | { battleId, action } |
| `battle:log` | Server→Client | Log entry |
| `battle:warning` | Server→Client | Warning entry |
| `battle:end` | Server→Client | Final log entry |
| `battle:log:full` | Server→Client | Full log array (reconnect) |
| `battle:timeout` | Server→Client | { playerId } |

### Log Entry Schema
```json
{
  "logId": "log_xxx",
  "battleId": "battle_xxx",
  "turn": 1,
  "eventType": "MOVE",
  "message": "Pikachu used Thunder!",
  "data": { "pokemonName": "Pikachu", "moveName": "Thunder" },
  "playerId": "user_xxx",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Server-Side Log Generation
```javascript
const battleLogController = require('./controllers/battleLogController');

// Log a move
await battleLogController.logMove(battleId, turn, playerId, 'Pikachu', 'Thunder');

// Log damage
await battleLogController.logDamage(battleId, turn, 'Charizard', 50, 70, 120);

// Log warning (10 seconds remaining)
await battleLogController.logWarning(battleId, turn, playerId, 'Player1', 10);
```

### Inactivity Timer
```javascript
const { startInactivityTimer, clearInactivityTimer } = require('./socket/socketHandler');

// Start timer (60s turn, warning at 10s remaining)
startInactivityTimer(battleId, playerId, playerUsername, turn, 60, 10);

// Clear on action received
clearInactivityTimer(battleId, playerId);
```

---

## Socket Connection

### Client Setup
```javascript
import socketService from './services/socket';

// Connect after login
socketService.connect();

// Listen for events
socketService.on('notification:new', (notification) => {
  // Handle new notification
});

// Disconnect on logout
socketService.disconnect();
```

### Authentication
Socket connections require JWT token:
```javascript
const socket = io(URL, {
  auth: { token: localStorage.getItem('token') }
});
```

---

## Integration with Battle Engine

When battle ends, call:
```javascript
const { sendBattleResults } = require('./utils/notificationHelper');
const { archiveBattleChatRoom } = require('./utils/chatHelper');
const battleLogController = require('./controllers/battleLogController');

// Log battle end
await battleLogController.logBattleEnd(battleId, turn, winnerUsername, loserUsername);

// Send result notifications
await sendBattleResults({ battleId, winnerId, loserId, summary: 'Brief battle summary' });

// Archive battle chat
await archiveBattleChatRoom(battleId);
```

---

## File Structure

```
server/
├── models/
│   ├── Notification.js    # Notification schema
│   ├── ChatRoom.js        # Chat room schema
│   ├── Message.js         # Chat message schema
│   └── BattleLog.js       # Battle log schema
├── controllers/
│   ├── notificationController.js
│   ├── chatController.js
│   └── battleLogController.js
├── routes/
│   ├── notification.js
│   ├── chat.js
│   └── battleLog.js
├── socket/
│   └── socketHandler.js   # Socket.IO initialization
└── utils/
    ├── notificationHelper.js
    └── chatHelper.js

client/src/
├── components/
│   ├── NotificationBoard.jsx
│   ├── ChatBox.jsx
│   └── BattleLogPanel.jsx
├── services/
│   ├── api.js             # REST API calls
│   └── socket.js          # Socket.IO service
└── styles/
    ├── NotificationBoard.css
    ├── ChatBox.css
    └── BattleLogPanel.css
```

---

## Dependencies

**Server (add to package.json):**
```bash
npm install socket.io
```

**Client (add to package.json):**
```bash
npm install socket.io-client
```
