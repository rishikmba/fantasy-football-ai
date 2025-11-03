# n8n Workflow Import Guide 🚀

This guide will help you import the pre-configured Fantasy Football workflow into n8n in **under 5 minutes**.

## What You Get

A complete workflow with **7 nodes** already configured:
1. ✅ Schedule Trigger (Every 3 hours)
2. ✅ Load Code from GitHub (automatically fetches latest code from main branch)
3. ✅ Configuration (pre-configured with your IDs)
4. ✅ Fetch Sleeper Data
5. ✅ Analyze Team
6. ✅ Generate Email
7. ✅ Send Email

**Benefits of using GitHub for code:**
- Update code in one place (GitHub), all workflows update automatically
- No need to manually update code in multiple n8n nodes
- Easy version control and rollback
- Share code across multiple workflows
- Code is fetched from the main branch for stability

---

## Prerequisites

✅ n8n account (get free at [n8n.cloud](https://n8n.cloud))
✅ Email credentials (Gmail app password or SMTP)
✅ 5 minutes

---

## Step 1: Import the Workflow (1 minute)

### Option A: Direct Import (Easiest)

1. **Open n8n**
2. **Click "+" to create a new workflow**
3. **Click the "..." menu** (top right)
4. **Select "Import from File"**
5. **Choose** `n8n-workflow.json` from this repository
6. **Click "Import"**

### Option B: Copy-Paste

1. **Open** the file `n8n-workflow.json`
2. **Copy** all the content
3. **In n8n**, click "..." menu → "Import from Clipboard"
4. **Paste** and click "Import"

✅ **Done!** You should now see 7 connected nodes.

---

## Step 2: Update Your Email (30 seconds)

1. **Click on the "Configuration" node** (the 3rd node)
2. **Find the line:**
   ```javascript
   email: 'YOUR_EMAIL@example.com',  // ← UPDATE THIS!
   ```
3. **Replace** `YOUR_EMAIL@example.com` with your actual email
4. **Click "Execute Node"** to test ✓

**Your configuration already has:**
- ✅ `owner_id: '1260492147568689152'` (your ID)
- ✅ `league_id: '1257118081231097856'` (your league)

---

## Step 3: Configure Email Credentials (2 minutes)

### For Gmail (Recommended):

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "n8n Fantasy Football"
   - **Copy the password** (16 characters)

3. **In n8n:**
   - Click on the **"Send Email"** node (last node)
   - Click **"Create New Credential"** next to SMTP
   - Enter:
     - **User:** your.email@gmail.com
     - **Password:** [paste the app password]
     - **Host:** smtp.gmail.com
     - **Port:** 587
     - **SSL/TLS:** true
   - Click **"Save"**

### For Other Email Providers:

**Outlook/Office 365:**
- Host: `smtp.office365.com`
- Port: `587`

**Yahoo:**
- Host: `smtp.mail.yahoo.com`
- Port: `587`

**Custom SMTP:**
- Use your provider's SMTP settings

---

## Step 4: Test the Workflow (1 minute)

1. **Click "Execute Workflow"** (top right)
2. **Watch each node turn green** ✓
3. **Check your email** - you should receive your first report!

**Troubleshooting:**
- If a node fails, click on it to see the error
- Red node = error, green = success
- Check the console logs in each node

---

## Step 5: Activate the Schedule (30 seconds)

1. **Click the "Inactive" toggle** at the top
2. It will turn to **"Active"** 🟢
3. **Done!** You'll now get emails every 3 hours

**Note:** Running every 3 hours means ~8 emails per day. You may want to adjust the schedule (see Customization Options below).

---

## Customization Options

### Change the Schedule

**Click on "Every 3 Hours" node:**

**Current setting (Every 3 hours):**
```
Cron Expression: 0 */3 * * *
```

**For Daily at 8 AM only (Recommended):**
```
Cron Expression: 0 8 * * *
```

**For Tuesday at 8 AM (Waiver Day):**
```
Cron Expression: 0 8 * * 2
```

**For Sunday Morning (Gameday):**
```
Cron Expression: 0 9 * * 0
```

**For every 6 hours (4 emails/day):**
```
Cron Expression: 0 */6 * * *
```

### Update Current Week

**In "Configuration" node**, change:
```javascript
current_week: 10,  // ← Update this weekly
```

### Enable Reddit Analysis

**In "Configuration" node**, change:
```javascript
include_reddit_analysis: true  // Makes it slower but more insightful
```

**Note:** Reddit analysis is currently disabled in the analysis code for performance. To enable it fully, you'll need to update the `fantasy-football-engine.js` file on GitHub.

### Change Number of Recommendations

**In "Configuration" node**, change:
```javascript
max_waiver_recommendations: 5,  // Show top 5 pickups
```

---

## How the GitHub Integration Works

### The Magic of GitHub-Hosted Code

**Node 2: "Load Code from GitHub"** fetches the latest code from:
```
https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/main/fantasy-football-engine.js
```

This means:
- ✅ All your code is in ONE file on GitHub
- ✅ Update the code ONCE on GitHub, all workflows update automatically
- ✅ No need to manually update 5+ code nodes
- ✅ Easy to version control and rollback
- ✅ Can share the same code across multiple leagues/workflows

### Making Changes to the Code

**To update the analysis logic:**

1. **Edit** `fantasy-football-engine.js` on GitHub
2. **Commit** the changes
3. **That's it!** Next time your workflow runs, it will use the new code

**Example: Change priority scoring**

In `fantasy-football-engine.js`, find the `calculatePickupPriority` function:
```javascript
function calculatePickupPriority(trendingData, positionNeed, redditAnalysis) {
  let score = 0;
  score += Math.min(trendingData.count / 10, 50);  // ← Change this
  if (positionNeed) score += 30;  // ← Or this
  return score;
}
```

Commit to GitHub, and your next workflow run will use the new logic!

---

## Workflow Architecture

```
┌─────────────────────┐
│  Schedule Trigger   │  Runs every 3 hours
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load GitHub Code    │  Fetches fantasy-football-engine.js from main branch
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Configuration      │  Your settings (owner_id, league_id, email)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Fetch Sleeper Data  │  Gets roster, trending players, league info
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Analyze Team       │  Generates recommendations
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Generate Email     │  Creates HTML report
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Send Email        │  Delivers to your inbox
└─────────────────────┘
```

---

## Multiple Leagues Setup

Want to analyze multiple leagues?

### Option 1: Duplicate the Workflow

1. Click "..." → "Duplicate Workflow"
2. Update the `league_id` in the Configuration node
3. Activate both workflows

### Option 2: Loop Through Leagues

Modify the Configuration node to include multiple leagues:
```javascript
const config = {
  owner_id: '1260492147568689152',
  leagues: [
    { id: '1257118081231097856', name: 'Main League' },
    { id: 'another_league_id', name: 'Work League' }
  ],
  // ... rest of config
};
```

Then update the analysis nodes to loop through each league.

---

## Troubleshooting

### ❌ "Failed to load code from GitHub"

**Solution:**
- Check that the GitHub URL is correct
- Make sure the file is on the `main` branch
- Verify the file is public (not in a private repo)

### ❌ "Email not sending"

**Solution:**
- Check your SMTP credentials
- For Gmail: Make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on Gmail

### ❌ "Roster not found"

**Solution:**
- Double-check your `owner_id` and `league_id`
- Make sure you're in the league for the current season
- Verify the season is correct ('2024')

### ❌ "Node execution timeout"

**Solution:**
- The Sleeper API might be slow
- Try running the node again
- If it persists, check Sleeper API status

### ❌ "Cannot read property 'json' of undefined"

**Solution:**
- Make sure "Load Code from GitHub" node executed successfully
- Each node depends on the previous one executing first
- Run "Execute Workflow" from the beginning

---

## Advanced Configuration

### Add Custom Filters

In the "Analyze Team" node, you can add custom filtering:

```javascript
// Only show RB and WR recommendations
waiverRecommendations = waiverRecommendations.filter(
  rec => rec.position === 'RB' || rec.position === 'WR'
);
```

### Change Minimum Trending Count

```javascript
// Only show players with 50+ adds
if (trending.count < 50) continue;
```

### Custom Email Styling

Edit the `generateEmailHTML` function in `fantasy-football-engine.js`:

```javascript
function generateEmailHTML(analysis) {
  let html = `
  <style>
    body { background: #yourcolor; }  // ← Customize
    h1 { color: #yourcolor; }         // ← Customize
  </style>
  `;
  // ... rest of function
}
```

---

## Monitoring & Logs

### View Execution History

1. Click "Executions" in the left sidebar
2. See all past runs
3. Click any execution to see detailed logs

### Enable Error Notifications

Add an **Error Trigger** node:
1. Add "Error Trigger" node
2. Connect it to a "Send Email" node
3. Now you'll get notified if the workflow fails

---

## Performance Tips

### Speed Up Execution

1. **Disable Reddit analysis** (it's slow):
   ```javascript
   include_reddit_analysis: false
   ```

2. **Reduce trending player limit**:
   ```javascript
   const trendingAdds = await sleeper.getTrendingPlayersWithDetails('add', allPlayers, 10);  // Instead of 30
   ```

3. **Cache player data** (advanced):
   - Store `allPlayers` in n8n's static data
   - Only refresh once per day

### Reduce API Calls

The workflow is already optimized:
- Only 1 call to get user (skipped if using owner_id)
- 1 call for roster
- 1 call for all players
- 1 call for trending adds
- 1 call for trending drops
- 1 call for league info

**Total: ~5 API calls** (well under Sleeper's 1000/min limit)

---

## Next Steps

✅ **Import workflow** → ✅ **Update email** → ✅ **Test** → ✅ **Activate**

Once active, you'll receive:
- 📧 Every 3 hours: Updated analysis (~8 emails/day)
- 🎯 Actionable recommendations
- 📊 Roster health check
- 🔥 Trending player alerts

**Tip:** Most users prefer to change the schedule to run once daily (8 AM) or only on Tuesday mornings (waiver day) to avoid email overload.

**Good luck dominating your league!** 🏆

---

## Need Help?

- Check the main **README.md** for detailed documentation
- Review **QUICKSTART.md** for manual setup
- See **fantasy-football-engine.js** for code reference
- Open an issue on GitHub if you find bugs

---

## What's Pre-Configured

✅ Your `owner_id`: `1260492147568689152`
✅ Your `league_id`: `1257118081231097856`
✅ Schedule: Every 3 hours (customizable)
✅ Code source: GitHub main branch (auto-updates)
✅ All analysis logic ready to go

**Just add your email and SMTP credentials, then activate!**

**Recommendation:** Change the schedule to run less frequently (e.g., once daily at 8 AM or only on Tuesday mornings) to avoid email overload.
