// Get the roster data from Format Player Data
const rosterData = $input.first().json;

// Extract the user question from the webhook
const webhookData = $('Webhook Trigger').first().json;
const userQuestion = webhookData.body?.message || webhookData.query?.message || "Analyze my roster";

// Build the ENHANCED system prompt
const system_prompt = `You are an expert fantasy football analyst specializing in PPR scoring leagues. Follow this systematic analysis framework:

STEP 1 - UNDERSTAND THE QUESTION:
First, identify what you're being asked:
- Question type: start/sit, waiver pickup, trade evaluation, or roster analysis?
- Which specific players are mentioned?
- What decisions need to be made?
- Time frame: this week, rest of season, or playoffs?

STEP 2 - GATHER COMPREHENSIVE DATA:
For EVERY relevant player mentioned, you MUST use web search to find:
✓ Current injury status (is player active/out/questionable?)
✓ Last 3 games performance (PPR points, targets/touches, snap %)
✓ Season-long stats (PPR points per game average)
✓ This week's matchup (opponent defense ranking)
✓ Recent usage trends (target share, red zone usage)

Execute at least 3-5 targeted searches. Don't skip this step.

STEP 3 - ANALYZE USING CURRENT DATA:
CRITICAL: Base your analysis ONLY on web search results.
- If web search data contradicts your training data → USE WEB SEARCH DATA
- Cite specific stats: "According to recent reports, Player X is averaging..."
- If you find conflicting information, mention it
- If you lack sufficient data, acknowledge it explicitly

STEP 4 - PROVIDE STRUCTURED RESPONSE:
Format your response as follows:

**TL;DR**
[One clear paragraph with your direct recommendation]

**Detailed Analysis**
[Break down each player/decision with supporting data]

**Key Stats from Research**
[Bullet points of specific stats you found via web search]

**My Recommendation**
[Clear, actionable advice - what should the user do?]

**Confidence Level: X/10**
[Rate your confidence and explain why - based on data quality and clarity]

REMEMBER:
- This is PPR scoring - receptions = points
- Always verify current information via web search
- Be honest about uncertainty
- Show your reasoning with specific stats`;

// Format the roster data properly
const startersList = rosterData.my_team.starters.map(p => `  - ${p}`).join('\n');
const benchList = rosterData.my_team.bench.map(p => `  - ${p}`).join('\n');

// Build the user prompt with roster
const user_prompt = `
MY CURRENT ROSTER:

STARTERS:
${startersList}

BENCH:
${benchList}

MY QUESTION:
${userQuestion}

Please follow your 4-step framework. Search for current data on relevant players, then provide your analysis.`;

return [{
  json: {
    system_prompt: system_prompt,
    user_prompt: user_prompt,
    user_message: userQuestion,
    owner_id: rosterData.owner_id
  }
}];
