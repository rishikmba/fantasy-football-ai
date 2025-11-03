# Fantasy Football AI - Clean Setup Guide

**The cleanest way to set this up:** All code on GitHub, minimal code in n8n!

## 🎯 What You're Building

An automated fantasy football analyzer that emails you recommendations every 3 hours:
- 🔥 Top waiver wire pickups
- ⬇️ Players to drop
- 💺 Sit/start alerts for injured players
- 📊 Roster health check

## 📦 How It Works

```
All code lives on GitHub → n8n loads it → Runs analysis → Emails you
```

**Benefits:**
- ✅ Update code on GitHub, all workflows update automatically
- ✅ No code duplication in n8n
- ✅ Version control with Git
- ✅ Easy to maintain

## 🚀 Quick Setup (5 Minutes)

### Step 1: Import Workflow

1. Open n8n
2. Click "..." → "Import from File"
3. Select `n8n-workflow-clean.json`
4. Workflow imported! ✓

### Step 2: Update Your Info

**Edit the "Configuration" node:**

Click on the node and update these 2 lines:

```javascript
owner_id: '1260492147568689152',  // ← Already set for you!
league_id: '1257118081231097856', // ← Already set for you!
email: 'YOUR_EMAIL@example.com',  // ← UPDATE THIS!
```

**That's the ONLY code you need to change!**

### Step 3: Add Email Credentials

Click on "Send Email" node:
- Add your SMTP credentials (Gmail, SendGrid, etc.)
- For Gmail: Use an App Password (see below)

### Step 4: Test It

1. Click "Execute Workflow"
2. Watch each node turn green ✓
3. Check your email!

### Step 5: Activate

Click "Inactive" → "Active" at the top

**Done!** You'll get emails every 3 hours.

---

## 📧 Setting Up Gmail

### Get an App Password

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Create password for "Mail"
5. Copy the 16-character password

### Configure in n8n

In the "Send Email" node:
- **Host:** smtp.gmail.com
- **Port:** 587
- **User:** your.email@gmail.com
- **Password:** [paste app password]
- **Secure:** false

---

## 🎚️ Customization

### Change Schedule

Edit "Every 3 Hours" node:

**Once daily at 8 AM:**
```
0 8 * * *
```

**Tuesday mornings only (waiver day):**
```
0 8 * * 2
```

**Every 6 hours:**
```
0 */6 * * *
```

### Change Recommendations Count

Edit "Configuration" node:
```javascript
max_waiver_recommendations: 10,  // Show top 10 instead of 5
```

---

## 📂 The Code Structure

### Where Everything Lives

```
GitHub Repository
├── fantasy-football-engine.js     ← Main engine (all the logic!)
└── n8n-nodes/
    ├── 01-config.js              ← Config (edit your email)
    ├── 02-fetch-sleeper-data.js  ← Fetch data (no changes)
    ├── 03-analyze-team.js        ← Analyze (no changes)
    ├── 04-generate-email.js      ← Email HTML (no changes)
    └── README.md                 ← How it works
```

### n8n Workflow

```
1. Schedule Trigger → Every 3 hours
2. HTTP Request     → Loads fantasy-football-engine.js from GitHub
3. Code: Config     → Your settings (EDIT THIS)
4. Code: Fetch      → Gets Sleeper data (no changes)
5. Code: Analyze    → Generates recommendations (no changes)
6. Code: Email      → Creates HTML email (no changes)
7. Send Email       → Delivers to inbox
```

---

## 🔧 Advanced: Updating the Code

Want to change how the analysis works?

### Edit on GitHub

1. Go to `fantasy-football-engine.js` on GitHub
2. Edit the file (e.g., change priority scoring)
3. Commit changes
4. **Next n8n run automatically uses the new code!**

### Example: Change Priority Scoring

Find this function in `fantasy-football-engine.js`:
```javascript
function calculatePickupPriority(trendingData, positionNeed, redditAnalysis) {
  let score = 0;
  score += Math.min(trendingData.count / 10, 50);  // ← Change this
  if (positionNeed) score += 30;  // ← Or this
  return score;
}
```

Commit to GitHub → Done! All workflows update automatically.

---

## 🐛 Troubleshooting

### "fetch is not defined"

✅ **Fixed!** The code now uses n8n's `$request` helper.

Make sure this line exists in your node:
```javascript
const sleeper = new SleeperAPI($request);  // ← Pass $request
```

### "Cannot find node 'Load Code from GitHub'"

Your HTTP Request node must be named exactly "Load Code from GitHub"

### Email not sending

- Check SMTP credentials
- For Gmail: Use App Password, not regular password
- Make sure 2FA is enabled

### No recommendations found

- Normal! Some days there aren't actionable recommendations
- Check that your roster is up to date
- Verify league_id and owner_id are correct

---

## 📊 What You'll Get

### Sample Email

```
🏈 Fantasy Football Weekly Report
League: My League | 1.0 PPR
Generated: Nov 3, 2024, 12:00 PM

🔥 TOP WAIVER WIRE PICKUPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Player              Pos  Team  Trending  Priority
──────────────────────────────────────────────────
Zach Charbonnet    RB   SEA   +234      HIGH ⚠️
Rashid Shaheed     WR   NO    +187      MEDIUM

⬇️ DROP CANDIDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Player              Position  Status      Reason
──────────────────────────────────────────────────
Darrell Henderson  RB        Out         Injured: Out

💺 SIT/START RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Your current lineup looks good!

📊 ROSTER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QB: 2 ✅  RB: 5 ✅  WR: 4 ⚠️ Need depth  TE: 2 ✅
```

---

## ✨ Benefits of This Approach

### Before (messy)
- ❌ Code embedded in 5+ n8n nodes
- ❌ Hard to update - must edit each node
- ❌ No version control
- ❌ Code duplication everywhere

### After (clean)
- ✅ All code on GitHub in one file
- ✅ Easy to update - edit GitHub once
- ✅ Version control with Git
- ✅ n8n nodes are tiny - just load & execute
- ✅ DRY principle (Don't Repeat Yourself)

---

## 🎯 Next Steps

1. ✅ Import workflow
2. ✅ Update email in Configuration node
3. ✅ Add SMTP credentials
4. ✅ Test workflow
5. ✅ Activate schedule
6. ✅ Dominate your league! 🏆

---

## 📚 More Resources

- `n8n-nodes/README.md` - Detailed node documentation
- `README.md` - Full project documentation
- `fantasy-football-engine.js` - The main code

---

## 💬 Support

Having issues? Check:
1. Node names match exactly (especially "Load Code from GitHub")
2. Configuration node has your correct email
3. SMTP credentials are correct
4. GitHub URL is accessible

**Pro tip:** Change the schedule to run once daily at 8 AM to avoid email overload!

```
0 8 * * *  ← Add this to Schedule Trigger
```

---

**You're all set! Good luck crushing your fantasy league!** 🏈🏆
