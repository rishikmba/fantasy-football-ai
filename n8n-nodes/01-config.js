/**
 * n8n Node: Configuration
 *
 * This node just sets your configuration.
 * UPDATE YOUR SETTINGS BELOW!
 *
 * GitHub: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/n8n-github-clean/n8n-nodes/01-config.js
 */

const config = {
  // YOUR SLEEPER INFO - UPDATE THESE!
  owner_id: '1260492147568689152',
  league_id: '1257118081231097856',
  season: '2024',

  // YOUR EMAIL - UPDATE THIS!
  email: 'YOUR_EMAIL@example.com',

  // SETTINGS
  current_week: 10,  // Update weekly
  max_waiver_recommendations: 5,
  include_reddit_analysis: false  // Set to true for Reddit insights (slower)
};

return [{ json: { config } }];
