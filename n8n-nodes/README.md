# n8n Node Scripts

These are the **minimal code snippets** for each n8n Code node. All the heavy logic is in `fantasy-football-engine.js` on GitHub.

## How It Works

```
1. n8n loads fantasy-football-engine.js from GitHub (HTTP Request node)
2. Each Code node runs eval() to load the engine
3. Nodes call functions from the engine
4. No code duplication - everything references GitHub!
```

## The Files

### 01-config.js
**Configuration node** - Your settings (owner_id, league_id, email)
- ✏️ **YOU MUST EDIT THIS** - Update your email and IDs
- Copy this entire file into your n8n "Configuration" Code node

### 02-fetch-sleeper-data.js
**Fetch Sleeper Data node** - Gets your roster and trending players
- ✅ **NO CHANGES NEEDED** - Works as-is
- Copy this entire file into your n8n "Fetch Sleeper Data" Code node

### 03-analyze-team.js
**Analyze Team node** - Generates add/drop/sit/start recommendations
- ✅ **NO CHANGES NEEDED** - Works as-is
- Copy this entire file into your n8n "Analyze Team" Code node

### 04-generate-email.js
**Generate Email node** - Creates the HTML email report
- ✅ **NO CHANGES NEEDED** - Works as-is
- Copy this entire file into your n8n "Generate Email" Code node

## n8n Workflow Structure

```
┌─────────────────────┐
│ Schedule Trigger    │  Every 3 hours (or your schedule)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ HTTP Request        │  Fetches fantasy-football-engine.js from GitHub
│                     │  URL: https://raw.githubusercontent.com/.../fantasy-football-engine.js
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code: Config        │  01-config.js (edit your email/IDs)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code: Fetch Data    │  02-fetch-sleeper-data.js (no changes)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code: Analyze       │  03-analyze-team.js (no changes)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Code: Generate Email│  04-generate-email.js (no changes)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Send Email          │  Built-in n8n node
└─────────────────────┘
```

## Setup Instructions

### Option 1: Manual Setup (Copy/Paste)

1. Create a new n8n workflow
2. Add nodes in this order:
   - Schedule Trigger
   - HTTP Request (name it "Load Code from GitHub")
   - Code node (name it "Configuration")
   - Code node (name it "Fetch Sleeper Data")
   - Code node (name it "Analyze Team")
   - Code node (name it "Generate Email")
   - Send Email node

3. Configure HTTP Request node:
   ```
   Method: GET
   URL: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/claude/sleeper-fantasy-football-api-011CUk8Lz7fGE4jt5xKapGiD/fantasy-football-engine.js
   ```

4. Copy code into each Code node:
   - Configuration: Copy contents of `01-config.js` (EDIT YOUR EMAIL!)
   - Fetch Sleeper Data: Copy contents of `02-fetch-sleeper-data.js`
   - Analyze Team: Copy contents of `03-analyze-team.js`
   - Generate Email: Copy contents of `04-generate-email.js`

5. Configure Send Email node:
   - To: `{{ $json.email_to }}`
   - Subject: `{{ $json.email_subject }}`
   - Email Type: HTML
   - Message: `{{ $json.email_html }}`

### Option 2: Import Workflow JSON (Coming Soon)

Import `n8n-workflow.json` directly into n8n.

## Benefits of This Approach

✅ **All logic on GitHub** - Easy to update in one place
✅ **Minimal code in n8n** - Just loads and executes
✅ **Version control** - GitHub tracks all changes
✅ **Easy testing** - Update GitHub, re-run workflow
✅ **No code duplication** - DRY principle

## Updating the Code

**To change analysis logic:**
1. Edit `fantasy-football-engine.js` on GitHub
2. Commit changes
3. Next n8n run automatically uses new code!

**To change your settings:**
1. Edit the Configuration node in n8n
2. Update email, owner_id, etc.
3. Save workflow

## Troubleshooting

### "fetch is not defined"
✅ **Fixed!** The engine now uses n8n's `$request` helper.

Make sure you're passing `$request` to the constructor:
```javascript
const sleeper = new SleeperAPI($request);  // ← Correct!
```

### "Cannot find node 'Load Code from GitHub'"
Make sure your HTTP Request node is named exactly "Load Code from GitHub"

### "eval is not defined"
Make sure you're using a **Code node**, not a Function node.

## Questions?

Check the main `README.md` or `N8N-IMPORT-GUIDE.md` for detailed setup instructions.
