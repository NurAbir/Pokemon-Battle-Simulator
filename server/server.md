# Server structure
```sql
├── server.js             # Main entry point & configuration
├── models/
│   ├── User.js           # Mongoose Schema for Users
│   └── Pokemon.js        # Mongoose Schema for Pokémon
├── routes/
│   ├── users.js          # User-related API endpoints
│   └── pokemon.js        # Pokémon-related API endpoints
└── utils/
    └── mockUsers.js      # Utility for generating seed data
```

# Core files & utilities
| File | Type | Exports/Functions | Description |
|:---|:---|:---|:---|
| server.js | Entry Point | app | "Initializes Express, connects to MongoDB, mounts middleware (CORS, JSON), and defines the /populate seeder route." |
| mockUsers.js | Utility | generateMockUsers | "Generates an array of randomized user objects with stats, avatars, and statuses." |

# Models (Data schema)
| File | Export | Key Fields |
|:---|:---|:---|
| User.js | User (Model) | "id, username, status (safe/suspicious), reportData (Wins, ELO, etc.)" |
| Pokemon.js | Pokemon (Model) | "name, type, rating (S-D), baseStats (hp, attack), moves" |

# User API routes
`localhost:PORT/api/users`
| Method | Route | Description |
|:---:|:---|:---|
| GET | /random | Returns a single random user using MongoDB $sample. |
| GET | / | Retrieves all users from the database. |
| GET | /leaderboard | Returns top 10 users sorted by ELO (descending). |
| GET | /active-battles | "Filters users with a status of ""battling""." |
| POST | /:id/report | "Flags a user as ""suspicious"" and adds a reporter. Supports Mongo _id or custom id." |
| POST | /:id/dismiss | "Resets a user status to ""safe"" and clears reports." |
| PATCH | /:id/stats | Updates Wins/Losses and adjusts ELO based on battle results. |
| PATCH | /season-reset | Resets ELO to 1000 and Wins/Losses to 0 for all users. |
| DELETE | /:id | Permanently removes a user (Banning).|

# Pokemon API routes
`localhost:PORT/api/pokemon`
| Method | Route | Description |
|:---:|:---|:---|
| GET | / | Retrieves all Pokémon. |
| GET | /random/:count | Returns a specific number of random Pokémon.|
| POST | / | Creates a new Pokémon entry with validation. |
| PUT | /:id | Updates an existing Pokémon's details and stats. |
| DELETE | /:id | Removes a Pokémon by its ID. |

