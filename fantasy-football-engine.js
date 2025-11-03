/**
 * Fantasy Football Analysis Engine - Complete Module
 * This file contains all the classes and functions needed for the n8n workflow
 * Designed to be fetched from GitHub and executed in n8n Code nodes
 *
 * GitHub URL: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/main/fantasy-football-engine.js
 */

// ============================================================================
// SLEEPER API CLASS
// ============================================================================

class SleeperAPI {
  constructor() {
    this.baseUrl = 'https://api.sleeper.app/v1';
  }

  async getUser(usernameOrId) {
    const response = await fetch(`${this.baseUrl}/user/${usernameOrId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getUserId(usernameOrId) {
    if (/^\d{10,}$/.test(usernameOrId)) {
      return usernameOrId;
    }
    const user = await this.getUser(usernameOrId);
    return user.user_id;
  }

  async getUserLeagues(userId, season = '2024') {
    const response = await fetch(`${this.baseUrl}/user/${userId}/leagues/nfl/${season}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getLeague(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch league: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getLeagueRosters(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/rosters`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rosters: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getLeagueUsers(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch league users: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getMatchups(leagueId, week) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/matchups/${week}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch matchups: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getTrendingPlayers(type = 'add', lookbackHours = 24, limit = 25) {
    const response = await fetch(
      `${this.baseUrl}/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch trending players: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getAllPlayers() {
    const response = await fetch(`${this.baseUrl}/players/nfl`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all players: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getTransactions(leagueId, round) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/transactions/${round}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  async getUserRoster(leagueId, userId) {
    const rosters = await this.getLeagueRosters(leagueId);
    const userRoster = rosters.find(roster => roster.owner_id === userId);
    if (!userRoster) {
      throw new Error(`Roster not found for user ${userId} in league ${leagueId}`);
    }
    return userRoster;
  }

  async getAvailablePlayers(leagueId, allPlayers) {
    const rosters = await this.getLeagueRosters(leagueId);
    const rosteredPlayerIds = new Set();

    rosters.forEach(roster => {
      if (roster.players) {
        roster.players.forEach(playerId => rosteredPlayerIds.add(playerId));
      }
    });

    const availablePlayers = {};
    Object.entries(allPlayers).forEach(([playerId, playerData]) => {
      if (!rosteredPlayerIds.has(playerId) && playerData.active) {
        availablePlayers[playerId] = playerData;
      }
    });

    return availablePlayers;
  }

  formatRosterWithNames(roster, allPlayers) {
    const getPlayerName = (playerId) => {
      const player = allPlayers[playerId];
      return player ? `${player.first_name} ${player.last_name} (${player.position} - ${player.team || 'FA'})` : playerId;
    };

    return {
      owner_id: roster.owner_id,
      roster_id: roster.roster_id,
      starters: roster.starters?.map(id => getPlayerName(id)) || [],
      bench: roster.players?.filter(id => !roster.starters?.includes(id)).map(id => getPlayerName(id)) || [],
      taxi: roster.taxi?.map(id => getPlayerName(id)) || [],
      reserve: roster.reserve?.map(id => getPlayerName(id)) || [],
      settings: roster.settings
    };
  }

  async getTrendingPlayersWithDetails(type = 'add', allPlayers, limit = 25) {
    const trending = await this.getTrendingPlayers(type, 24, limit);

    return trending.map(item => {
      const player = allPlayers[item.player_id];
      return {
        player_id: item.player_id,
        count: item.count,
        name: player ? `${player.first_name} ${player.last_name}` : 'Unknown',
        position: player?.position || 'N/A',
        team: player?.team || 'FA',
        full_data: player
      };
    });
  }
}

// ============================================================================
// REDDIT SCRAPER CLASS
// ============================================================================

class RedditScraper {
  constructor() {
    this.subreddit = 'fantasyfootball';
    this.baseUrl = 'https://www.reddit.com';
  }

  async getHotPosts(limit = 25) {
    const url = `${this.baseUrl}/r/${this.subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FantasyFootballAnalyzer/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hot posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  async getTopPosts(time = 'day', limit = 25) {
    const url = `${this.baseUrl}/r/${this.subreddit}/top.json?t=${time}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FantasyFootballAnalyzer/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  async searchPlayer(playerName, limit = 25) {
    const query = encodeURIComponent(playerName);
    const url = `${this.baseUrl}/r/${this.subreddit}/search.json?q=${query}&restrict_sr=1&limit=${limit}&sort=relevance&t=week`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'FantasyFootballAnalyzer/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Failed to search for player: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  parseRedditResponse(data) {
    if (!data || !data.data || !data.data.children) {
      return [];
    }

    return data.data.children.map(child => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        author: post.author,
        score: post.score,
        upvote_ratio: post.upvote_ratio,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: `${this.baseUrl}${post.permalink}`,
        selftext: post.selftext,
        link_flair_text: post.link_flair_text
      };
    });
  }

  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();

    const positiveKeywords = [
      'great', 'good', 'excellent', 'strong', 'best', 'start', 'must start',
      'breakout', 'stud', 'rb1', 'wr1', 'te1', 'league winner', 'smash play',
      'explosive', 'touchdown', 'targets', 'volume', 'opportunity'
    ];

    const negativeKeywords = [
      'bad', 'terrible', 'worst', 'bench', 'sit', 'avoid', 'bust',
      'injured', 'injury', 'questionable', 'doubtful', 'out', 'limited',
      'concerned', 'risky', 'trap', 'fade'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) positiveCount++;
    });

    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) negativeCount++;
    });

