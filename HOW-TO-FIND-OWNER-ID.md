# How to Find Your Sleeper Owner ID (User ID)

Your **owner_id** (also called **user_id**) is a unique identifier for your Sleeper account. Using it instead of your username is **faster and more reliable** because it skips an API call.

## Method 1: From Sleeper API (Easiest!) ⭐

This is the quickest way to find your owner_id:

### Step-by-Step:

1. **Get your League ID** from the URL:
   ```
   https://sleeper.com/leagues/123456789
   ```
   League ID = `123456789`

2. **Open this URL in your browser** (replace `YOUR_LEAGUE_ID`):
   ```
   https://api.sleeper.app/v1/league/YOUR_LEAGUE_ID/rosters
   ```

3. **Look for your team** in the JSON response:
   - Search for your team name or players you own
   - Each roster has an `"owner_id"` field
   - Example:
   ```json
   {
     "owner_id": "123456789012",
     "roster_id": 1,
     "players": ["8136", "7564", ...],
     "starters": ["8136", "7564", ...]
   }
   ```

4. **Copy your owner_id** - it's usually a 12-digit number like `123456789012`

---

## Method 2: From League Users Endpoint

### Step-by-Step:

1. **Open this URL** (replace `YOUR_LEAGUE_ID`):
   ```
   https://api.sleeper.app/v1/league/YOUR_LEAGUE_ID/users
   ```

2. **Find your display name** in the JSON:
   ```json
   {
     "user_id": "123456789012",
     "display_name": "Your Display Name",
     "username": "yourusername"
   }
   ```

3. **Copy the user_id** value

---

## Method 3: From Browser URL

### Step-by-Step:

1. **Go to your league** on Sleeper
2. **Click on your team**
3. **Look at the URL**:
   ```
   https://sleeper.com/leagues/123456789/team?userId=123456789012
   ```
4. **Copy the userId parameter** - that's your user_id!

**Note:** This only works if the URL contains the `userId` parameter. If it doesn't, use Method 1 or 2.

---

## Method 4: From Browser Developer Tools (Advanced)

### Step-by-Step:

1. **Open Sleeper** in your browser
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to the Network tab**
4. **Navigate to your league**
5. **Look for API calls** to `sleeper.app/v1/`
6. **Click on a request** and view the response
7. **Find your user_id** in the JSON data

---

## What to Do With Your Owner ID

Once you have your `owner_id`, use it in your config:

### Option 1: n8n Workflow Config
```javascript
const config = {
  user_id: '123456789012',  // ← Your owner_id here
  league_id: 'YOUR_LEAGUE_ID',
  // ... rest of config
};
```

### Option 2: config.js File
```javascript
module.exports = {
  sleeper: {
    user_id: '123456789012',  // ← Your owner_id here
    league_id: 'YOUR_LEAGUE_ID',
    username: null,  // Not needed if you provide user_id
  }
};
```

---

## Why Use Owner ID Instead of Username?

### Advantages:
✅ **Faster** - Skips one API call to fetch user data
✅ **More reliable** - Usernames can be case-sensitive or change
✅ **Works immediately** - No need to look up your exact username format

### When to Use Username:
- You don't know your owner_id
- You're setting up quickly and don't want to look it up
- You're analyzing multiple users and have their usernames

---

## Example: Complete Config

Here's what your config should look like:

```javascript
const config = {
  // Use EITHER user_id OR sleeper_username (not both)

  // RECOMMENDED: Use user_id
  user_id: '123456789012',           // ← Your owner_id from above
  sleeper_username: null,             // Not needed

  // OR use username (slower)
  // user_id: null,
  // sleeper_username: 'yoursleeperusername',

  league_id: '987654321',             // Your league ID
  season: '2024',
  email: 'you@example.com',
  current_week: 10,

  max_waiver_recommendations: 5,
  include_reddit_analysis: true
};
```

---

## Troubleshooting

### "Invalid user_id"
- Make sure it's a number (not your username)
- Try using the API method (Method 1) to verify
- Owner IDs are usually 10-15 digits long

### "Roster not found"
- Verify your league_id is correct
- Make sure you're part of the league
- Check that the season is correct ('2024')

### Still can't find it?
- Use your **username** instead - it works fine, just slightly slower
- Check the Sleeper app settings for your profile info

---

## Quick Reference

| Method | Speed | Difficulty | URL Format |
|--------|-------|------------|------------|
| Method 1 (API) | ⚡ Fast | 😊 Easy | `https://api.sleeper.app/v1/league/LEAGUE_ID/rosters` |
| Method 2 (Users) | ⚡ Fast | 😊 Easy | `https://api.sleeper.app/v1/league/LEAGUE_ID/users` |
| Method 3 (URL) | ⚡ Fast | 😊 Easy | Look at browser URL after clicking your team |
| Method 4 (DevTools) | 🐌 Slow | 😓 Advanced | Requires technical knowledge |

**Recommended:** Use Method 1 (API Rosters) - it's the easiest and most reliable!

---

## Next Steps

Once you have your owner_id:
1. Update your config with the user_id
2. Test your n8n workflow
3. You should see faster execution times! ⚡

**Happy analyzing!** 🏈
