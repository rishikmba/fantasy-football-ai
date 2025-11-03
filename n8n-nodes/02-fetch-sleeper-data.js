/**
 * n8n Node: Fetch Sleeper Data
 *
 * Loads the engine from GitHub and fetches your Sleeper data.
 * NO CHANGES NEEDED - This is ready to use!
 *
 * GitHub: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/n8n-github-clean/n8n-nodes/02-fetch-sleeper-data.js
 */

// Get the GitHub engine code from previous node
const githubCode = $('Load Code from GitHub').first().json.data;
const config = $input.first().json.config;

// Load the engine
eval(githubCode);

// Create Sleeper API instance with n8n's $request
const sleeper = new SleeperAPI($request);

// Fetch all the data
console.log('Fetching roster for owner:', config.owner_id);
const roster = await sleeper.getUserRoster(config.league_id, config.owner_id);

console.log('Fetching all NFL players...');
const allPlayers = await sleeper.getAllPlayers();
console.log('Total players:', Object.keys(allPlayers).length);

console.log('Fetching trending adds...');
const trendingAdds = await sleeper.getTrendingPlayersWithDetails('add', allPlayers, 30);

console.log('Fetching trending drops...');
const trendingDrops = await sleeper.getTrendingPlayersWithDetails('drop', allPlayers, 30);

console.log('Fetching league info...');
const league = await sleeper.getLeague(config.league_id);

console.log('✓ Sleeper data fetch complete!');

return [{
  json: {
    config,
    sleeperData: {
      roster,
      allPlayers,
      trendingAdds: trendingAdds.slice(0, 15),
      trendingDrops: trendingDrops.slice(0, 10),
      league
    }
  }
}];
