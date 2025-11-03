/**
 * n8n Node: Generate Email
 *
 * Creates the HTML email report.
 * NO CHANGES NEEDED - This is ready to use!
 *
 * GitHub: https://raw.githubusercontent.com/rishikmba/fantasy-football-ai/claude/sleeper-fantasy-football-api-011CUk8Lz7fGE4jt5xKapGiD/n8n-nodes/04-generate-email.js
 */

// Load the GitHub engine code
const githubCode = $('Load Code from GitHub').first().json.data;
const inputData = $input.first().json;

// Execute the engine
eval(githubCode);

const config = inputData.config;
const analysis = inputData.analysis;

console.log('Generating email report...');

// Use the generateEmailHTML function from the engine
const emailHTML = generateEmailHTML(analysis);
const emailSubject = `🏈 Fantasy Football Report - Week ${config.current_week} - ${analysis.league_info.name}`;

console.log('✓ Email generated!');

return [{
  json: {
    email_to: config.email,
    email_subject: emailSubject,
    email_html: emailHTML
  }
}];
