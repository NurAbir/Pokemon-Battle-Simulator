# Pokemon Battle Simulator - AI Agent Onboarding

## Project Overview
Real-time multiplayer Pokémon battle simulator with team building, ELO rankings, and turn-based combat mechanics. Built with Node.js/Express backend and React frontend using WebSockets for live battles.

## Tech Stack
**Backend:** Node.js, Express 5.2.1, MongoDB/Mongoose, Socket.IO, JWT auth, bcryptjs  
**Frontend:** React 19.2.1, Axios, Socket.IO-Client, CSS/Tailwind  
**Database:** MongoDB (14 models: User, Team, Battle, Pokemon, Move, Ability, Item, Statistics, etc.)

## Directory Structure
```
server/
  ├── models/          # Mongoose schemas (User, Team, Battle, Pokemon, Move, Ability, Item, etc.)
  ├── routes/          # API endpoints (auth, teams, battles, user)
  ├── controllers/     # Business logic for routes
  ├── utils/           # battleEngine.js, battleCalculator.js
  ├── sockets/         # battleHandler.js (matchmaking, real-time events)
  ├── middleware/      # auth.js (JWT verification), upload.js
  ├── config/          # database.js
  └── scripts/         # populatePokemon.js, populateMoves.js, etc.

client/
  ├── src/components/  # Battle.jsx, Dashboard.jsx, TeamBuilder.jsx, Login.jsx, etc.
  ├── src/services/    # api.js (REST calls), socketService.js
  └── src/styles/      # Component CSS
```

## Core Systems

### 1. Battle System
**Flow:** Matchmaking queue → Battle room creation → Turn resolution → Battle completion  
**Key Files:** [server/utils/battleEngine.js](server/utils/battleEngine.js), [server/utils/battleCalculator.js](server/utils/battleCalculator.js)

**Turn Resolution:**
- Priority (moves at priority +6 first, switches at +6)
- Speed stat as tiebreaker
- Random tiebreaker on equal speed
- Damage calculation: `(level * 2/5 + 2) * power * (attacker_stat/defender_stat) / 50 + 2` × STAB × type_effectiveness × random(0.85–1.0) × status_modifiers

**Key Mechanics:**
- 4-move limit per Pokémon
- 6 Pokémon per team (5 bench)
- Stat stages: -6 to +6 (multiply by 0.25–4x)
- STAB: 1.5x same-type bonus
- Critical hit: 1/24 base (1.5x damage)
- Type effectiveness: 18 types with 2x/0.5x/0x matchups

### 2. Team Builder
**Models:** Team (collection), TeamPokemon (embedded)  
**Customization per Pokémon:**
- Nickname, level, gender, nature (±10% stat modifier)
- Ability, held item
- 4 moves, EVs, IVs
- Stats auto-calculated from nature, level, base stats

### 3. Authentication
**Flow:** Signup/Login → JWT token → Protected routes via [server/middleware/auth.js](server/middleware/auth.js)  
**Password:** bcryptjs (10 salt rounds), stored hashed  
**Token:** Authorization header: `Authorization: Bearer <jwt_token>`

### 4. Real-Time Multiplayer (WebSockets)
**Socket.IO Namespace:** Per-battle rooms  
**Key Events:**

| Event | Source | Purpose |
|-------|--------|---------|
| `addToQueue` | Client | Join matchmaking |
| `removeFromQueue` | Client | Leave matchmaking |
| `battleStart` | Server | 2 players matched, battle begins |
| `submitMove` | Client | Select move/switch Pokémon |
| `battleUpdate` | Server | Turn resolved, send new state |
| `battleEnd` | Server | Winner announced |
| `playerReady` | Both | Handshake for turn sync |
| `battleError` | Server | Error event |

**Matchmaking:** Queue maintained in [server/sockets/battleHandler.js](server/sockets/battleHandler.js), creates isolated Socket.IO room per battle.

## Key Database Models

| Model | Purpose |
|-------|---------|
| **User** | userId, email, password (hashed), avatar, ELO rating, isOnline, isBanned |
| **Team** | userId ref, name, 6-Pokémon array |
| **Battle** | 2 players, status, winner, turn counter, battle logs |
| **BattlePokemon** | Runtime state: current HP, status, stat stages, move selection, faint flag |
| **Pokemon** | Species data: name, types, base stats (HP, Atk, Def, SpA, SpD, Spe) |
| **Move** | Power, accuracy, category (physical/special/status), type, priority |
| **Ability** | Name, description, effect |
| **Item** | Name, description, effect |
| **Statistics** | User battle history, win/loss, performance metrics |

## API Endpoints

| Route | Method | Endpoint | Auth Required |
|-------|--------|----------|---|
| **Auth** | POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password` | No |
| **User** | GET/PUT | `/api/user/profile`, `/api/user/stats` | Yes |
| **Teams** | GET/POST/PUT/DELETE | `/api/teams`, `/api/teams/:id` | Yes |
| **Battles** | GET/POST | `/api/battles/my-battles`, `/api/battles/:id`, `/api/battles/:id/action`, `/api/battles/:id/forfeit` | Yes |
| **Health** | GET | `/api/health` | No |

**Base URL:** `http://localhost:5000/api` (dev)

## Environment Variables
```
DATABASE_URL=mongodb://...
JWT_SECRET=<secret_key>
NODE_ENV=development
PORT=5000
```

## Quick Start (Development)

**Backend:**
```bash
cd server
npm install
npm start          # Runs on port 5000
```

**Frontend:**
```bash
cd client
npm install
npm start          # Runs on port 3000
```

**Populate Database:**
```bash
cd server
node scripts/populatePokemon.js
node scripts/populateMoves.js
node scripts/populateAbilities.js
node scripts/populateItems.js
```

## Common Tasks for AI Agents

### Add New Move/Ability/Item
Edit seed scripts in `server/scripts/` and run them, or add directly to MongoDB.

### Understand Battle Resolution
1. Read [server/utils/battleEngine.js](server/utils/battleEngine.js) — orchestrates turn execution
2. Read [server/utils/battleCalculator.js](server/utils/battleCalculator.js) — damage math and type effectiveness
3. Trace flow: Battle model → engine.resolveTurn() → emit battleUpdate via Socket.IO

### Add API Endpoint
1. Create controller in [server/controllers/](server/controllers/)
2. Add route in [server/routes/](server/routes/)
3. Import and use router in [server/server.js](server/server.js)
4. Add JWT middleware if protected

### Modify Frontend Component
1. Components in [client/src/components/](client/src/components/)
2. API calls via [client/src/services/api.js](client/src/services/api.js)
3. WebSocket events via [client/src/services/socketService.js](client/src/services/socketService.js)

### Debug Battle Logic
- Check [server/models/Battle.js](server/models/Battle.js) and [server/models/BattleLog.js](server/models/BattleLog.js) for structure
- Inspect battle logs in Database for turn history
- Use `console.log` in [server/utils/battleCalculator.js](server/utils/battleCalculator.js) for damage calculations

## Key Entry Points
- **Server Entry:** [server/server.js](server/server.js)
- **Battle Controller:** [server/controllers/battleController.js](server/controllers/battleController.js)
- **Battle Routes:** [server/routes/battleRoutes.js](server/routes/battleRoutes.js)
- **Socket Handler:** [server/sockets/battleHandler.js](server/sockets/battleHandler.js)
- **Frontend Battle UI:** [client/src/components/Battle.jsx](client/src/components/Battle.jsx)
- **Frontend Team Builder:** [client/src/components/TeamBuilder.jsx](client/src/components/TeamBuilder.jsx)

---
**Last Updated:** December 2025
