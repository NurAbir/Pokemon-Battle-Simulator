# Pokémon Battle Simulator - Implementation Guide

## Project Structure

```
pokemon-battle-simulator/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Battle.js
│   │   ├── BattleLog.js
│   │   ├── BattlePokemon.js
│   │   ├── Team.js
│   │   ├── TeamPokemon.js
│   │   ├── Pokemon.js
│   │   ├── Move.js
│   │   ├── Ability.js
│   │   ├── Item.js
│   │   ├── Leaderboard.js
│   │   ├── Notification.js
│   │   ├── Statistics.js
│   │   └── Chat.js
│   ├── routes/
│   │   ├── auth.js              # Login, Register, Logout
│   │   ├── user.js              # Profile, Update, Stats
│   │   ├── battle.js            # Battle operations
│   │   ├── team.js              # Team management
│   │   ├── pokemon.js           # Pokemon data
│   │   ├── leaderboard.js       # Rankings
│   │   └── admin.js             # Admin operations
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── battleController.js
│   │   ├── teamController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── upload.js            # Image upload (multer)
│   │   └── errorHandler.js      # Error handling
│   ├── utils/
│   │   ├── generateId.js        # ID generation
│   │   └── battleEngine.js      # Battle calculations
│   ├── seeders/
│   │   └── seedData.js          # Seed Pokemon, Moves, etc.
│   └── server.js                # Express app entry point
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Profile.jsx
│   │   │   ├── Battle.jsx
│   │   │   ├── TeamBuilder.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js           # API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state
│   │   └── App.jsx
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Step-by-Step Implementation

### Step 1: Initialize Project

```bash
# Create project directory
mkdir pokemon-battle-simulator
cd pokemon-battle-simulator

# Initialize npm
npm init -y

# Install dependencies
npm install express mongoose bcrypt ejs cors dotenv jsonwebtoken multer
npm install --save-dev nodemon
```

### Step 2: Update package.json

Add these scripts:

```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "seed": "node server/seeders/seedData.js"
  }
}
```

---

## Database Configuration

### Step 3: Setup MongoDB Connection

Create `server/config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_battle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## Environment Variables

### Step 4: Create .env file

Create `.env` in root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/pokemon_battle

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
```

---

## Middleware Setup

### Step 5: Authentication Middleware

Create `server/middleware/auth.js`:

```JavaScript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorised to access this route` 
      });
    }
    next();
  };
};
```

### Step 6: Error Handler Middleware

Create `server/middleware/errorHandler.js`:

```JavaScript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
```

### Step 7: File Upload Middleware

Create `server/middleware/upload.js`:

```JavaScript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;
```

---

## Main Server File

### Step 8: Create server.js

Create `server/server.js`:

```JavaScript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/battles', require('./routes/battle'));
app.use('/api/teams', require('./routes/team'));
app.use('/api/pokemon', require('./routes/pokemon'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pokémon Battle Simulator API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handler (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

---

## .gitignore File

### Step 9: Create .gitignore

Create `.gitignore` in root directory:

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.development
.env.production

# Build output
dist/
build/
client/dist/
client/build/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/*
!uploads/.gitkeep

# Testing
coverage/

# Misc
*.pem
```

---

## Client Setup

### Step 10: Initialize React Client

```bash
# Create React app with Vite
npm create vite@latest client -- --template react

# Navigate to client folder
cd client

# Install dependencies
npm install axios react-router-dom

# Install dev dependencies
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 11: Client API Service

Create `client/src/services/api.js`:

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 12: Client Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1 - Run backend
npm run dev

# Terminal 2 - Run frontend
cd client
npm run dev
```

### Production Mode

```bash
# Build frontend
cd client
npm run build

# Run backend
npm start
```

---

## Additional Setup

### Create uploads directory

```bash
mkdir uploads
touch uploads/.gitkeep
```

### Seed Database

```bash
npm run seed
```

---

## Troubleshooting

### MongoDB Connection Issues

If you get connection errors:

1. Make sure MongoDB is running locally
2. Check if the port 27017 is correct
3. Verify MONGODB_URI in .env file

### CORS Errors

If you get CORS errors:

1. Verify CLIENT_URL in .env matches your frontend URL
2. Check CORS configuration in server.js

### Port Already in Use

If port 5000 is already in use:

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

---

## Next Steps

1. Implement all models in `server/models/`
2. Create controllers in `server/controllers/`
3. Set up routes in `server/routes/`
4. Build React components in `client/src/components/`
5. Test all API endpoints
6. Deploy to production (see deployment guide)

---
