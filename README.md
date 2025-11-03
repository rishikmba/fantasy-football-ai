# Fantasy Football AI Assistant 🏈

An automated fantasy football analysis system that monitors your Sleeper league and r/fantasyfootball to provide actionable recommendations on:

- **Waiver Wire Pickups** - Which players to add from free agency
- **Drop Candidates** - Which players to drop from your roster
- **Sit/Start Decisions** - Lineup optimization for gameday
- **Injury Updates** - Real-time status of your players
- **Trending Players** - League-wide add/drop trends

## 🎯 Features

### Automated Analysis
- **Daily email reports** with personalized recommendations
- **Reddit sentiment analysis** from r/fantasyfootball discussions
- **Sleeper API integration** for real-time league data
- **Trending player tracking** (adds/drops across all leagues)
- **Position-based recommendations** tailored to your roster needs

### Interactive Chat Interface
- **Real-time Q&A** powered by Claude AI
- **Live stats lookup** and injury updates
- **Custom queries** like "Should I start X or Y?"
- **Mobile-friendly** interface

### Smart Recommendations
- **Priority scoring** combining trending data + Reddit sentiment
- **Injury monitoring** with drop suggestions
- **Position depth analysis** to identify roster weaknesses
- **PPR scoring optimization** (customizable)

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [n8n Workflow Setup](#n8n-workflow-setup)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Features](#advanced-features)

## 🚀 Quick Start

### What You Need

1. **Sleeper account** - Your fantasy league must be on Sleeper
2. **n8n instance** - For workflow automation (cloud or self-hosted)
3. **Email service** - Gmail, SendGrid, or any SMTP provider

### 5-Minute Setup (Import n8n Workflow)

**EASIEST METHOD** - Import pre-built workflow:

1. **Download** `n8n-workflow.json` from this repo
2. **Import** into n8n (click "..." → Import from File)
3. **Update** your email in the Configuration node
4. **Add** SMTP credentials to Send Email node
5. **Activate** the workflow

**Detailed guide:** See [N8N-IMPORT-GUIDE.md](./N8N-IMPORT-GUIDE.md)

---

### Alternative Setup (Manual)

1. **Get your Sleeper info:**
   - **League ID:** From your league URL: `https://sleeper.com/leagues/YOUR_LEAGUE_ID`
   - **Owner ID (recommended):** See [HOW-TO-FIND-OWNER-ID.md](./HOW-TO-FIND-OWNER-ID.md)
   - **OR Username:** From your Sleeper profile

2. **Clone this repository:**
   ```bash
   git clone https://github.com/yourusername/fantasy-football-ai.git
   cd fantasy-football-ai
   ```

3. **Configure your settings:**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your details
   ```

4. **Manual n8n setup:**
   - See [n8n-workflow-guide.md](./n8n-workflow-guide.md)
   - Copy the code nodes from the guide
   - Configure your schedule

5. **Test the chat interface:**
   - Open `fantasy-chat.html` in your browser
   - Update the webhook URL (line 300)
   - Start asking questions!

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  n8n Workflow (Orchestrator)            │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Schedule │───▶│  Sleeper │───▶│  Reddit  │         │
│  │ Trigger  │    │   API    │    │ Scraper  │         │
│  └──────────┘    └──────────┘    └──────────┘         │
│                        │               │               │
│                        └───────┬───────┘               │
│                                ▼                       │
│                        ┌──────────────┐                │
│                        │   Analysis   │                │
│                        │    Engine    │                │
│                        └──────────────┘                │
│                                │                       │
│                  ┌─────────────┴─────────────┐         │
│                  ▼                           ▼         │
│            ┌──────────┐              ┌──────────┐      │
│            │  Email   │              │  Claude  │      │
│            │  Report  │              │   API    │      │
│            └──────────┘              └──────────┘      │
└─────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
    Your Inbox                  Chat Interface
```

### Core Modules

1. **sleeper-api.js** - Sleeper API integration
   - Fetch user/league/roster data
   - Get trending players
   - Find available players

2. **reddit-scraper.js** - Reddit data collection
   - Scrape r/fantasyfootball
   - Sentiment analysis
   - Player mention tracking

3. **analysis-engine.js** - Recommendation engine
   - Combine data sources
   - Generate add/drop suggestions
   - Create sit/start advice
   - Format email reports

4. **fantasy-chat.html** - Interactive interface
   - Real-time analysis
   - Claude AI integration
   - Mobile-responsive design

## 📦 Installation

### Prerequisites

```bash
# Node.js (for local testing)
node --version  # v16+ required

# n8n (cloud or self-hosted)
npm install n8n -g  # If self-hosting
```

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fantasy-football-ai.git
   cd fantasy-football-ai
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm init -y
   npm install node-fetch  # If using in Node.js environment
   ```

3. **Configure settings:**
   ```bash
   cp config.example.js config.js
   nano config.js  # Edit with your settings
   ```

4. **Set up Supabase (optional but recommended):**
   - Create a Supabase project
   - Import NFL players data
   - Add connection details to config.js

## ⚙️ Configuration

Edit `config.js` with your personal settings:

### Required Settings

```javascript
{
  sleeper: {
    // OPTION 1: Use user_id (recommended - faster!)
    user_id: '123456789012',             // Your Sleeper owner_id

    // OPTION 2: Use username (works but slower)
    username: 'your_sleeper_username',   // Your Sleeper username

    league_id: '123456789',              // Your league ID
    season: '2024'                       // Current season
  },

  email: {
    recipient: 'you@email.com',          // Where to send reports
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'you@gmail.com',
        pass: 'your-app-password'        // Gmail app password
      }
    }
  }
}
```

### Optional Settings

- **Reddit preferences** - Customize subreddit monitoring
- **Analysis tuning** - Adjust recommendation thresholds
- **Schedule** - Set when to run analysis
- **Supabase** - Enable database caching
- **Claude AI** - Add enhanced insights

See [config.example.js](./config.example.js) for all options.

## 🎮 Usage

### Method 1: Automated Email Reports (Recommended)

Set up the n8n workflow to run automatically:

**Sunday Morning (9 AM):**
- Injury updates
- Sit/start recommendations
- Last-minute waiver pickups

**Tuesday Morning (8 AM):**
- Waiver wire analysis
- Top trending adds
- Drop candidates

**Example email:**

```
🏈 Fantasy Football Weekly Report
League: My Awesome League | Scoring: 1.0 PPR

