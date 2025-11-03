/**
 * Complete n8n Workflow Code
 * This file contains all the code nodes you need for your n8n workflow.
 * Simply copy each section into the corresponding Code node in n8n.
 */

// ============================================================================
// NODE 1: Load Configuration
// ============================================================================
// This node loads your configuration settings
// Place this as a Code node right after your Schedule Trigger

const config = {
  // YOUR SETTINGS - UPDATE THESE!

  // OPTION 1: Use your Sleeper username
  sleeper_username: 'YOUR_SLEEPER_USERNAME',

  // OPTION 2: Use your user_id / owner_id directly (recommended - faster!)
  // If you provide this, it will be used instead of username
  // Find your owner_id by viewing your roster in Sleeper API or league settings
  user_id: null, // Example: '123456789012'

  league_id: 'YOUR_LEAGUE_ID',
  season: '2024',
  email: 'your.email@example.com',
  current_week: 10,

  // Analysis settings
  max_waiver_recommendations: 5,
  max_reddit_searches: 5,  // Keep this low to avoid rate limiting
  include_reddit_analysis: true
};

return [{ json: { config } }];


// ============================================================================
// NODE 2: Fetch Sleeper Data
// ============================================================================
// This node fetches all data from Sleeper API
// Paste SleeperAPI class here, then add:

// Copy the ENTIRE sleeper-api.js file contents here first, then add:

const config = $input.first().json.config;
const sleeper = new SleeperAPI();

async function fetchSleeperData() {
  try {
    // Use user_id if provided, otherwise fetch user by username
    let userId;
    if (config.user_id) {
      console.log('Using provided user_id:', config.user_id);
      userId = config.user_id;
    } else {
      console.log('Fetching user:', config.sleeper_username);
      const user = await sleeper.getUser(config.sleeper_username);
      userId = user.user_id;
      console.log('User ID:', userId);
    }

    console.log('Fetching roster for league:', config.league_id);
    const roster = await sleeper.getUserRoster(config.league_id, userId);

    console.log('Fetching all NFL players...');
    const allPlayers = await sleeper.getAllPlayers();
    console.log('Total players loaded:', Object.keys(allPlayers).length);

    console.log('Fetching trending adds...');
    const trendingAdds = await sleeper.getTrendingPlayersWithDetails('add', allPlayers, 30);

    console.log('Fetching trending drops...');
    const trendingDrops = await sleeper.getTrendingPlayersWithDetails('drop', allPlayers, 30);

    console.log('Fetching available players...');
    const availablePlayers = await sleeper.getAvailablePlayers(config.league_id, allPlayers);
    console.log('Available players:', Object.keys(availablePlayers).length);

    console.log('Fetching league info...');
    const league = await sleeper.getLeague(config.league_id);

    return {
      user: { user_id: userId }, // Return user object with user_id
      roster,
      allPlayers,
      trendingAdds: trendingAdds.slice(0, 15),  // Limit to top 15
      trendingDrops: trendingDrops.slice(0, 10),
      availablePlayersCount: Object.keys(availablePlayers).length,
      league
    };
  } catch (error) {
    console.error('Sleeper API Error:', error);
    throw new Error('Sleeper API Error: ' + error.message);
  }
}

const sleeperData = await fetchSleeperData();
console.log('Sleeper data fetch complete!');

return [{
  json: {
    config,
    sleeperData
  }
}];


// ============================================================================
// NODE 3: Scrape Reddit (OPTIONAL - Can be slow)
// ============================================================================
// This node scrapes Reddit for player discussions
// If you want to skip Reddit analysis, you can skip this node

// Copy the ENTIRE reddit-scraper.js file contents here first, then add:

const inputData = $input.first().json;
const config = inputData.config;
const sleeperData = inputData.sleeperData;

const reddit = new RedditScraper();

