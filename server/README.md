# Pokemon Battle Simulator - Backend

## Deployment on Render

This server is configured for deployment on [Render](https://render.com).

### Environment Variables Required

Set these in your Render dashboard:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `JWT_EXPIRE` | Token expiration (e.g., "30d") |
| `NODE_ENV` | Set to "production" |
| `CLIENT_URL` | Your frontend URL (for CORS) |

### Build Command
```
npm install
```

### Start Command
```
npm start
```
