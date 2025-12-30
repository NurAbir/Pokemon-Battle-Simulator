# 📖 Pokémon Battle Simulator - User Manual

Welcome to the **Pokémon Battle Simulator**! This comprehensive guide will help you navigate through all features of the application and become a Pokémon master.

---

## Table of Contents

1. [Getting Started](#getting-started)
   - [Creating an Account](#creating-an-account)
   - [Logging In](#logging-in)
   - [Password Recovery](#password-recovery)
2. [Dashboard Overview](#dashboard-overview)
3. [Team Builder](#team-builder)
   - [Creating a Team](#creating-a-team)
   - [Adding Pokémon](#adding-pokémon)
   - [Customizing Pokémon](#customizing-pokémon)
   - [Saving Your Team](#saving-your-team)
4. [Battle System](#battle-system)
   - [Finding a Battle](#finding-a-battle)
   - [Battle Interface](#battle-interface)
   - [Making Moves](#making-moves)
   - [Switching Pokémon](#switching-pokémon)
   - [Battle Timer](#battle-timer)
5. [Social Features](#social-features)
   - [Friend System](#friend-system)
   - [Chat System](#chat-system)
   - [Notifications](#notifications)
6. [Profile Management](#profile-management)
7. [Tips & Best Practices](#tips--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating an Account

1. **Navigate to the Sign Up page**
   - From the homepage, click on **"Sign up here"** link
   - Or go directly to `/signup`

2. **Fill in the registration form**
   - **Username**: Choose a unique username (this will be visible to other players)
   - **Email Address**: Enter a valid email address
   - **Password**: Create a strong password
   - **Confirm Password**: Re-enter your password
   - **Favorite Pokémon**: Enter your favorite Pokémon (e.g., "Pikachu")

3. **Submit the form**
   - Click the **"Sign Up"** button
   - Upon successful registration, you'll be redirected to the login page

![Sign Up Form]

---

### Logging In

1. **Go to the Login page**
   - Navigate to `/login` or click **"Login"** from the homepage

2. **Enter your credentials**
   - **Email Address**: Your registered email
   - **Password**: Your account password

3. **Click "Login"**
   - You'll be redirected to the Dashboard upon successful login

![Login Form]

---

### Password Recovery

If you've forgotten your password:

1. **Click "Forgot Password?"** on the login page
2. **Enter your email address** and submit
3. **Check your email** for a verification code
4. **Enter the verification code** on the verification page
5. **Create a new password** on the reset password page

---

## Dashboard Overview

The Dashboard is your central hub for all activities. Here's what you'll find:

### Header Navigation Bar
Located at the top of the screen:
- **Chat**: Access the chat system
- **Friends**: Manage your friends list
- **Notifications**: View notifications (shows unread count badge)
- **Profile**: Access your profile page
- **Logout**: Sign out of your account

### Welcome Card
Displays:
- Your username
- Quick stats overview (Total Battles, Win Rate, ELO Rating)

### Battle Mode Selection
Choose your preferred battle mode:

| Mode | Icon | Description |
|------|------|-------------|
| **Normal Battle** | ⚔️ | Casual matches for practice - no ELO changes |
| **Ranked Battle** | 🏆 | Competitive matches that affect your ELO rating |

### Action Buttons
- **Play [Mode]**: Start searching for a battle
- **Team Builder**: Build and customize your Pokémon teams

### Leaderboard
View the top 5 players with their:
- Rank position (#1-#5)
- Username
- ELO rating
- Special badges for top 3 (👑 🥈 🥉)

---

## Team Builder

The Team Builder allows you to create and customize up to 6 Pokémon teams.

### Creating a Team

1. **Access Team Builder**
   - Click **"Team Builder"** from the Dashboard
   - Or navigate to `/team-builder`

2. **Create a New Team**
   - Click **"+ New Team"** in the left sidebar
   - Enter a team name in the popup modal
   - Click **"Create"**

3. **Your new team** will appear in the teams list on the left

### Adding Pokémon

1. **Select your team** from the left sidebar
2. **Click on an empty slot** (numbered 1-6) in the main area
3. **Pokemon Selector** will appear
4. **Search or browse** through available Pokémon
5. **Click on a Pokémon** to add it to your team

### Customizing Pokémon

Once a Pokémon is added, click on it to customize:

#### Basic Info
- **Nickname**: Give your Pokémon a custom name
- **Level**: Set level (1-100, default is 50)
- **Gender**: Choose Male (M) or Female (F)
- **Nature**: Select from 25 different natures that affect stats

#### Stats Configuration
- **Base Stats**: View the Pokémon's base statistics
- **EVs (Effort Values)**: Distribute up to 510 total EVs across stats
  - Maximum 252 per individual stat
  - Stats: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed
- **IVs (Individual Values)**: Set values 0-31 for each stat (default 31)
- **Calculated Stats**: View the final stats based on all factors

#### Battle Configuration
- **Ability**: Choose from the Pokémon's available abilities
- **Item**: Select a held item
- **Moves**: Choose up to 4 moves for your Pokémon
- **Hidden Power Type**: Select the type for Hidden Power move (if applicable)

### Saving Your Team

- Teams **auto-save** when you make changes
- Click **"Save Team"** button for manual save
- Status indicators:
  - "Saving..." - Save in progress
  - "✓ Saved!" - Successfully saved
  - "✗ Error" - Save failed, try again

### Managing Teams

- **Select a team**: Click on team name in sidebar
- **Delete a team**: Click the ✕ button next to team name
- **Remove a Pokémon**: Click remove button in Pokémon details

---

## Battle System

### Finding a Battle

1. **Build a team first** (you need at least one team with Pokémon)
2. **Select your team** in Team Builder and save it
3. **Go to Dashboard** and select battle mode (Normal/Ranked)
4. **Click "Play [Mode]"** or go to `/battle`
5. **Click "Find Battle"** to enter matchmaking

You'll see:
- "Searching for opponent..." message
- A loading spinner
- **"Cancel"** button to exit matchmaking

### Battle Interface

Once matched, the battle screen shows:

#### Top Section - Opponent's Pokémon
- Pokémon name and level
- HP bar (color-coded: green > yellow > red)
- Type icons
- Animated sprite

#### Bottom Section - Your Pokémon
- Your Pokémon name and level
- HP bar with current/max HP display
- Status effects (if any)
- Type icons

#### Control Panel
- **Move Buttons**: Your 4 available moves
  - Shows move name, type, and PP (Power Points)
- **Switch Button**: Open the switch menu
- **Forfeit Button**: Surrender the battle

### Making Moves

1. **Review available moves** at the bottom of the screen
2. **Click on a move** to select it
3. **Wait for opponent** to also select their action
4. **Watch the turn play out** - faster Pokémon goes first

Move information displayed:
- Move name
- Move type (Fire, Water, etc.)
- PP remaining

### Switching Pokémon

1. **Click "Switch"** to open the switch menu
2. **View your team** with current HP status
3. **Click on an available Pokémon** to switch
4. **Fainted Pokémon** cannot be selected (shown greyed out)

**Forced Switch**: When your active Pokémon faints, you MUST switch to another Pokémon.

### Battle Timer

- Each player has **120 seconds per turn** to make a decision
- Timer shows remaining time for both players
- **Warning appears** when time is running low
- If time runs out, you automatically lose the battle

### Battle Log

The battle log panel shows:
- Turn-by-turn actions
- Damage dealt
- Status effects applied
- Pokémon switches
- Weather changes
- Ability activations

### Ending a Battle

Battles end when:
- All of one player's Pokémon faint (Winner declared)
- A player forfeits (Opponent wins)
- A player times out (Opponent wins)

After battle:
- Results popup shows winner
- Return to matchmaking screen
- Stats are updated (for ranked battles)

---

## Social Features

### Friend System

Access via **"👥 Friends"** button in the header.

#### Tabs
- **Search**: Find and add new friends
- **Friends**: View your friends list

#### Searching for Users
1. Enter a username (minimum 2 characters)
2. Click **"Search"** or press Enter
3. Results show:
   - Username
   - Online status (🟢 Online / ⚫ Offline)
   - Relationship status

#### Adding Friends
- **"Add Friend"**: Send a friend request
- **"Pending..."**: Request already sent
- **"Accept/Deny"**: Respond to incoming request
- **"Already Friends"**: Already connected

#### Friends List
Shows all your friends with:
- Avatar and username
- Online/Offline status
- Action buttons:
  - **💬 Chat**: Start private conversation
  - **🎮 Battle**: Send battle invitation
  - **❌ Remove**: Remove friend

### Chat System

Access via **"💬 Chat"** button in the header.

#### Chat Types

| Type | Description |
|------|-------------|
| **Global Chat** | Public chat for all users |
| **Private Chat** | One-on-one conversations with friends |
| **Battle Chat** | Temporary chat during battles |

#### Using Global Chat
1. Click **"Global"** tab
2. Type message in the input box
3. Press Enter or click Send

#### Starting Private Chat
1. Click **"Private"** tab
2. Click **"+ New Chat"** button
3. Select a friend from the list
4. Start messaging!

#### Chat Features
- **Real-time messaging** - messages appear instantly
- **Typing indicators** - see when others are typing
- **Message history** - scroll up to load older messages
- **Online status** - see who's online

### Notifications

Access via **"🔔 Notifications"** button (shows unread count).

#### Notification Types

| Icon | Type | Description |
|------|------|-------------|
| ⚔️ | **Match Invite** | Someone challenged you to battle |
| 👥 | **Friend Request** | Someone wants to be friends |
| 🏆 | **Battle Result** | Summary of completed battle |
| ✅ | **Request Accepted** | Your request was accepted |
| ❌ | **Request Denied** | Your request was declined |
| 📢 | **System** | System announcements |

#### Managing Notifications
- **Filter**: Show All, Unread Only, or by type
- **Mark as Read**: Click on notification
- **Mark All Read**: Clear all unread indicators
- **Respond**: Accept/Deny requests directly

#### Responding to Battle Invites
1. Click on the match invite notification
2. **Select a team** from dropdown (if accepting)
3. Click **"Accept"** or **"Deny"**
4. If accepted, you'll be taken to the battle

---

## Profile Management

Access via **"👤 Profile"** button in the header.

### Profile Information

#### Avatar
- Click on avatar to upload new image
- Maximum file size: 5MB
- Supported formats: JPG, PNG, GIF

#### Username
- Click **"Edit"** next to username
- Enter new username
- Click **"Save"** to confirm

#### Bio
- Click **"Edit Bio"** button
- Write a short description about yourself
- Click **"Save"** to update

### Statistics Display
- **Total Battles**: Number of battles played
- **Wins/Losses**: Your battle record
- **Win Rate**: Percentage of battles won
- **ELO Rating**: Your competitive ranking

### Current Team Preview
- Shows your selected battle team
- Displays Pokémon sprites and names

### Battle History
- View recent battles
- See opponent names
- Check win/loss results
- Review battle dates

### Account Actions
- **Logout**: Sign out of your account

---

## Tips & Best Practices

### Team Building Tips

1. **Type Coverage**: Include Pokémon with diverse move types
2. **Team Balance**: Mix offensive and defensive Pokémon
3. **Synergy**: Choose abilities and items that complement each other
4. **EV Distribution**: Focus EVs on stats that matter for each Pokémon's role
5. **Move Selection**: Include at least one STAB (Same Type Attack Bonus) move

### Battle Strategy Tips

1. **Know Type Matchups**: Super effective moves deal 2x damage
2. **Predict Switches**: Anticipate opponent's swaps
3. **Preserve Key Pokémon**: Don't sacrifice important team members early
4. **Watch the Timer**: Don't run out of time!
5. **Use Status Moves**: Moves like Thunder Wave or Toxic can turn battles

### Social Tips

1. **Add Active Players**: Build a friends list for quick battles
2. **Use Private Chat**: Coordinate strategies with friends
3. **Check Notifications**: Don't miss battle invites!

---

## Troubleshooting

### Common Issues

#### Can't Login
- Verify your email and password are correct
- Check if Caps Lock is on
- Try the "Forgot Password" feature

#### Can't Find Battles
- Make sure you have a saved team with Pokémon
- Check your internet connection
- Try refreshing the page

#### Battle Disconnected
- The game will attempt to reconnect automatically
- If disconnected too long, the battle may end
- Check your internet connection

#### Team Not Saving
- Ensure you're logged in
- Check for any error messages
- Try the manual "Save Team" button

#### Chat Not Working
- Refresh the page to reconnect
- Check if you're logged in
- Verify internet connection

### Browser Compatibility

For best experience, use:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Getting Help

If you encounter issues not covered here:
1. Check if the problem persists after refreshing
2. Try logging out and back in
3. Clear browser cache and cookies
4. Contact support through the application

---

## Quick Reference

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Send message (in chat) |
| Esc | Close modals/popups |

### Navigation Quick Links

| Page | URL Path |
|------|----------|
| Login | `/login` |
| Sign Up | `/signup` |
| Dashboard | `/dashboard` |
| Team Builder | `/team-builder` |
| Battle | `/battle` |
| Profile | `/profile` |
| Friends | `/friends` |
| Chat | `/chat` |
| Notifications | `/notifications` |

### Status Icons

| Icon | Meaning |
|------|---------|
| 🟢 | Online |
| ⚫ | Offline |
| 🔔 | New notification |
| ⚔️ | Battle/Challenge |
| 👥 | Friends/Social |
| 💬 | Chat/Message |
| 🏆 | Ranked/Competitive |
| ⭐ | ELO Rating |

---

## Support

Having trouble? Here are some resources:
- Check this user manual for guidance
- Look for in-app tooltips and hints
- Report bugs through the appropriate channels

---

**Thank you for playing Pokémon Battle Simulator!** 

*May your battles be victorious and your catches be shiny!* 

---

*Last Updated: December 2024*
*Version: 1.0*