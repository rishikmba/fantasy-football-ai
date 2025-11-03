# n8n Workflow Setup Guide

## Overview

This guide will help you set up an automated fantasy football analysis workflow in n8n that:
- Runs daily or weekly on a schedule
- Analyzes your Sleeper team
- Scrapes r/fantasyfootball for trending player discussions
- Generates add/drop and sit/start recommendations
- Emails you a comprehensive report

## Prerequisites

1. **n8n instance** (cloud or self-hosted)
2. **Sleeper account** with your league ID
3. **Email service** (Gmail, SendGrid, or any SMTP)
4. **Supabase account** (optional, for caching player data)

## Workflow Structure

```
Schedule Trigger (Daily 8 AM)
  ↓
Load Configuration
  ↓
Fetch Sleeper Data (Code Node)
  ↓
Scrape Reddit Data (Code Node)
  ↓
Run Analysis (Code Node)
  ↓
Generate Email HTML
  ↓
Send Email
```

## Step-by-Step Setup

### 1. Create New Workflow in n8n

1. Open your n8n instance
2. Create a new workflow
3. Name it "Fantasy Football Daily Analyzer"

### 2. Add Schedule Trigger

**Node:** Schedule Trigger
**Settings:**
- Trigger Interval: Every Day
- Trigger Time: 08:00 (or your preferred time)
- Timezone: Your timezone

**When to run:**
- **Daily during the season:** For waiver wire pickups (Tuesday/Wednesday mornings)
- **Weekly:** Sunday mornings for sit/start decisions

### 3. Add Configuration Node

**Node:** Code Node
**Name:** "Load Configuration"

```javascript
// Configuration - UPDATE THESE VALUES
const config = {
  // Your Sleeper username or user ID
  sleeper_username: 'YOUR_SLEEPER_USERNAME',

  // Your Sleeper league ID (get from league URL)
  league_id: 'YOUR_LEAGUE_ID',

  // Current NFL season
  season: '2024',

  // Your email for notifications
  email: 'your.email@example.com',

  // Analysis preferences
  max_waiver_recommendations: 5,
  max_reddit_searches: 10,
  include_reddit_analysis: true,

  // Current NFL week (update weekly or use API to auto-detect)
  current_week: 10
};

return [{
  json: { config }
}];
```

### 4. Add Sleeper API Data Fetcher

**Node:** Code Node
**Name:** "Fetch Sleeper Data"

Paste the contents of `sleeper-api.js` and add:

```javascript
// Get config from previous node
const config = $input.first().json.config;

const sleeper = new SleeperAPI();

async function fetchSleeperData() {
  try {
    // Get user
    const user = await sleeper.getUser(config.sleeper_username);

    // Get roster
    const roster = await sleeper.getUserRoster(config.league_id, user.user_id);

    // Get all players
    const allPlayers = await sleeper.getAllPlayers();

    // Get trending adds and drops
    const trendingAdds = await sleeper.getTrendingPlayersWithDetails('add', allPlayers, 30);
    const trendingDrops = await sleeper.getTrendingPlayersWithDetails('drop', allPlayers, 30);

    // Get available players
    const availablePlayers = await sleeper.getAvailablePlayers(config.league_id, allPlayers);

    // Get league info
    const league = await sleeper.getLeague(config.league_id);

    return {
      user,
      roster,
      allPlayers,
      trendingAdds,
      trendingDrops,
      availablePlayers,
      league
    };
  } catch (error) {
    throw new Error('Sleeper API Error: ' + error.message);
  }
}

const sleeperData = await fetchSleeperData();

return [{
  json: {
    config,
    sleeperData
  }
}];
```

### 5. Add Reddit Scraper

**Node:** Code Node
**Name:** "Scrape Reddit Data"

Paste the contents of `reddit-scraper.js` and add:

```javascript
const inputData = $input.first().json;
const config = inputData.config;
const sleeperData = inputData.sleeperData;

const reddit = new RedditScraper();

async function scrapeRedditData() {
  try {
    // Get hot posts from r/fantasyfootball
    const hotPosts = await reddit.getHotPosts(25);

    // Get trending topics
    const trendingTopics = await reddit.getTrendingTopics();

    // Analyze trending add players on Reddit
    const playerAnalyses = [];

    if (config.include_reddit_analysis) {
      // Limit to top 5 trending adds to avoid rate limiting
      for (const trending of sleeperData.trendingAdds.slice(0, 5)) {
        try {
          const analysis = await reddit.analyzePlayer(trending.name);
          playerAnalyses.push(analysis);

          // Delay to avoid Reddit rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.error(`Error analyzing ${trending.name}:`, err.message);
        }
      }
    }

    return {
      hotPosts,
      trendingTopics,
      playerAnalyses
    };
  } catch (error) {
    throw new Error('Reddit Scraper Error: ' + error.message);
  }
}

const redditData = await scrapeRedditData();

return [{
  json: {
    config,
    sleeperData,
    redditData
  }
}];
```

### 6. Add Analysis Engine

**Node:** Code Node
**Name:** "Run Analysis"

