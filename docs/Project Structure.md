# Pokémon Battle Simulator - Implementation Guide

```
pokemon-battle-simulator/
├── project-structure.md
├── README.md
├── UML Class Diagram/
│
├── client/
│   ├── package.json
│   ├── README.md
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── images/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── index.js
│       ├── reportWebVitals.js
│       ├── components/
│       │   ├── Battle.jsx           # Battle arena component
│       │   ├── BattleLogPanel.jsx   # Battle log display
│       │   ├── ChatBox.jsx          # Real-time chat component
│       │   ├── Dashboard.jsx        # Main dashboard
│       │   ├── ForgotPassword.jsx   # Password recovery
│       │   ├── FriendFinder.jsx     # Friend search/add
│       │   ├── Login.jsx            # User login
│       │   ├── NotificationBoard.jsx # Notifications display
│       │   ├── PokemonDetails.jsx   # Pokemon info display
│       │   ├── PokemonSelector.jsx  # Pokemon selection UI
│       │   ├── ProfilePage.jsx      # User profile
│       │   ├── ResetPassword.jsx    # Password reset
│       │   ├── Signup.jsx           # User registration
│       │   ├── TeamBuilder.jsx      # Team management
│       │   └── VerifyCode.jsx       # Email verification
│       ├── services/
│       │   ├── api.js               # API calls (axios)
│       │   └── socketService.js     # Socket.io client
│       └── styles/
│           ├── auth.css
│           ├── battle.css
│           ├── battleLog.css
│           ├── ChatBox.css
│           ├── Dashboard.css
│           ├── friendFinder.css
│           ├── notifications.css
│           ├── ProfilePage.css
│           └── teamBuilder.css
│
└── server/
    ├── package.json
    ├── server.js                    # Express app entry point
    ├── config/
    │   └── database.js              # MongoDB connection
    ├── controllers/
    │   ├── authController.js        # Authentication logic
    │   ├── battleController.js      # Battle operations
    │   ├── chatController.js        # Chat functionality
    │   ├── friendController.js      # Friend management
    │   ├── notificationController.js # Notification handling
    │   ├── teamController.js        # Team CRUD operations
    │   └── userController.js        # User profile operations
    ├── middleware/
    │   ├── auth.js                  # JWT authentication
    │   └── upload.js                # Image upload (multer)
    ├── models/
    │   ├── Ability.js
    │   ├── Admin.js
    │   ├── Battle.js
    │   ├── BattleLog.js
    │   ├── BattlePokemon.js
    │   ├── Chat.js
    │   ├── ChatRoom.js
    │   ├── FriendRequest.js
    │   ├── Item.js
    │   ├── Leaderboards.js
    │   ├── Message.js
    │   ├── Move.js
    │   ├── Notification.js
    │   ├── Pokemon.js
    │   ├── Statistics.js
    │   ├── Team.js
    │   ├── TeamPokemon.js
    │   └── User.js
    ├── routes/
    │   ├── auth.js                  # Login, Register, Logout
    │   ├── battleRoutes.js          # Battle endpoints
    │   ├── chat.js                  # Chat endpoints
    │   ├── friend.js                # Friend operations
    │   ├── notification.js          # Notification endpoints
    │   ├── team.js                  # Team management
    │   └── user.js                  # User profile routes
    ├── scripts/
    │   ├── populateAbilities.js     # Seed abilities data
    │   ├── populateItems.js         # Seed items data
    │   ├── populateMoves.js         # Seed moves data
    │   └── populatePokemon.js       # Seed Pokemon data
    ├── seeders/
    │   └── seedPokemon.js           # Pokemon seeder
    ├── sockets/
    │   ├── battleHandler.js         # Real-time battle events
    │   ├── chatHandler.js           # Real-time chat events
    │   └── notificationHandler.js   # Real-time notifications
    └── utils/
        ├── battleCalculator.js      # Damage calculations
        ├── battleEngine.js          # Battle logic engine
        ├── battleLogService.js      # Battle log utilities
        ├── generateId.js            # ID generation
        └── turnTimerManager.js      # Battle turn timer
```

---

## Step-by-Step Implementation

### **Step 1: Initialize Project**

```bash
# Create project directory
mkdir pokemon-battle-simulator
cd pokemon-battle-simulator

# Create client and server directories
mkdir client server
```

### **Step 2: Server Setup**

```bash
cd server
npm init -y
```

#### Server Dependencies

```bash
# Core dependencies
npm install express mongoose bcryptjs cors dotenv jsonwebtoken multer axios nodemailer socket.io uuid

# Development dependencies
npm install --save-dev nodemon
```

**Key Server Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| mongoose | ^9.0.1 | MongoDB ODM |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| socket.io | ^4.8.1 | Real-time communication |
| multer | ^2.0.2 | File uploads |
| nodemailer | ^7.0.11 | Email sending |
| axios | ^1.13.2 | HTTP client |
| cors | ^2.8.5 | Cross-origin requests |
| dotenv | ^17.2.3 | Environment variables |
| uuid | ^13.0.0 | Unique ID generation |

#### Server package.json scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### **Step 3: Client Setup**

```bash
cd ../client
npx create-react-app .
```

#### Client Dependencies

```bash
# Core dependencies
npm install axios react-router-dom socket.io-client

# Development dependencies
npm install --save-dev tailwindcss postcss autoprefixer
```

**Key Client Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.1 | UI library |
| react-dom | ^19.2.1 | React DOM rendering |
| react-router-dom | ^6.30.2 | Client-side routing |
| axios | ^1.13.2 | HTTP client |
| socket.io-client | ^4.8.1 | Real-time communication |
| tailwindcss | ^4.1.18 | CSS framework |

#### Client package.json scripts

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```