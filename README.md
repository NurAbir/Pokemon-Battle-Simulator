# Pokémon Battle Simulator

_A full-stack multiplayer Pokémon battle experience — inspired by Pokémon Showdown!_

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Future Plans](#future-plans)
8. [Disclaimer](#disclaimer)

---

## Overview

This project is a **full-stack Pokémon Battle Simulator** where players can build teams, customize Pokémon with moves, abilities, and items, then battle other players in real-time. It features user authentication, friend systems, real-time chat, and comprehensive battle logging.

---

## Features

### Core Battle Features
- **Team Builder** – Create and manage teams with custom Pokémon, moves, abilities, and items
- **Battle Engine** – Full damage calculations, status effects, and turn order management
- **Real-Time Battles** – Live multiplayer battles using WebSockets
- **Battle Logs** – Detailed turn-by-turn battle history and statistics
- **Turn Timer** – Timed turns for competitive gameplay

### Social Features
- **User Authentication** – Secure login, signup, and password recovery with email verification
- **Friend System** – Find, add, and manage friends
- **Real-Time Chat** – Chat with friends and opponents
- **Notifications** – Real-time notification system for battle invites and friend requests
- **User Profiles** – Customizable user profiles with avatar uploads

### Data & Statistics
- **Leaderboards** – Track rankings and player statistics
- **Battle History** – View past battles and performance

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.1 | UI library |
| React Router DOM | ^6.30.2 | Client-side routing |
| Axios | ^1.13.2 | HTTP client |
| Socket.io Client | ^4.8.1 | Real-time communication |
| Tailwind CSS | ^4.1.18 | Styling framework |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | ^5.2.1 | Web framework |
| MongoDB/Mongoose | ^9.0.1 | Database & ODM |
| Socket.io | ^4.8.1 | Real-time communication |
| JSON Web Token | ^9.0.3 | Authentication |
| Bcrypt.js | ^3.0.3 | Password hashing |
| Multer | ^2.0.2 | File uploads |
| Nodemailer | ^7.0.11 | Email service |

---

## Project Structure

```
pokemon-battle-simulator/
├── client/                    # React Frontend
│   ├── public/
│   │   └── images/           # Static assets
│   └── src/
│       ├── components/       # React components
│       │   ├── Battle.jsx
│       │   ├── TeamBuilder.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ChatBox.jsx
│       │   └── ...
│       ├── services/         # API & Socket services
│       └── styles/           # CSS stylesheets
│
└── server/                    # Node.js Backend
    ├── config/               # Database configuration
    ├── controllers/          # Route handlers
    ├── middleware/           # Auth & upload middleware
    ├── models/               # Mongoose schemas
    ├── routes/               # API routes
    ├── scripts/              # Data population scripts
    ├── sockets/              # Real-time event handlers
    └── utils/                # Battle engine & utilities
```

---

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NurAbir/Pokemon-Battle-Simulator.git
   cd Pokemon-Battle-Simulator
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**
   
   Create a `.env` file in the server directory with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

5. **Populate Database (Optional)**
   ```bash
   cd server
   node scripts/populatePokemon.js
   node scripts/populateMoves.js
   node scripts/populateAbilities.js
   node scripts/populateItems.js
   ```

---

## Usage

### Development Mode

**Start the Server:**
```bash
cd server
npm run dev
```

**Start the Client:**
```bash
cd client
npm start
```

### Production Mode

**Build the Client:**
```bash
cd client
npm run build
```

**Start the Server:**
```bash
cd server
npm start
```

---

## Future Plans

- Add more generations of Pokémon
- Implement ranked matchmaking system
- Add battle animations and sound effects
- Expand battle modes (Double battles, etc.)
- Mobile-responsive design improvements

---

## Disclaimer

This project is made **for educational and non-commercial purposes only**.

All Pokémon names, sprites, and related assets are **the property of Nintendo, Game Freak, and The Pokémon Company**.

This simulator is a **fan-made educational project** and does not claim ownership of any official Pokémon content.
