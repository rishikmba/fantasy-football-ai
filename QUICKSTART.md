# Quick Start Guide 🚀

Get your Fantasy Football AI Assistant running in **10 minutes or less!**

## What You'll Build

An automated system that emails you daily with:
- **Top waiver wire pickups** with priority rankings
- **Drop candidates** from your roster
- **Sit/start recommendations** based on injuries
- **Reddit sentiment** from r/fantasyfootball
- **Trending player analysis** across all Sleeper leagues

## Prerequisites

✅ Sleeper fantasy football account
✅ n8n account (get free at [n8n.cloud](https://n8n.cloud))
✅ Email account (Gmail works great)
✅ 10 minutes of your time

## Step 1: Get Your Sleeper Info (2 minutes)

### Find Your Username
1. Log into Sleeper
2. Click your profile
3. Your username is shown at the top (not your display name!)

### Find Your League ID
1. Go to your league
2. Look at the URL: `https://sleeper.com/leagues/123456789`
3. Copy the number at the end → That's your league ID

**Write these down:**
- Username: `________________`
- League ID: `________________`

## Step 2: Set Up n8n Workflow (5 minutes)

### A. Create New Workflow

1. Log into your n8n instance
2. Click **"+ New Workflow"**
3. Name it: `Fantasy Football Analyzer`

### B. Add Nodes

**Add these nodes in order:**

```
1. Schedule Trigger
   └─> 2. Config (Code)
       └─> 3. Fetch Sleeper (Code)
           └─> 4. Analyze Team (Code)
               └─> 5. Generate Email (Code)
                   └─> 6. Send Email
```

### C. Configure Each Node

#### Node 1: Schedule Trigger

**Type:** Schedule Trigger
**Settings:**
- Trigger Interval: `Every Day`
- Hour: `8` (or when you want the email)
- Minute: `0`

**Click:** Execute Node ✓

---

#### Node 2: Load Config (Code)

**Type:** Code
**Name:** `Load Config`

**Paste this code:**

```javascript
const config = {
  sleeper_username: 'YOUR_USERNAME_HERE',    // ← PUT YOUR USERNAME
  league_id: 'YOUR_LEAGUE_ID_HERE',          // ← PUT YOUR LEAGUE ID
  season: '2024',
  email: 'your.email@example.com',           // ← PUT YOUR EMAIL
  current_week: 10,                          // ← UPDATE WEEKLY

  max_waiver_recommendations: 5,
  max_reddit_searches: 3,
  include_reddit_analysis: true
};

return [{ json: { config } }];
```

**Replace:**
- `YOUR_USERNAME_HERE` with your Sleeper username
- `YOUR_LEAGUE_ID_HERE` with your league ID
- `your.email@example.com` with your email

**Click:** Execute Node ✓

---

#### Node 3: Fetch Sleeper Data (Code)

**Type:** Code
**Name:** `Fetch Sleeper Data`

**Instructions:**
1. Open the file `sleeper-api.js`
2. Copy **ALL** the code
3. Paste it into this node
4. At the **bottom**, add this code:

```javascript
// Add this at the bottom after the SleeperAPI class

const config = $input.first().json.config;
const sleeper = new SleeperAPI();

async function fetchData() {
  const user = await sleeper.getUser(config.sleeper_username);
  const roster = await sleeper.getUserRoster(config.league_id, user.user_id);
  const allPlayers = await sleeper.getAllPlayers();
  const trendingAdds = await sleeper.getTrendingPlayersWithDetails('add', allPlayers, 30);
  const trendingDrops = await sleeper.getTrendingPlayersWithDetails('drop', allPlayers, 30);
  const league = await sleeper.getLeague(config.league_id);

  return { user, roster, allPlayers, trendingAdds, trendingDrops, league };
}

const sleeperData = await fetchData();
return [{ json: { config, sleeperData } }];
```

**Click:** Execute Node ✓ (this may take 10-15 seconds)

---

#### Node 4: Analyze Team (Code)

**Type:** Code
**Name:** `Analyze Team`

**Copy from:** `n8n-workflow-complete.js` → **NODE 4** section
**Paste:** All of it into this node

**Click:** Execute Node ✓

---

#### Node 5: Generate Email (Code)

**Type:** Code
**Name:** `Generate Email`

**Copy from:** `n8n-workflow-complete.js` → **NODE 5** section
**Paste:** All of it into this node

**Click:** Execute Node ✓

---

#### Node 6: Send Email

**Type:** Send Email (or Gmail if you prefer)

**Settings:**
- **To Email:** `{{ $json.email_to }}`
- **Subject:** `{{ $json.email_subject }}`
- **Email Type:** `HTML`
- **Message (HTML):** `{{ $json.email_html }}`

**Configure Credentials:**

**For Gmail:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Create an "App Password"
4. Use that password in n8n credentials

**For SMTP:**
- Host: `smtp.gmail.com`
- Port: `587`
- User: your email
- Password: your app password

**Click:** Execute Node ✓

---

## Step 3: Test It! (1 minute)

1. Click **"Execute Workflow"** at the top
2. Watch each node turn green ✓
3. Check your email inbox
4. You should receive your first fantasy report!

## Step 4: Activate Schedule (30 seconds)

1. Click the **"Inactive"** toggle at the top
2. It will turn to **"Active"**
3. Done! You'll now get daily emails automatically

## Troubleshooting

### "Failed to fetch user"
- ✅ Double-check your Sleeper username (it's case-sensitive!)
- ✅ Make sure you have at least one active league this season

### "Email not sending"
- ✅ Use an App Password, not your regular Gmail password
- ✅ Make sure 2FA is enabled on Gmail
- ✅ Check the email address is correct

### "Node execution failed"
- ✅ Click on the red node to see the error message
- ✅ Make sure you copied ALL the code from the files
- ✅ Check for missing commas or quotes

### Still stuck?
- Check the full guide: `n8n-workflow-guide.md`
- Review the README: `README.md`

## Next Steps

### Want to customize it?

**Change when it runs:**
- Edit the Schedule Trigger node
- Try: Tuesday 8 AM (waiver day) or Sunday 10 AM (gameday)

**Add Reddit analysis:**
- In Node 3 config, set `include_reddit_analysis: true`
- This makes it slower but gives better insights

**Analyze multiple leagues:**
- Duplicate the workflow
- Change the `league_id` in the config

### Want the chat interface?

1. Open `fantasy-chat.html` in a code editor
2. Update line 300 with your n8n webhook URL
3. Host it on any web server or open locally
4. Ask questions anytime!

## Example Email You'll Receive

```
🏈 Fantasy Football Weekly Report
League: My League | 1.0 PPR
Generated: Nov 3, 2024, 8:00 AM

🔥 Top Waiver Wire Pickups

Player              Pos  Team  Trending  Reddit    Priority
──────────────────────────────────────────────────────────
Zach Charbonnet    RB   SEA   +234      POSITIVE  HIGH ⚠️
Rashid Shaheed     WR   NO    +187      POSITIVE  MEDIUM
Tank Dell          WR   HOU   +165      NEUTRAL   MEDIUM

⚠️ = Position need identified

⬇️ Drop Candidates

Player              Position  Team  Status        Reason
─────────────────────────────────────────────────────────
Darrell Henderson  RB        LAR   Questionable  Trending drop (143 leagues)

💺 Sit/Start Recommendations

✅ Your current lineup looks good!

📊 Roster Summary
QB: 2 ✅  RB: 5 ✅  WR: 4 ⚠️ Need depth  TE: 2 ✅
```

## Success Checklist

- ✅ Workflow created in n8n
- ✅ All 6 nodes added and connected
- ✅ Config updated with my Sleeper info
- ✅ Email credentials configured
- ✅ Test execution successful
- ✅ Received first email
- ✅ Schedule activated

## What Happens Now?

**Every day at 8 AM** (or your chosen time):
1. System fetches your Sleeper roster
2. Gets trending adds/drops from all leagues
3. Scrapes r/fantasyfootball for player buzz (optional)
4. Analyzes your team and finds opportunities
5. Emails you a detailed report

**You'll never miss a waiver wire gem again!** 💎

## Pro Tips

1. **Run it Tuesday mornings** when waivers clear for best pickup recommendations
2. **Run it Sunday mornings** for injury updates and sit/start advice
3. **Update `current_week`** in the config each week
4. **Review the email every morning** during your coffee ☕
5. **Act fast** on HIGH priority pickups

## Need Help?

- 📖 Full documentation: `README.md`
- 🔧 Detailed workflow guide: `n8n-workflow-guide.md`
- 💬 Chat interface: `fantasy-chat.html`
- 📝 Complete workflow code: `n8n-workflow-complete.js`

---

**You're all set! Good luck dominating your league! 🏆**
