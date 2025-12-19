# 🎮 Pokemon Battle Simulator - Setup Guide

## Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB** - Local installation or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** - [Download](https://git-scm.com/)

---

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Pokemon-Battle-Simulator.git
cd Pokemon-Battle-Simulator
```

### 2. Server Setup
```bash
cd server
npm install
```

### 3. Configure Environment Variables

**Windows:**
```bash
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/pokemon-battle-simulator

# JWT Secret (generate a secure key for production!)
JWT_SECRET=your_secure_secret_key_here

# Server Port
PORT=5000

# Email Configuration (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 4. Initialize Database

**⚠️ IMPORTANT: This step is required on fresh clones!**

```bash
# Initialize all MongoDB collections
npm run db:init

# (Optional) Seed Pokemon data
npm run db:seed

# Or run both together
npm run setup
```

### 5. Start the Server
```bash
npm run dev
```

### 6. Client Setup (new terminal)
```bash
cd client
npm install
npm start
```

### 7. Verify Setup
Open these URLs to verify:
- **Server Health:** http://localhost:5000/api/health
- **Database Status:** http://localhost:5000/api/health/db
- **Client App:** http://localhost:3000

---

## NPM Scripts Reference

### Server Scripts
| Script | Command | Description |
|--------|---------|-------------|
| Start Production | `npm start` | Run server with node |
| Development | `npm run dev` | Run with nodemon (auto-reload) |
| DB Init | `npm run db:init` | Create all MongoDB collections |
| DB Seed | `npm run db:seed` | Populate Pokemon data |
| Full Setup | `npm run setup` | Run db:init + db:seed |

---

## API Health Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Basic server status |
| `/api/health/db` | GET | Database health & collection status |
| `/api/health/db/init` | POST | Manually trigger collection creation |

### Example: Check Database Health
```bash
curl http://localhost:5000/api/health/db
```

Response shows:
- Database connection status
- All expected collections
- Document counts per collection
- Any missing collections

---

## 🔧 Troubleshooting

### Problem: Collections not created
**Symptom:** API calls fail with "collection not found" or similar errors

**Solution:**
```bash
cd server
npm run db:init
```

### Problem: MongoDB connection refused
**Symptom:** `ECONNREFUSED` error on startup

**Solutions:**
1. **Verify MongoDB is running:**
   - Windows: Check Services for "MongoDB Server"
   - Mac: `brew services list`
   - Linux: `systemctl status mongod`

2. **Using Docker:**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

3. **Check .env file:**
   - Ensure `MONGODB_URI` is correct
   - For Atlas: Check network access settings

### Problem: Missing .env file
**Symptom:** Server crashes with "MONGODB_URI is not defined"

**Solution:**
```bash
cd server
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Linux/Mac
```

### Problem: Port already in use
**Symptom:** `EADDRINUSE` error

**Solution:** Change the PORT in `.env` or kill the process:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

---

## 📊 Database Collections

The following 16 collections are managed by this application:

| Collection | Model | Description |
|------------|-------|-------------|
| users | User | User accounts and authentication |
| notifications | Notification | User notifications |
| chatrooms | ChatRoom | Chat room definitions |
| messages | Message | Chat messages |
| battlelogs | BattleLog | Battle history and logs |
| battles | Battle | Active/completed battles |
| teams | Team | User Pokemon teams |
| teampokemon | TeamPokemon | Pokemon in user teams |
| pokemons | Pokemon | Pokemon data |
| moves | Move | Pokemon moves |
| abilities | Ability | Pokemon abilities |
| items | Item | Holdable items |
| battlepokemon | BattlePokemon | Pokemon in active battles |
| statistics | Statistics | Game statistics |
| leaderboards | Leaderboards | Ranking data |
| admins | Admin | Admin accounts |
| statistics | Statistics | Game statistics |
| leaderboards | Leaderboards | Ranking data |
| admins | Admin | Admin accounts |
| chats | Chat | Legacy chat (deprecated) |

---

## 🚀 Production Deployment

### Environment Variables for Production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/pokemon-battle-simulator
JWT_SECRET=<generate-64-byte-hex-secret>
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-production-domain.com
```

### Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📞 Support

If you encounter issues not covered here:
1. Check the `/api/health/db` endpoint for detailed database status
2. Review server console logs for error messages
3. Verify all environment variables are set correctly
4. Ensure MongoDB is running and accessible
