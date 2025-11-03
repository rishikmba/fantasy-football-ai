/**
 * Fantasy Football Analysis Engine
 * Combines Sleeper API data with Reddit sentiment to generate recommendations
 * Provides add/drop, sit/start, and waiver wire suggestions
 */

class AnalysisEngine {
  constructor(sleeperAPI, redditScraper) {
    this.sleeper = sleeperAPI;
    this.reddit = redditScraper;
    this.playerCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get all players with caching
   * @returns {Promise<Object>} All players object
   */
  async getAllPlayers() {
    const now = Date.now();

    // Return cached data if still valid
    if (this.playerCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return this.playerCache;
    }

    // Fetch fresh data
    this.playerCache = await this.sleeper.getAllPlayers();
    this.cacheTimestamp = now;
    return this.playerCache;
  }

  /**
   * Get comprehensive team analysis
   * @param {string} userId - User's Sleeper ID
   * @param {string} leagueId - League ID
   * @returns {Promise<Object>} Complete team analysis with recommendations
   */
  async analyzeTeam(userId, leagueId) {
    console.log('Starting team analysis...');

    // Fetch all required data
    const [league, roster, allPlayers, trendingAdds, trendingDrops] = await Promise.all([
      this.sleeper.getLeague(leagueId),
      this.sleeper.getUserRoster(leagueId, userId),
      this.getAllPlayers(),
      this.sleeper.getTrendingPlayersWithDetails('add', await this.getAllPlayers(), 30),
      this.sleeper.getTrendingPlayersWithDetails('drop', await this.getAllPlayers(), 30)
    ]);

    // Get available players
    const availablePlayers = await this.sleeper.getAvailablePlayers(leagueId, allPlayers);

    // Format current roster
    const formattedRoster = this.sleeper.formatRosterWithNames(roster, allPlayers);

    // Get roster player IDs
    const rosterPlayerIds = roster.players || [];

    // Analyze roster strength by position
    const positionAnalysis = this.analyzeRosterByPosition(rosterPlayerIds, allPlayers);

    // Get waiver wire recommendations
    const waiverRecommendations = await this.getWaiverRecommendations(
      rosterPlayerIds,
      availablePlayers,
      trendingAdds,
      positionAnalysis
    );

    // Get drop candidates
    const dropCandidates = await this.getDropCandidates(
      rosterPlayerIds,
      allPlayers,
      trendingDrops
    );

    // Get sit/start recommendations for current week
    const sitStartRecommendations = await this.getSitStartRecommendations(
      roster.starters || [],
      rosterPlayerIds,
      allPlayers
    );

    return {
      league_info: {
        name: league.name,
        scoring: league.scoring_settings?.rec || 0, // PPR value
        roster_positions: league.roster_positions
      },
      roster: formattedRoster,
      position_analysis: positionAnalysis,
      waiver_recommendations: waiverRecommendations,
      drop_candidates: dropCandidates,
      sit_start_recommendations: sitStartRecommendations,
      trending_adds: trendingAdds.slice(0, 10),
      trending_drops: trendingDrops.slice(0, 10),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze roster composition by position
   * @param {Array} playerIds - Array of player IDs on roster
   * @param {Object} allPlayers - All players object
   * @returns {Object} Position analysis
   */
  analyzeRosterByPosition(playerIds, allPlayers) {
    const positions = {
      QB: [],
      RB: [],
      WR: [],
      TE: [],
      K: [],
      DEF: []
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

  /**
   * Get waiver wire pickup recommendations
   * @param {Array} rosterPlayerIds - Current roster player IDs
   * @param {Object} availablePlayers - Available players object
   * @param {Array} trendingAdds - Trending adds from Sleeper
   * @param {Object} positionAnalysis - Position needs analysis
   * @returns {Promise<Array>} Array of recommended pickups
   */
  async getWaiverRecommendations(rosterPlayerIds, availablePlayers, trendingAdds, positionAnalysis) {
    const recommendations = [];

    // Focus on trending players who are available
    for (const trending of trendingAdds.slice(0, 15)) {
      if (availablePlayers[trending.player_id]) {
        const player = trending.full_data;

        // Skip if injured or inactive
        if (player.injury_status === 'Out' || !player.active) {
          continue;
        }

        // Determine priority based on position need
        const positionNeed = positionAnalysis[player.position]?.need || false;

        // Get Reddit sentiment for this player
        let redditAnalysis = null;
        try {
          redditAnalysis = await this.reddit.analyzePlayer(`${player.first_name} ${player.last_name}`);
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
          console.error(`Error analyzing ${player.first_name} ${player.last_name} on Reddit:`, err.message);
        }

        recommendations.push({
          player_id: trending.player_id,
          name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          team: player.team,
          trending_count: trending.count,
          position_need: positionNeed,
          reddit_sentiment: redditAnalysis?.sentiment_analysis || null,
          reddit_discussion_count: redditAnalysis?.posts_found || 0,
          priority_score: this.calculatePickupPriority(trending, positionNeed, redditAnalysis)
        });
      }
    }

    // Sort by priority score
    recommendations.sort((a, b) => b.priority_score - a.priority_score);

    return recommendations.slice(0, 10); // Return top 10
  }

  /**
   * Calculate pickup priority score
   * @param {Object} trendingData - Trending player data
   * @param {boolean} positionNeed - Whether position is needed
   * @param {Object} redditAnalysis - Reddit analysis data
   * @returns {number} Priority score
   */
  calculatePickupPriority(trendingData, positionNeed, redditAnalysis) {
    let score = 0;

    // Trending count (0-50 points)
    score += Math.min(trendingData.count / 10, 50);

    // Position need (0-30 points)
    if (positionNeed) {
      score += 30;
    }

    // Reddit sentiment (0-20 points)
    if (redditAnalysis && redditAnalysis.sentiment_analysis) {
      const sentimentScore = redditAnalysis.sentiment_analysis.sentiment_score;
      score += (sentimentScore + 1) * 10; // Convert -1 to 1 range to 0-20
    }

    return score;
  }

  /**
   * Get drop candidate recommendations
   * @param {Array} rosterPlayerIds - Current roster player IDs
   * @param {Object} allPlayers - All players object
   * @param {Array} trendingDrops - Trending drops from Sleeper
   * @returns {Promise<Array>} Array of drop candidates
   */
  async getDropCandidates(rosterPlayerIds, allPlayers, trendingDrops) {
    const candidates = [];

    // Check which rostered players are trending drops
    for (const drop of trendingDrops) {
      if (rosterPlayerIds.includes(drop.player_id)) {
        const player = drop.full_data;

        candidates.push({
          player_id: drop.player_id,
          name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          team: player.team,
          injury_status: player.injury_status || 'active',
          trending_drop_count: drop.count,
          reason: this.getDropReason(player, drop.count)
        });
      }
    }

    // Add injured players as drop candidates
    rosterPlayerIds.forEach(playerId => {
      const player = allPlayers[playerId];
      if (player && (player.injury_status === 'Out' || player.injury_status === 'IR')) {
        // Check if not already in candidates
        if (!candidates.find(c => c.player_id === playerId)) {
          candidates.push({
            player_id: playerId,
            name: `${player.first_name} ${player.last_name}`,
            position: player.position,
            team: player.team,
            injury_status: player.injury_status,
            trending_drop_count: 0,
            reason: `Injured: ${player.injury_status}`
          });
        }
      }
    });

    return candidates;
  }

  /**
   * Get drop reason based on player data
   * @param {Object} player - Player object
   * @param {number} dropCount - Trending drop count
   * @returns {string} Drop reason
   */
  getDropReason(player, dropCount) {
    if (player.injury_status && player.injury_status !== 'active') {
      return `Injury concern: ${player.injury_status}`;
    }

    if (dropCount > 100) {
      return `Heavily dropped league-wide (${dropCount} leagues)`;
    }

    return `Trending drop (${dropCount} leagues)`;
  }

  /**
   * Get sit/start recommendations
   * @param {Array} starterIds - Current starter player IDs
   * @param {Array} rosterPlayerIds - All roster player IDs
   * @param {Object} allPlayers - All players object
   * @returns {Promise<Array>} Array of sit/start suggestions
   */
  async getSitStartRecommendations(starterIds, rosterPlayerIds, allPlayers) {
    const recommendations = [];

    // Get bench players by position
    const benchPlayerIds = rosterPlayerIds.filter(id => !starterIds.includes(id));

    // Compare starters with bench players in same position
    for (const starterId of starterIds) {
      const starter = allPlayers[starterId];
      if (!starter) continue;

      // Find bench players at same position
      const benchAlternatives = benchPlayerIds
        .map(id => allPlayers[id])
        .filter(p => p && p.position === starter.position);

      if (benchAlternatives.length > 0) {
        // Simple recommendation: flag if starter is injured
        if (starter.injury_status && starter.injury_status !== 'active') {
          recommendations.push({
            type: 'sit',
            player_id: starterId,
            player_name: `${starter.first_name} ${starter.last_name}`,
            position: starter.position,
            reason: `Injury: ${starter.injury_status}`,
            alternatives: benchAlternatives.map(p => ({
              name: `${p.first_name} ${p.last_name}`,
              team: p.team,
              status: p.injury_status || 'active'
            }))
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate email-friendly summary
   * @param {Object} analysis - Full team analysis
   * @returns {string} HTML formatted email content
   */
  generateEmailSummary(analysis) {
    let html = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    h1 { color: #00ff88; }
    h2 { color: #0066ff; border-bottom: 2px solid #0066ff; padding-bottom: 5px; }
    .priority-high { background-color: #ffeeee; padding: 10px; border-left: 4px solid #ff0000; }
    .priority-medium { background-color: #fff8e1; padding: 10px; border-left: 4px solid #ffa500; }
    .priority-low { background-color: #e8f5e9; padding: 10px; border-left: 4px solid #4caf50; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .positive { color: #4caf50; font-weight: bold; }
    .negative { color: #ff0000; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🏈 Fantasy Football Weekly Report</h1>
  <p><strong>League:</strong> ${analysis.league_info.name}</p>
  <p><strong>Scoring:</strong> ${analysis.league_info.scoring} PPR</p>
  <p><strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>

  <h2>🔥 Top Waiver Wire Pickups</h2>`;

    if (analysis.waiver_recommendations.length === 0) {
      html += '<p>No strong waiver recommendations at this time.</p>';
    } else {
      html += '<table><tr><th>Player</th><th>Position</th><th>Team</th><th>Trending</th><th>Reddit Sentiment</th><th>Priority</th></tr>';

      analysis.waiver_recommendations.slice(0, 5).forEach(rec => {
        const priority = rec.priority_score > 70 ? 'HIGH' : rec.priority_score > 40 ? 'MEDIUM' : 'LOW';
        const priorityClass = rec.priority_score > 70 ? 'priority-high' : rec.priority_score > 40 ? 'priority-medium' : 'priority-low';

        let sentimentText = 'N/A';
        if (rec.reddit_sentiment) {
          const sentiment = rec.reddit_sentiment.sentiment_label;
          sentimentText = `<span class="${sentiment === 'positive' ? 'positive' : sentiment === 'negative' ? 'negative' : ''}">${sentiment.toUpperCase()}</span> (${rec.reddit_discussion_count} posts)`;
        }

        html += `<tr class="${priorityClass}">
          <td><strong>${rec.name}</strong></td>
          <td>${rec.position}</td>
          <td>${rec.team || 'FA'}</td>
          <td>+${rec.trending_count} adds</td>
          <td>${sentimentText}</td>
          <td>${priority}</td>
        </tr>`;
      });

      html += '</table>';
    }

    html += '<h2>⬇️ Drop Candidates</h2>';

    if (analysis.drop_candidates.length === 0) {
      html += '<p>No obvious drop candidates on your roster.</p>';
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
      html += '<p>Your current lineup looks good! No major concerns.</p>';
    } else {
      analysis.sit_start_recommendations.forEach(rec => {
        html += `<div class="priority-high">
          <p><strong>⚠️ ${rec.type.toUpperCase()}: ${rec.player_name}</strong> (${rec.position})</p>
          <p>Reason: ${rec.reason}</p>
          <p>Consider starting:</p>
          <ul>`;

        rec.alternatives.forEach(alt => {
          html += `<li>${alt.name} (${alt.team}) - ${alt.status}</li>`;
        });

        html += '</ul></div>';
      });
    }

    html += `
  <h2>📊 Position Summary</h2>
  <ul>
    <li>QB: ${analysis.position_analysis.QB.count} ${analysis.position_analysis.QB.need ? '⚠️ Need depth' : '✅'}</li>
    <li>RB: ${analysis.position_analysis.RB.count} ${analysis.position_analysis.RB.need ? '⚠️ Need depth' : '✅'}</li>
    <li>WR: ${analysis.position_analysis.WR.count} ${analysis.position_analysis.WR.need ? '⚠️ Need depth' : '✅'}</li>
    <li>TE: ${analysis.position_analysis.TE.count} ${analysis.position_analysis.TE.need ? '⚠️ Need depth' : '✅'}</li>
  </ul>

  <hr>
  <p style="color: #888; font-size: 12px;">This report was automatically generated by your Fantasy Football AI Assistant.</p>
</body>
</html>`;

    return html;
  }
}

// Export for use in n8n or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisEngine;
}
