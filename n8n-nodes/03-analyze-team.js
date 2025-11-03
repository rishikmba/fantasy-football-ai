/**
 * n8n Node: Analyze Team
 *
 * Analyzes your roster and generates recommendations.
 * NO CHANGES NEEDED - This is ready to use!
 *
 * GitHub: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/claude/sleeper-fantasy-football-api-011CUk8Lz7fGE4jt5xKapGiD/n8n-nodes/03-analyze-team.js
 */

// Load the GitHub engine code
const githubCode = $('Load Code from GitHub').first().json.data;
const inputData = $input.first().json;

// Execute the engine
eval(githubCode);

const config = inputData.config;
const sleeperData = inputData.sleeperData;
const allPlayers = sleeperData.allPlayers;
const rosterPlayerIds = sleeperData.roster.players || [];
const starterIds = sleeperData.roster.starters || [];

console.log('Analyzing roster...');

// Analyze roster by position
const positionAnalysis = analyzeRosterByPosition(rosterPlayerIds, allPlayers);

// Generate waiver recommendations
const waiverRecommendations = [];
const rosteredSet = new Set(rosterPlayerIds);

for (const trending of sleeperData.trendingAdds) {
  if (!rosteredSet.has(trending.player_id)) {
    const player = allPlayers[trending.player_id];
    if (!player || !player.active) continue;
    if (player.injury_status === 'Out' || player.injury_status === 'IR') continue;

    const positionNeed = positionAnalysis[player.position]?.need || false;
    const priorityScore = calculatePickupPriority(trending, positionNeed, null);

    waiverRecommendations.push({
      player_id: trending.player_id,
      name: trending.name,
      position: player.position,
      team: player.team,
      trending_count: trending.count,
      position_need: positionNeed,
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

console.log('✓ Analysis complete!');
console.log('  - Waiver recommendations:', waiverRecommendations.length);
console.log('  - Drop candidates:', dropCandidates.length);
console.log('  - Sit/start alerts:', sitStartRecommendations.length);

return [{
  json: {
    config,
    analysis: {
      league_info: {
        name: sleeperData.league.name,
        scoring: sleeperData.league.scoring_settings?.rec || 0,
        total_rosters: sleeperData.league.total_rosters
      },
      position_analysis: positionAnalysis,
      waiver_recommendations: waiverRecommendations.slice(0, config.max_waiver_recommendations),
      drop_candidates: dropCandidates,
      sit_start_recommendations: sitStartRecommendations,
      timestamp: new Date().toISOString()
    }
  }
}];
