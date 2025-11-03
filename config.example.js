/**
 * Fantasy Football AI Configuration
 * Copy this file to config.js and update with your personal settings
 */

module.exports = {
  // ===== SLEEPER SETTINGS =====
  sleeper: {
    // OPTION 1: Use your Sleeper username (not display name)
    username: 'YOUR_SLEEPER_USERNAME',

    // OPTION 2: Use your user_id / owner_id directly (faster, skips one API call)
    // Find your user_id in your roster data or league users endpoint
    // If provided, this takes priority over username
    user_id: null, // Example: '123456789012'

    // Your primary league ID (found in the URL when viewing your league)
    // Example: https://sleeper.com/leagues/123456789 -> league_id is "123456789"
    league_id: 'YOUR_LEAGUE_ID',

    // Current NFL season year
    season: '2024',

    // Support for multiple leagues (optional)
    additional_leagues: [
      // { id: 'league_id_2', name: 'Work League' },
      // { id: 'league_id_3', name: 'Friends League' }
    ]
  },

  // ===== EMAIL SETTINGS =====
  email: {
    // Your email address for receiving reports
    recipient: 'your.email@example.com',

    // Email service configuration (for n8n)
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'your.email@example.com',
        pass: 'your-app-password' // Use app password, not regular password
      }
    },

    // Or use SendGrid API key
    sendgrid_api_key: 'YOUR_SENDGRID_API_KEY'
  },

  // ===== ANALYSIS PREFERENCES =====
  analysis: {
    // Number of waiver recommendations to include
    max_waiver_recommendations: 5,

    // Number of drop candidates to show
    max_drop_candidates: 3,

    // Include Reddit sentiment analysis (slower but more insightful)
    include_reddit_analysis: true,

    // Number of players to analyze on Reddit
    max_reddit_searches: 10,

    // Delay between Reddit API calls (milliseconds)
    reddit_delay_ms: 2000,

    // Minimum trending count to consider a player
    min_trending_adds: 10,

    // Positions to prioritize (based on league settings)
    position_priorities: {
      QB: 2,  // Target 2 QBs
      RB: 5,  // Target 5 RBs
      WR: 5,  // Target 5 WRs
      TE: 2,  // Target 2 TEs
      K: 1,   // Target 1 K
      DEF: 1  // Target 1 DEF
    }
  },

  // ===== SCHEDULE SETTINGS =====
  schedule: {
    // Current NFL week (update weekly, or auto-detect via API)
    current_week: 10,

    // When to run analysis
    // Sunday morning: injury updates and sit/start
    sunday_time: '09:00',

    // Tuesday morning: waiver wire analysis
    tuesday_time: '08:00',

    // Thursday evening: TNF lineup check
    thursday_time: '19:00',

    // Enable/disable specific days
    run_sunday: true,
    run_tuesday: true,
    run_thursday: false
  },

  // ===== SUPABASE SETTINGS (Optional) =====
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anon_key: 'YOUR_SUPABASE_ANON_KEY',

    // Table for storing NFL players data
    players_table: 'nfl_players',

    // Table for storing analysis history
    analyses_table: 'fantasy_analyses',

    // Cache duration for player data (hours)
    cache_duration_hours: 24
  },

  // ===== REDDIT SETTINGS =====
  reddit: {
    // Subreddit to monitor
    subreddit: 'fantasyfootball',

    // Number of hot posts to fetch
    hot_posts_limit: 25,

    // Number of top posts to fetch
    top_posts_limit: 25,

    // Time period for top posts
    top_time_period: 'day', // 'hour', 'day', 'week', 'month'

    // Keywords to look for in posts
    keywords: [
      'WDIS', 'Who Do I Start', 'Add/Drop', 'Trade',
      'Waiver Wire', 'Sleeper', 'Breakout', 'ROS'
    ]
  },

  // ===== CLAUDE AI SETTINGS (Optional Enhancement) =====
  claude: {
    // If using Claude API for enhanced analysis
    api_key: 'YOUR_CLAUDE_API_KEY',

    // Model to use
    model: 'claude-sonnet-4.5-20250929',

    // Enable Claude-powered insights
    enable_ai_insights: false,

    // Max tokens for response
    max_tokens: 2000
  },

  // ===== NOTIFICATION PREFERENCES =====
  notifications: {
    // Send email only if there are actionable recommendations
    only_if_recommendations: false,

    // Include full roster in email
    include_full_roster: true,

    // Include trending players even if not relevant to your team
    include_general_trends: true,

    // Send test notification on workflow start
    send_test_notification: false
  },

  // ===== ADVANCED SETTINGS =====
  advanced: {
    // API rate limiting
    max_api_calls_per_minute: 60,

    // Retry settings for failed API calls
    max_retries: 3,
    retry_delay_ms: 1000,

    // Logging level: 'debug', 'info', 'warn', 'error'
    log_level: 'info',

    // Cache player data locally
    enable_local_cache: true,

    // Cache file path
    cache_file_path: './cache/players.json'
  }
};
