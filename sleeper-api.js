/**
 * Sleeper API Integration Module
 * Fetches user data, leagues, rosters, available players, and trending players
 * Base URL: https://api.sleeper.app/v1
 * Rate Limit: Stay under 1000 calls per minute
 */

class SleeperAPI {
  constructor() {
    this.baseUrl = 'https://api.sleeper.app/v1';
  }

  /**
   * Fetch user data by username or user_id
   * @param {string} username - Sleeper username
   * @returns {Promise<Object>} User object with user_id, username, display_name, etc.
   */
  async getUser(username) {
    const response = await fetch(`${this.baseUrl}/user/${username}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get all leagues for a user in a specific season
   * @param {string} userId - User ID from getUser()
   * @param {string} season - Season year (e.g., "2024")
   * @returns {Promise<Array>} Array of league objects
   */
  async getUserLeagues(userId, season = '2024') {
    const response = await fetch(`${this.baseUrl}/user/${userId}/leagues/nfl/${season}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get league details
   * @param {string} leagueId - League ID
   * @returns {Promise<Object>} League object with settings, scoring, etc.
   */
  async getLeague(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch league: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get all rosters in a league
   * @param {string} leagueId - League ID
   * @returns {Promise<Array>} Array of roster objects with players, owner_id, etc.
   */
  async getLeagueRosters(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/rosters`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rosters: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get league users (owners)
   * @param {string} leagueId - League ID
   * @returns {Promise<Array>} Array of user objects in the league
   */
  async getLeagueUsers(leagueId) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch league users: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get matchups for a specific week
   * @param {string} leagueId - League ID
   * @param {number} week - NFL week number (1-18)
   * @returns {Promise<Array>} Array of matchup objects
   */
  async getMatchups(leagueId, week) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/matchups/${week}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch matchups: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get trending players (adds or drops in past 24 hours)
   * @param {string} type - 'add' or 'drop'
   * @param {number} lookbackHours - Hours to look back (default 24)
   * @param {number} limit - Number of results to return (default 25)
   * @returns {Promise<Array>} Array of trending player IDs with count
   */
  async getTrendingPlayers(type = 'add', lookbackHours = 24, limit = 25) {
    const response = await fetch(
      `${this.baseUrl}/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch trending players: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get all NFL players (this is a large object, cache it!)
   * @returns {Promise<Object>} Object with player_id as keys
   */
  async getAllPlayers() {
    const response = await fetch(`${this.baseUrl}/players/nfl`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all players: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Get transactions for a league (waivers, trades, adds, drops)
   * @param {string} leagueId - League ID
   * @param {number} round - Round/week number
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getTransactions(leagueId, round) {
    const response = await fetch(`${this.baseUrl}/league/${leagueId}/transactions/${round}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Helper: Get user's roster from league
   * @param {string} leagueId - League ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's roster object
   */
  async getUserRoster(leagueId, userId) {
    const rosters = await this.getLeagueRosters(leagueId);
    const userRoster = rosters.find(roster => roster.owner_id === userId);
    if (!userRoster) {
      throw new Error(`Roster not found for user ${userId} in league ${leagueId}`);
    }
    return userRoster;
  }

  /**
   * Helper: Get available players (not on any roster)
   * @param {string} leagueId - League ID
   * @param {Object} allPlayers - All players object from getAllPlayers()
   * @returns {Promise<Object>} Object of available players
   */
  async getAvailablePlayers(leagueId, allPlayers) {
    const rosters = await this.getLeagueRosters(leagueId);
    const rosteredPlayerIds = new Set();

    // Collect all rostered player IDs
    rosters.forEach(roster => {
      if (roster.players) {
        roster.players.forEach(playerId => rosteredPlayerIds.add(playerId));
      }
    });

    // Filter out rostered players
    const availablePlayers = {};
    Object.entries(allPlayers).forEach(([playerId, playerData]) => {
      if (!rosteredPlayerIds.has(playerId) && playerData.active) {
        availablePlayers[playerId] = playerData;
      }
    });

    return availablePlayers;
  }

  /**
   * Helper: Format roster with player names
   * @param {Object} roster - Roster object from getLeagueRosters()
   * @param {Object} allPlayers - All players object from getAllPlayers()
   * @returns {Object} Formatted roster with player details
   */
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

  /**
   * Helper: Get trending players with names
   * @param {string} type - 'add' or 'drop'
   * @param {Object} allPlayers - All players object from getAllPlayers()
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Array of trending players with names and details
   */
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

// Export for use in n8n or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SleeperAPI;
}