async function scrapeRedditData() {
  try {
    console.log('Fetching hot posts from r/fantasyfootball...');
    const hotPosts = await reddit.getHotPosts(15);
    console.log('Hot posts fetched:', hotPosts.length);

    const playerAnalyses = [];

    if (config.include_reddit_analysis) {
      console.log('Analyzing players on Reddit...');

      // Only analyze top 3 trending adds to avoid rate limiting
      const playersToAnalyze = sleeperData.trendingAdds.slice(0, 3);

      for (const trending of playersToAnalyze) {
        try {
          console.log(`Analyzing ${trending.name} on Reddit...`);
          const analysis = await reddit.analyzePlayer(trending.name);
          playerAnalyses.push(analysis);

          // Delay to avoid Reddit rate limiting
          console.log('Waiting 3 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err) {
          console.error(`Error analyzing ${trending.name}:`, err.message);
        }
      }
    }

    return {
      hotPosts: hotPosts.slice(0, 10),
      playerAnalyses
    };
  } catch (error) {
    console.error('Reddit Scraper Error:', error);
    // Don't fail the entire workflow if Reddit fails
    return {
      hotPosts: [],
      playerAnalyses: []
    };
  }
}

const redditData = await scrapeRedditData();
console.log('Reddit scraping complete!');

return [{
  json: {
    config,
    sleeperData,
    redditData
  }
}];


// ============================================================================
// NODE 4: Run Analysis
// ============================================================================
// This node analyzes your team and generates recommendations
// This is a SIMPLIFIED version that doesn't require Reddit data

const inputData = $input.first().json;
const config = inputData.config;
const sleeperData = inputData.sleeperData;
const redditData = inputData.redditData || { playerAnalyses: [] };

function analyzeTeam() {
  try {
    console.log('Starting team analysis...');

    // Analyze roster by position
    const allPlayers = sleeperData.allPlayers;
    const rosterPlayerIds = sleeperData.roster.players || [];
    const starterIds = sleeperData.roster.starters || [];

    const positions = {
      QB: [], RB: [], WR: [], TE: [], K: [], DEF: []
    };

    rosterPlayerIds.forEach(playerId => {
      const player = allPlayers[playerId];
      if (player && player.position && positions[player.position]) {
        positions[player.position].push({
          id: playerId,
          name: `${player.first_name} ${player.last_name}`,
          team: player.team,
          status: player.injury_status || 'active',
          is_starter: starterIds.includes(playerId)
        });
      }
    });

    const positionAnalysis = {
      QB: { count: positions.QB.length, players: positions.QB, need: positions.QB.length < 2 },
      RB: { count: positions.RB.length, players: positions.RB, need: positions.RB.length < 4 },
      WR: { count: positions.WR.length, players: positions.WR, need: positions.WR.length < 4 },
      TE: { count: positions.TE.length, players: positions.TE, need: positions.TE.length < 2 },
      K: { count: positions.K.length, players: positions.K, need: positions.K.length < 1 },
      DEF: { count: positions.DEF.length, players: positions.DEF, need: positions.DEF.length < 1 }
    };

    // Generate waiver recommendations
    const waiverRecommendations = [];
    const rosteredSet = new Set(rosterPlayerIds);

    for (const trending of sleeperData.trendingAdds) {
      if (!rosteredSet.has(trending.player_id)) {
        const player = allPlayers[trending.player_id];
        if (!player || !player.active) continue;
        if (player.injury_status === 'Out' || player.injury_status === 'IR') continue;

        const positionNeed = positionAnalysis[player.position]?.need || false;

        // Calculate priority score
        let priorityScore = 0;
        priorityScore += Math.min(trending.count / 10, 50);
        if (positionNeed) priorityScore += 30;

        // Add Reddit sentiment if available
        const redditAnalysis = redditData.playerAnalyses.find(
          a => a.player_name.toLowerCase().includes(player.last_name.toLowerCase())
        );
        if (redditAnalysis && redditAnalysis.sentiment_analysis) {
          const sentimentScore = redditAnalysis.sentiment_analysis.sentiment_score;
          priorityScore += (sentimentScore + 1) * 10;
        }

        waiverRecommendations.push({
          player_id: trending.player_id,
          name: trending.name,
          position: player.position,
          team: player.team,
          trending_count: trending.count,
          position_need: positionNeed,
          reddit_sentiment: redditAnalysis?.sentiment_analysis?.sentiment_label || 'N/A',
          reddit_posts: redditAnalysis?.posts_found || 0,
          priority_score: Math.round(priorityScore)
        });
      }
    }

    waiverRecommendations.sort((a, b) => b.priority_score - a.priority_score);

    // Find drop candidates
    const dropCandidates = [];

    // Check for injured players
    rosterPlayerIds.forEach(playerId => {
      const player = allPlayers[playerId];
      if (player && (player.injury_status === 'Out' || player.injury_status === 'IR')) {
        dropCandidates.push({
          player_id: playerId,
          name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          team: player.team,
          injury_status: player.injury_status,
          reason: `Injured: ${player.injury_status}`
        });
      }
    });

    // Check for trending drops on your roster
    for (const drop of sleeperData.trendingDrops) {
      if (rosterPlayerIds.includes(drop.player_id)) {
        const player = allPlayers[drop.player_id];
        if (!dropCandidates.find(d => d.player_id === drop.player_id)) {
          dropCandidates.push({
            player_id: drop.player_id,
            name: drop.name,
            position: player.position,
            team: player.team,
            injury_status: player.injury_status || 'active',
            reason: `Trending drop (${drop.count} leagues)`
          });
        }
      }
    }

    // Check for injured starters
    const sitStartRecommendations = [];
    const benchPlayerIds = rosterPlayerIds.filter(id => !starterIds.includes(id));

    for (const starterId of starterIds) {
      const starter = allPlayers[starterId];
      if (!starter) continue;

      if (starter.injury_status && starter.injury_status !== 'active') {
        const benchAlternatives = benchPlayerIds
          .map(id => allPlayers[id])
          .filter(p => p && p.position === starter.position && (!p.injury_status || p.injury_status === 'active'));

        if (benchAlternatives.length > 0) {
          sitStartRecommendations.push({
            type: 'sit',
            player_name: `${starter.first_name} ${starter.last_name}`,
            position: starter.position,
            reason: `Injury: ${starter.injury_status}`,
            alternatives: benchAlternatives.map(p => `${p.first_name} ${p.last_name} (${p.team})`)
          });
        }
      }
    }

    return {
      league_info: {
        name: sleeperData.league.name,
        scoring: sleeperData.league.scoring_settings?.rec || 0,
        total_rosters: sleeperData.league.total_rosters
      },
      position_analysis: positionAnalysis,
      waiver_recommendations: waiverRecommendations.slice(0, config.max_waiver_recommendations),
      drop_candidates: dropCandidates,
      sit_start_recommendations: sitStartRecommendations,
      trending_adds_total: sleeperData.trendingAdds.length,
      trending_drops_total: sleeperData.trendingDrops.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Analysis Error:', error);
    throw new Error('Analysis Error: ' + error.message);
  }
}

const analysis = analyzeTeam();
console.log('Analysis complete!');
console.log('Waiver recommendations:', analysis.waiver_recommendations.length);
console.log('Drop candidates:', analysis.drop_candidates.length);
console.log('Sit/start recommendations:', analysis.sit_start_recommendations.length);

return [{
  json: {
    config,
    analysis
  }
}];


// ============================================================================
// NODE 5: Generate Email HTML
// ============================================================================
// This node creates the HTML email with your recommendations

const inputData = $input.first().json;
const config = inputData.config;
const analysis = inputData.analysis;

function generateEmailHTML(analysis) {
  let html = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; }
    h1 { color: #00ff88; background: #1a1a1a; padding: 20px; margin: 0; }
    h2 { color: #0066ff; border-bottom: 2px solid #0066ff; padding-bottom: 5px; }
    .priority-high { background-color: #ffeeee; padding: 15px; border-left: 4px solid #ff0000; margin: 10px 0; }
    .priority-medium { background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffa500; margin: 10px 0; }
    .priority-low { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 10px 0; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .positive { color: #4caf50; font-weight: bold; }
    .negative { color: #ff0000; font-weight: bold; }
    .neutral { color: #888; }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <h1>🏈 Fantasy Football Weekly Report</h1>
  <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
    <p><strong>League:</strong> ${analysis.league_info.name}</p>
    <p><strong>Scoring:</strong> ${analysis.league_info.scoring} PPR</p>
    <p><strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
  </div>

  <h2>🔥 Top Waiver Wire Pickups</h2>`;

  if (analysis.waiver_recommendations.length === 0) {
    html += '<p>No strong waiver recommendations at this time. Your position groups look solid!</p>';
  } else {
    html += '<table><tr><th>Player</th><th>Pos</th><th>Team</th><th>Trending</th><th>Reddit</th><th>Priority</th></tr>';

    analysis.waiver_recommendations.forEach(rec => {
      const priorityClass = rec.priority_score > 70 ? 'priority-high' :
                           rec.priority_score > 40 ? 'priority-medium' : 'priority-low';
      const priorityLabel = rec.priority_score > 70 ? 'HIGH' :
                           rec.priority_score > 40 ? 'MEDIUM' : 'LOW';

      const sentimentClass = rec.reddit_sentiment === 'positive' ? 'positive' :
                            rec.reddit_sentiment === 'negative' ? 'negative' : 'neutral';

      html += `<tr class="${priorityClass}">
        <td><strong>${rec.name}</strong>${rec.position_need ? ' ⚠️' : ''}</td>
        <td>${rec.position}</td>
        <td>${rec.team || 'FA'}</td>
        <td>+${rec.trending_count}</td>
        <td><span class="${sentimentClass}">${rec.reddit_sentiment.toUpperCase()}</span>${rec.reddit_posts > 0 ? ` (${rec.reddit_posts})` : ''}</td>
        <td><strong>${priorityLabel}</strong></td>
      </tr>`;
    });

    html += '</table>';
    html += '<p style="font-size: 12px; color: #888;">⚠️ = Position need identified</p>';
  }

  html += '<h2>⬇️ Drop Candidates</h2>';

  if (analysis.drop_candidates.length === 0) {
    html += '<p>✅ No obvious drop candidates. Your roster is healthy!</p>';
  } else {
    html += '<table><tr><th>Player</th><th>Position</th><th>Team</th><th>Status</th><th>Reason</th></tr>';

    analysis.drop_candidates.forEach(candidate => {
      html += `<tr>
        <td><strong>${candidate.name}</strong></td>
        <td>${candidate.position}</td>
        <td>${candidate.team || 'FA'}</td>
        <td>${candidate.injury_status}</td>
        <td>${candidate.reason}</td>
      </tr>`;
    });

    html += '</table>';
  }

  html += '<h2>💺 Sit/Start Recommendations</h2>';

  if (analysis.sit_start_recommendations.length === 0) {
    html += '<p>✅ Your current lineup looks good! No injury concerns with your starters.</p>';
  } else {
    analysis.sit_start_recommendations.forEach(rec => {
      html += `<div class="priority-high">
        <p><strong>⚠️ CONSIDER SITTING: ${rec.player_name}</strong> (${rec.position})</p>
        <p><strong>Reason:</strong> ${rec.reason}</p>
        <p><strong>Alternatives:</strong></p>
        <ul>`;

      rec.alternatives.forEach(alt => {
        html += `<li>${alt}</li>`;
      });

      html += '</ul></div>';
    });
  }

  html += `
  <h2>📊 Roster Summary</h2>
  <table>
    <tr><th>Position</th><th>Count</th><th>Status</th></tr>
    <tr><td>QB</td><td>${analysis.position_analysis.QB.count}</td><td>${analysis.position_analysis.QB.need ? '⚠️ Need depth' : '✅ Good'}</td></tr>
    <tr><td>RB</td><td>${analysis.position_analysis.RB.count}</td><td>${analysis.position_analysis.RB.need ? '⚠️ Need depth' : '✅ Good'}</td></tr>
    <tr><td>WR</td><td>${analysis.position_analysis.WR.count}</td><td>${analysis.position_analysis.WR.need ? '⚠️ Need depth' : '✅ Good'}</td></tr>
    <tr><td>TE</td><td>${analysis.position_analysis.TE.count}</td><td>${analysis.position_analysis.TE.need ? '⚠️ Need depth' : '✅ Good'}</td></tr>
  </table>

  <hr style="margin: 30px 0;">
  <p style="color: #888; font-size: 12px; text-align: center;">
    This report was automatically generated by your Fantasy Football AI Assistant.<br>
    Powered by Sleeper API + Reddit r/fantasyfootball + Claude AI
  </p>
</body>
</html>`;

  return html;
}

const emailHTML = generateEmailHTML(analysis);
const emailSubject = `🏈 Fantasy Football Report - Week ${config.current_week} - ${analysis.league_info.name}`;

console.log('Email generated successfully!');

return [{
  json: {
    email_to: config.email,
    email_subject: emailSubject,
    email_html: emailHTML
  }
}];


// ============================================================================
// DONE! Next step: Add a Send Email node
// ============================================================================
// Configure Send Email node with:
// - To: {{ $json.email_to }}
// - Subject: {{ $json.email_subject }}
// - HTML: {{ $json.email_html }}
