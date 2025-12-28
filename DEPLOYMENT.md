# 🚀 Deployment Guide - Pokemon Battle Simulator

This guide will help you deploy your Pokemon Battle Simulator with:
- **Database**: MongoDB Atlas (Free Tier)
- **Backend**: Render (Free Tier)
- **Frontend**: Vercel (Free Tier)

---

## 📊 Step 1: Set Up MongoDB Atlas (Cloud Database)

### 1.1 Create Account & Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project (e.g., "Pokemon-Battle-Simulator")
4. Click **"Build a Database"**
5. Select **M0 FREE** tier
6. Choose your preferred cloud provider and region
7. Click **"Create"**

### 1.2 Create Database User
1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Enter a username (e.g., `pokemon_admin`)
5. Generate or create a strong password (save this!)
6. Set **Database User Privileges** to "Read and write to any database"
7. Click **"Add User"**

### 1.3 Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
4. Click **"Confirm"**

### 1.4 Get Connection String
1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials
6. Add your database name before the `?`:
   ```
   mongodb+srv://pokemon_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pokemon-battle-simulator?retryWrites=true&w=majority
   ```

---

## 🖥️ Step 2: Deploy Backend on Render

### 2.1 Prepare Your Repository
Make sure your code is pushed to GitHub.

### 2.2 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with your GitHub account

### 2.3 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `Pokemon-Battle-Simulator` repository
4. Configure the service:
   - **Name**: `pokemon-battle-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.4 Add Environment Variables
In Render dashboard, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A random 32+ character string (e.g., generate at https://randomkeygen.com) |
| `JWT_EXPIRE` | `30d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://your-app.vercel.app` (update after deploying frontend) |

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete
3. Note your backend URL: `https://pokemon-battle-api.onrender.com`

---

## 🌐 Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with your GitHub account

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.3 Add Environment Variables
In the project settings, add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://pokemon-battle-api.onrender.com/api` |

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note your frontend URL: `https://your-app.vercel.app`

---

## 🔄 Step 4: Update CORS Settings

After getting your Vercel URL:

1. Go back to Render dashboard
2. Update the `CLIENT_URL` environment variable with your actual Vercel URL
3. Render will automatically redeploy

---

## 🌱 Step 5: Seed the Database (Optional)

If you have seed data, run it once after deployment:

### Option A: Run Locally with Production DB
```bash
cd server
# Create .env file with production MONGODB_URI
npm run seed  # if you have a seed script
```

### Option B: Use Render Shell
1. Go to your Render service dashboard
2. Click **"Shell"**
3. Run: `node seeders/seedPokemon.js`

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user created with correct permissions
- [ ] Network access allows connections from anywhere
- [ ] Backend deployed on Render
- [ ] Backend health check works: `https://your-api.onrender.com/api/health`
- [ ] Frontend deployed on Vercel
- [ ] Frontend can connect to backend
- [ ] CORS is properly configured

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify `MONGODB_URI` is correct
- Ensure MongoDB network access is configured

### CORS Errors
- Verify `CLIENT_URL` matches your Vercel URL exactly
- Check browser console for specific CORS error messages

### Database Connection Issues
- Verify username/password in connection string
- Check if IP whitelist includes `0.0.0.0/0`
- Ensure database name is in the connection string

### Slow First Load
- Render free tier spins down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds to spin up

---

## 💰 Cost Summary (Free Tier)

| Service | Free Tier Limits |
|---------|------------------|
| MongoDB Atlas M0 | 512 MB storage, shared RAM |
| Render Free | 750 hours/month, spins down after inactivity |
| Vercel Hobby | 100 GB bandwidth, unlimited deployments |

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to Git
2. Use strong, unique passwords for database users
3. Generate a cryptographically secure `JWT_SECRET`
4. Restrict MongoDB network access to specific IPs in production
5. Enable MongoDB Atlas security features (encryption, audit logs)

---

## 📞 Need Help?

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
