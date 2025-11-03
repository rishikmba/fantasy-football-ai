# Simplified n8n Code Nodes - No Embedded Code!

All code is on GitHub. n8n just loads and executes it.

## Node 3: Fetch Sleeper Data

**Replace all your code with this:**

```javascript
// Load code from GitHub (it's already loaded in previous node)
const githubCode = $('Load Code from GitHub').first().json.data;
const config = $input.first().json.config;

// Execute the GitHub code to load classes
eval(githubCode);

// Create API instance with n8n's $request
const sleeper = new SleeperAPI($request);

// Fetch data
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
```

## Node 4: Analyze Team

**Replace all your code with this:**

```javascript
const githubCode = $('Load Code from GitHub').first().json.data;
const inputData = $input.first().json;

// Load the GitHub code
eval(githubCode);

const config = inputData.config;
const sleeperData = inputData.sleeperData;
const allPlayers = sleeperData.allPlayers;
const rosterPlayerIds = sleeperData.roster.players || [];
const starterIds = sleeperData.roster.starters || [];

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
```

## Node 5: Generate Email

**Replace all your code with this:**

```javascript
const githubCode = $('Load Code from GitHub').first().json.data;
const inputData = $input.first().json;

// Load the GitHub code
eval(githubCode);

const config = inputData.config;
const analysis = inputData.analysis;

// Use the generateEmailHTML function from GitHub
const emailHTML = generateEmailHTML(analysis);
const emailSubject = `🏈 Fantasy Football Report - Week ${config.current_week} - ${analysis.league_info.name}`;

return [{
  json: {
    email_to: config.email,
    email_subject: emailSubject,
    email_html: emailHTML
  }
}];
```

## Key Points

1. ✅ **All logic is in GitHub** (`fantasy-football-engine.js`)
2. ✅ **Each node loads the GitHub code** with `eval(githubCode)`
3. ✅ **Pass `$request` to constructors** so they can make HTTP requests in n8n
4. ✅ **Minimal code in n8n** - just loading and executing

## The Fix for Your Error

The error "fetch is not defined" is fixed by:
```javascript
const sleeper = new SleeperAPI($request);  // ← Pass n8n's $request
```

Instead of:
```javascript
const sleeper = new SleeperAPI();  // ← This tries to use fetch() which doesn't exist
```

## Benefits

- **Easy updates**: Change code on GitHub, all workflows update automatically
- **No copy/paste**: Don't duplicate code across nodes
- **Version control**: GitHub tracks all changes
- **Cleaner n8n**: Minimal code in workflow nodes

## Testing

After updating your nodes:
1. Click "Execute Workflow"
2. Check each node's output
3. Should see data flowing through successfully
4. No "fetch is not defined" errors!