🔥 Top Waiver Wire Pickups
Player              Position  Team  Trending  Reddit    Priority
Zach Charbonnet    RB        SEA   +234      POSITIVE  HIGH
Rashid Shaheed     WR        NO    +187      POSITIVE  MEDIUM

⬇️ Drop Candidates
Player              Position  Status        Reason
Darrell Henderson  RB        Questionable  Heavily dropped (143 leagues)

💺 Sit/Start Recommendations
Your current lineup looks good! No major concerns.
```

### Method 2: Interactive Chat

Use the chat interface for on-demand analysis:

1. Open `fantasy-chat.html` in your browser
2. Ask questions like:
   - "Should I start Tyreek Hill or Stefon Diggs?"
   - "Who should I pick up from waivers?"
   - "Give me injury updates for my team"
3. Get instant AI-powered responses

### Method 3: Manual API Calls

Use the modules directly in your own scripts:

```javascript
const SleeperAPI = require('./sleeper-api.js');
const RedditScraper = require('./reddit-scraper.js');
const AnalysisEngine = require('./analysis-engine.js');

const sleeper = new SleeperAPI();
const reddit = new RedditScraper();
const analyzer = new AnalysisEngine(sleeper, reddit);

// Analyze your team
const analysis = await analyzer.analyzeTeam('user_id', 'league_id');
console.log(analysis);
```

## 🔄 n8n Workflow Setup

Detailed guide: [n8n-workflow-guide.md](./n8n-workflow-guide.md)

### Quick Overview

1. **Create workflow** in n8n
2. **Add Schedule Trigger** (daily or weekly)
3. **Add Code Nodes:**
   - Load Configuration
   - Fetch Sleeper Data
   - Scrape Reddit Data
   - Run Analysis
   - Generate Email
4. **Add Email Node** (Send Email/Gmail/SendGrid)
5. **Test** and activate

### Workflow Templates

Three pre-built templates available:

1. **Daily Analyzer** - Full analysis every day
2. **Waiver Helper** - Tuesday morning waiver focus
3. **Gameday Assistant** - Sunday morning sit/start

## 📚 API Documentation

### SleeperAPI

```javascript
const sleeper = new SleeperAPI();

// Get user data
const user = await sleeper.getUser('username');

// Get roster
const roster = await sleeper.getUserRoster(leagueId, userId);

// Get trending players
const trending = await sleeper.getTrendingPlayers('add', 24, 25);

// Get available players
const available = await sleeper.getAvailablePlayers(leagueId, allPlayers);
```

### RedditScraper

```javascript
const reddit = new RedditScraper();