    const total = positiveCount + negativeCount;

    return {
      positive_count: positiveCount,
      negative_count: negativeCount,
      sentiment_score: total === 0 ? 0 : (positiveCount - negativeCount) / total,
      sentiment_label: positiveCount > negativeCount ? 'positive' :
                       negativeCount > positiveCount ? 'negative' : 'neutral'
    };
  }

  async analyzePlayer(playerName) {
    const posts = await this.searchPlayer(playerName, 10);

    const allText = posts.map(p => `${p.title} ${p.selftext}`).join(' ');
    const sentiment = this.analyzeSentiment(allText);

    return {
      player_name: playerName,
      posts_found: posts.length,
      total_score: posts.reduce((sum, p) => sum + p.score, 0),
      total_comments: posts.reduce((sum, p) => sum + p.num_comments, 0),
      recent_posts: posts.slice(0, 3),
      sentiment_analysis: sentiment
    };
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeRosterByPosition(playerIds, allPlayers) {
  const positions = {
    QB: [], RB: [], WR: [], TE: [], K: [], DEF: []
  };

  playerIds.forEach(playerId => {
    const player = allPlayers[playerId];
    if (player && player.position && positions[player.position]) {
      positions[player.position].push({
        id: playerId,
        name: `${player.first_name} ${player.last_name}`,
        team: player.team,
        status: player.injury_status || 'active'
      });
    }
  });

  return {
    QB: { count: positions.QB.length, players: positions.QB, need: positions.QB.length < 2 },
    RB: { count: positions.RB.length, players: positions.RB, need: positions.RB.length < 4 },
    WR: { count: positions.WR.length, players: positions.WR, need: positions.WR.length < 4 },
    TE: { count: positions.TE.length, players: positions.TE, need: positions.TE.length < 2 },
    K: { count: positions.K.length, players: positions.K, need: positions.K.length < 1 },
    DEF: { count: positions.DEF.length, players: positions.DEF, need: positions.DEF.length < 1 }
  };
}

function calculatePickupPriority(trendingData, positionNeed, redditAnalysis) {
  let score = 0;
  score += Math.min(trendingData.count / 10, 50);
  if (positionNeed) score += 30;
  if (redditAnalysis && redditAnalysis.sentiment_analysis) {
    const sentimentScore = redditAnalysis.sentiment_analysis.sentiment_score;
    score += (sentimentScore + 1) * 10;
  }
  return score;
}

function generateEmailHTML(analysis) {
  let html = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #00ff88; background: #1a1a1a; padding: 20px; margin: 0 0 20px 0; }
    h2 { color: #0066ff; border-bottom: 2px solid #0066ff; padding-bottom: 5px; margin-top: 30px; }
    .priority-high { background-color: #ffeeee; padding: 15px; border-left: 4px solid #ff0000; margin: 10px 0; }
    .priority-medium { background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffa500; margin: 10px 0; }
    .priority-low { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 10px 0; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .positive { color: #4caf50; font-weight: bold; }
    .negative { color: #ff0000; font-weight: bold; }
    .neutral { color: #888; }
    .info-box { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🏈 Fantasy Football Weekly Report</h1>
  <div class="info-box">
    <p><strong>League:</strong> ${analysis.league_info.name}</p>
    <p><strong>Scoring:</strong> ${analysis.league_info.scoring} PPR</p>
    <p><strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
  </div>

  <h2>🔥 Top Waiver Wire Pickups</h2>`;

  if (analysis.waiver_recommendations.length === 0) {
    html += '<p>No strong waiver recommendations at this time.</p>';
  } else {
    html += '<table><tr><th>Player</th><th>Pos</th><th>Team</th><th>Trending</th><th>Priority</th></tr>';

    analysis.waiver_recommendations.forEach(rec => {
      const priorityClass = rec.priority_score > 70 ? 'priority-high' :
                           rec.priority_score > 40 ? 'priority-medium' : 'priority-low';
      const priorityLabel = rec.priority_score > 70 ? 'HIGH' :
                           rec.priority_score > 40 ? 'MEDIUM' : 'LOW';

      html += `<tr class="${priorityClass}">
        <td><strong>${rec.name}</strong>${rec.position_need ? ' ⚠️' : ''}</td>
        <td>${rec.position}</td>
        <td>${rec.team || 'FA'}</td>
        <td>+${rec.trending_count} adds</td>
        <td><strong>${priorityLabel}</strong></td>
      </tr>`;
    });

    html += '</table>';
    html += '<p style="font-size: 12px; color: #888;">⚠️ = Position need identified</p>';
  }

  html += '<h2>⬇️ Drop Candidates</h2>';

  if (analysis.drop_candidates.length === 0) {
    html += '<p>✅ No obvious drop candidates. Your roster looks healthy!</p>';
  } else {
    html += '<table><tr><th>Player</th><th>Position</th><th>Status</th><th>Reason</th></tr>';

    analysis.drop_candidates.forEach(candidate => {
      html += `<tr>
        <td><strong>${candidate.name}</strong></td>
        <td>${candidate.position}</td>
        <td>${candidate.injury_status}</td>
        <td>${candidate.reason}</td>
      </tr>`;
    });

    html += '</table>';
  }

  html += '<h2>💺 Sit/Start Recommendations</h2>';

  if (analysis.sit_start_recommendations.length === 0) {
    html += '<p>✅ Your current lineup looks good! No injury concerns.</p>';
  } else {
    analysis.sit_start_recommendations.forEach(rec => {
      html += `<div class="priority-high">
        <p><strong>⚠️ ${rec.type.toUpperCase()}: ${rec.player_name}</strong> (${rec.position})</p>
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
    Powered by Sleeper API + Reddit r/fantasyfootball<br>
    Generated automatically by Fantasy Football AI
  </p>
</body>
</html>`;

  return html;
}

// ============================================================================
// EXPORT FOR N8N USE
// ============================================================================

// Make classes and functions available globally when loaded in n8n
if (typeof globalThis !== 'undefined') {
  globalThis.SleeperAPI = SleeperAPI;
  globalThis.RedditScraper = RedditScraper;
  globalThis.analyzeRosterByPosition = analyzeRosterByPosition;
  globalThis.calculatePickupPriority = calculatePickupPriority;
  globalThis.generateEmailHTML = generateEmailHTML;
}

// Also export for Node.js modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SleeperAPI,
    RedditScraper,
    analyzeRosterByPosition,
    calculatePickupPriority,
    generateEmailHTML
  };
}