Paste the contents of `analysis-engine.js` and add:

```javascript
// Also paste SleeperAPI and RedditScraper classes here, or load from previous nodes

const inputData = $input.first().json;
const config = inputData.config;

const sleeper = new SleeperAPI();
const reddit = new RedditScraper();
const analyzer = new AnalysisEngine(sleeper, reddit);

async function runAnalysis() {
  try {
    const analysis = await analyzer.analyzeTeam(
      inputData.sleeperData.user.user_id,
      config.league_id
    );

    return analysis;
  } catch (error) {
    throw new Error('Analysis Error: ' + error.message);
  }
}

const analysis = await runAnalysis();

return [{
  json: {
    config,
    analysis
  }
}];
```

### 7. Add Email Generator

**Node:** Code Node
**Name:** "Generate Email"

```javascript
// Also paste AnalysisEngine class here to use generateEmailSummary method

const inputData = $input.first().json;
const config = inputData.config;
const analysis = inputData.analysis;

const analyzer = new AnalysisEngine(null, null);
const emailHtml = analyzer.generateEmailSummary(analysis);

// Create email subject
const subject = `🏈 Fantasy Football Report - Week ${config.current_week}`;

return [{
  json: {
    email_to: config.email,
    email_subject: subject,
    email_html: emailHtml
  }
}];
```

### 8. Add Email Sender

**Node:** Send Email (or Gmail/SendGrid node)

**Settings:**
- **To Email:** `{{ $json.email_to }}`
- **Subject:** `{{ $json.email_subject }}`
- **Email Format:** HTML
- **HTML:** `{{ $json.email_html }}`

**For Gmail:**
1. Enable "Less secure app access" or use App Password
2. Configure SMTP settings in n8n credentials

**For SendGrid:**
1. Get API key from SendGrid
2. Add SendGrid credentials in n8n
3. Use SendGrid node instead

### 9. Add Error Handling (Optional but Recommended)

**Node:** Error Trigger
- Add an error trigger to catch failures
- Send yourself an error notification email

## Workflow Variations

### Variation 1: Interactive Chat (Already Built)

Use the existing `fantasy-chat.html` for on-demand analysis:
- Keep the webhook trigger
- User asks questions via chat interface
- Returns analysis in real-time

### Variation 2: Pre-Waiver Analysis (Tuesday Morning)

Schedule for Tuesday 8 AM (when waivers clear):
```javascript
Schedule: Tuesday, 08:00
Focus: Fresh waiver pickups and drops
```

### Variation 3: Weekend Sit/Start Helper (Sunday Morning)

Schedule for Sunday 10 AM (before games):
```javascript
Schedule: Sunday, 10:00
Focus: Injury updates and sit/start decisions
```

## Advanced Features

### A. Store Analysis in Supabase

Add a Supabase node after analysis:
```javascript
Table: fantasy_analyses
Columns: timestamp, league_id, analysis_json, recommendations
```

### B. Add Claude AI Enhancement

After the basic analysis, add a Code node with Claude API:
```javascript
const claudePrompt = `
Based on this fantasy football analysis:
${JSON.stringify(analysis, null, 2)}

Provide expert insights on:
1. Which waiver pickup has the highest upside?
2. Any sleeper picks not on the trending list?
3. Trade opportunities based on roster composition?
`;

// Call Claude API
// Return enhanced recommendations
```

### C. Multi-League Support

Modify config to support multiple leagues:
```javascript
leagues: [
  { id: 'league_id_1', name: 'Main League' },
  { id: 'league_id_2', name: 'Work League' }
]
```

Loop through each league in the workflow.

## Testing

### Test Individual Nodes

1. Click "Execute Node" on each node
2. Check output in the node panel
3. Verify data structure

### Test Full Workflow

1. Click "Execute Workflow"
2. Monitor each node's execution
3. Check your email for the report

### Troubleshooting

**Issue:** Sleeper API returns 404
- **Fix:** Verify username and league_id are correct

**Issue:** Reddit rate limiting
- **Fix:** Increase delays between requests to 3-5 seconds

**Issue:** Email not sending
- **Fix:** Check email credentials and SMTP settings

## Schedule Recommendations

### During NFL Season:

**Sunday, 9:00 AM** - Injury updates and sit/start
**Tuesday, 8:00 AM** - Waiver wire analysis
**Thursday, 7:00 PM** - Thursday Night Football lineup check

### Off-Season:

Pause the workflow or reduce to weekly

## Maintenance

- **Update current_week** in config each week
- **Monitor API rate limits** (Sleeper: 1000/min, Reddit: ~60/min)
- **Review recommendations** and adjust scoring logic as needed

## Next Steps

1. Import the workflow
2. Update configuration with your details
3. Test with manual execution
4. Enable schedule trigger
5. Check your email for the first report!

## Support

- Sleeper API Docs: https://docs.sleeper.com/
- Reddit API: https://www.reddit.com/dev/api
- n8n Docs: https://docs.n8n.io/

---

**Pro Tip:** Start with the chat interface (`fantasy-chat.html`) to test the analysis interactively before setting up automated emails!