// Get hot posts
const hotPosts = await reddit.getHotPosts(25);

// Search for player
const posts = await reddit.searchPlayer('Tyreek Hill', 15);

// Analyze player sentiment
const analysis = await reddit.analyzePlayer('Tyreek Hill');
```

### AnalysisEngine

```javascript
const analyzer = new AnalysisEngine(sleeper, reddit);

// Full team analysis
const analysis = await analyzer.analyzeTeam(userId, leagueId);

// Generate email
const emailHtml = analyzer.generateEmailSummary(analysis);
```

See code files for complete API documentation.

## 🔧 Troubleshooting

### Common Issues

**"Failed to fetch user" error:**
- Verify your Sleeper username (not display name)
- Check that you've played in the current season

**"Reddit rate limiting" error:**
- Increase delay between requests (config.reddit.delay_ms)
- Reduce number of players analyzed

**Email not sending:**
- For Gmail: Enable 2FA and create an App Password
- Check SMTP settings match your provider
- Verify email credentials in n8n

**No recommendations found:**
- May not have actionable recommendations every day
- Check that your roster is up to date
- Verify league ID is correct

### Debug Mode

Enable detailed logging:

```javascript
// In config.js
advanced: {
  log_level: 'debug'
}
```

### Rate Limits

- **Sleeper API:** 1000 calls/minute (generous)
- **Reddit API:** ~60 calls/minute (stricter)
- **Solution:** Add delays between Reddit calls

## 🚀 Advanced Features

### 1. Multi-League Support

Analyze multiple leagues in one workflow:

```javascript
config.sleeper.additional_leagues = [
  { id: 'league_id_2', name: 'Work League' },
  { id: 'league_id_3', name: 'Friends League' }
];
```

### 2. Supabase Integration

Cache player data for faster analysis:

```javascript
config.supabase = {
  url: 'your_supabase_url',
  anon_key: 'your_anon_key',
  players_table: 'nfl_players'
};
```

### 3. Claude AI Enhancement

Get deeper insights with Claude:

```javascript
config.claude = {
  api_key: 'your_claude_key',
  enable_ai_insights: true
};
```

### 4. Custom Scoring

Adjust for your league's scoring:

```javascript
// In analysis-engine.js
calculatePickupPriority(trending, positionNeed, redditAnalysis) {
  let score = 0;

  // Your custom scoring logic
  if (player.position === 'RB' && league.settings.ppr) {
    score += 10;  // Boost RBs in PPR
  }

  return score;
}
```

### 5. Trade Analyzer

Extend the engine for trade evaluation:

```javascript
async analyzeTrade(givePlayerIds, receivePlayerIds) {
  // Compare total value
  // Consider position needs
  // Check playoff schedules
  // Return recommendation
}
```

## 📊 Example Analysis Output

```json
{
  "league_info": {
    "name": "My League",
    "scoring": 1.0,
    "roster_positions": ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF"]
  },
  "waiver_recommendations": [
    {
      "name": "Zach Charbonnet",
      "position": "RB",
      "team": "SEA",
      "trending_count": 234,
      "position_need": true,
      "reddit_sentiment": {
        "sentiment_label": "positive",
        "sentiment_score": 0.72
      },
      "priority_score": 85.3
    }
  ],
  "drop_candidates": [
    {
      "name": "Darrell Henderson",
      "position": "RB",
      "injury_status": "Questionable",
      "trending_drop_count": 143,
      "reason": "Heavily dropped league-wide"
    }
  ],
  "sit_start_recommendations": []
}
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- [ ] More sophisticated sentiment analysis
- [ ] Player projection models
- [ ] Trade evaluation engine
- [ ] Playoff schedule analysis
- [ ] Discord notifications
- [ ] Mobile app

## 📝 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- **Sleeper** for their excellent API
- **Reddit** r/fantasyfootball community
- **Anthropic** for Claude AI
- **n8n** for workflow automation

## 📧 Support

- Open an issue on GitHub
- Check [n8n-workflow-guide.md](./n8n-workflow-guide.md)
- Review API documentation in code files

## 🎯 Roadmap

- [x] Sleeper API integration
- [x] Reddit scraping
- [x] Email notifications
- [x] Chat interface
- [ ] Trade analyzer
- [ ] Playoff optimizer
- [ ] Discord bot
- [ ] Mobile app
- [ ] Machine learning predictions

---

**Built with ❤️ for fantasy football managers who want to dominate their leagues!**

*Stop missing out on waiver wire gems. Let AI do the research for you.*
