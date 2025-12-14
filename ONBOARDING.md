# Pokémon Battle Simulator - AI Agent Onboarding

## Project Overview
A full-stack Pokémon Battle Simulator where users build teams, battle, and compete on leaderboards. Frontend: React.js. Backend: Node.js/Express. Database: MongoDB.

---

## Tech Stack
- **Frontend:** React.js, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose ODM
- **Auth:** JWT (jsonwebtoken)
- **Other:** Multer (file uploads), Nodemailer (email), Axios (HTTP)

---

## Directory Structure

```
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Pages (Login, Signup, TeamBuilder, etc.)
│   │   ├── services/api.js         # API client
│   │   └── styles/                 # CSS
│   └── public/
├── server/                         # Express backend
│   ├── models/                     # MongoDB schemas (User, Team, Pokemon, etc.)
│   ├── routes/                     # Express routes (auth, team, user)
│   ├── controllers/                # Route handlers
│   ├── middleware/                 # Auth (JWT), file uploads
│   ├── config/database.js          # MongoDB connection
│   ├── scripts/                    # Data seeding (Pokemon, moves, abilities)
│   └── server.js                   # Entry point
└── README.md, ONBOARDING.md
```

---

## Key Models
| Model | Purpose |
|-------|---------|
| **User** | userId, username, email, password, avatar, eloRating, team reference |
| **Team** | userId, teamId, name, teamPokemon array |
| **TeamPokemon** | Link between Team & Pokemon; stores level, nature, moves, items |
| **Pokemon** | pokemonId, name, type, baseStats (HP, Atk, Def, etc.) |
| **Move** | moveId, name, power, accuracy, type, effect |
| **Ability** | abilityId, name, effect |
| **Item** | itemId, name, effect |
| **Battle** | battleId, players, status, logs |

---

## API Routes

### Auth (`/api/auth`)
- `POST /signup` - Create account with username/email/password
- `POST /login` - Return JWT token
- `POST /logout` - Clear token (protected)
- `POST /forgot-password` - Send reset code to email
- `POST /verify-code` - Verify reset code
- `POST /reset-password` - Reset password with code

### Team (`/api/team`)
- `GET /my-team` - Get user's team (protected)
- `POST /create` - Create new team (protected)
- `PUT /update` - Update team/swap Pokemon (protected)

### User (`/api/user`)
- Profile, stats, leaderboard endpoints (protected)

---

## Authentication Flow
1. User signs up → password hashed with bcryptjs → JWT issued
2. Every protected route requires `Authorization: Bearer <token>` header
3. `protect` middleware validates JWT from `req.headers.authorization`
4. `req.user.userId` available after authentication

---

## Setup Instructions

### Server
```bash
cd server
npm install
# Create .env with: MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS, PORT
npm run dev  # Uses nodemon
```

### Client
```bash
cd client
npm install
npm start
```

---



### 🔑 Environment Variables (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pokemon-battle
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password
NODE_ENV=development
```

### 🗄️ Database Seeding
```bash
node server/scripts/populatePokemon.js
node server/scripts/populateMoves.js
node server/scripts/populateAbilities.js
node server/scripts/populateItems.js
```

---

## File Naming Conventions
- **Models:** `ModelName.js` (e.g., `User.js`, `Pokemon.js`)
- **Controllers:** `entityController.js` (e.g., `authController.js`)
- **Routes:** `entity.js` (e.g., `auth.js`, `team.js`)
- **IDs:** Generated with custom `generateId(prefix)` util (e.g., `user_abc123`, `team_xyz789`)

---

## Common Tasks for AI Agents

| Task | Location |
|------|----------|
| Add new API endpoint | `server/routes/entity.js` + `server/controllers/entityController.js` |
| Add new model | `server/models/ModelName.js` → add schema + export |
| Protect routes | Add `protect` middleware to route handler |
| Fix bug in team logic | `server/controllers/teamController.js` |
| Add component UI | `client/src/components/ComponentName.jsx` |

---

## Notes
- All Pokemon data (sprites) pulled from PokeAPI (GitHub raw sprites)
- Team limit: 6 Pokemon per team (enforced in controllers)
- Battle calculations use Pokemon base stats + moves/abilities
- Avoid committing `node_modules/` and `.env` files

