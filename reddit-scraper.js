/**
 * Reddit r/fantasyfootball Scraper
 * Fetches trending posts, WDIS threads, and player discussions
 * Uses Reddit's JSON API (no auth required for reading)
 */

class RedditScraper {
  constructor() {
    this.subreddit = 'fantasyfootball';
    this.baseUrl = 'https://www.reddit.com';
  }

  /**
   * Fetch hot posts from r/fantasyfootball
   * @param {number} limit - Number of posts to fetch (max 100)
   * @returns {Promise<Array>} Array of post objects
   */
  async getHotPosts(limit = 25) {
    const url = `${this.baseUrl}/r/${this.subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FantasyFootballAnalyzer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hot posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  /**
   * Fetch top posts from a specific time period
   * @param {string} time - 'hour', 'day', 'week', 'month', 'year', 'all'
   * @param {number} limit - Number of posts to fetch
   * @returns {Promise<Array>} Array of post objects
   */
  async getTopPosts(time = 'day', limit = 25) {
    const url = `${this.baseUrl}/r/${this.subreddit}/top.json?t=${time}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FantasyFootballAnalyzer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top posts: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  /**
   * Search for posts mentioning a specific player
   * @param {string} playerName - Player name to search for
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Array of post objects mentioning the player
   */
  async searchPlayer(playerName, limit = 25) {
    const query = encodeURIComponent(playerName);
    const url = `${this.baseUrl}/r/${this.subreddit}/search.json?q=${query}&restrict_sr=1&limit=${limit}&sort=relevance&t=week`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FantasyFootballAnalyzer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search for player: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  /**
   * Get WDIS (Who Do I Start) threads
   * @returns {Promise<Array>} Array of WDIS thread objects
   */
  async getWDISThreads() {
    const searchTerms = ['WDIS', 'Who Do I Start', 'Official Index'];
    const url = `${this.baseUrl}/r/${this.subreddit}/search.json?q=WDIS OR "Who Do I Start" OR "Official Index"&restrict_sr=1&limit=10&sort=new&t=week`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FantasyFootballAnalyzer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch WDIS threads: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRedditResponse(data);
  }

  /**
   * Get comments from a specific post
   * @param {string} postId - Reddit post ID
   * @param {number} limit - Number of comments to fetch
   * @returns {Promise<Array>} Array of comment objects
   */
  async getPostComments(postId, limit = 50) {
    // Reddit API returns both post and comments in the same call
    const url = `${this.baseUrl}/r/${this.subreddit}/comments/${postId}.json?limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FantasyFootballAnalyzer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Reddit returns an array: [0] = post, [1] = comments
    if (!data || data.length < 2) {
      return [];
    }

    return this.parseComments(data[1]);
  }

  /**
   * Parse Reddit API response
   * @param {Object} data - Raw Reddit JSON response
   * @returns {Array} Parsed posts
   */
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
        link_flair_text: post.link_flair_text,
        is_video: post.is_video,
        thumbnail: post.thumbnail
      };
    });
  }

  /**
   * Parse comments from Reddit API response
   * @param {Object} commentsData - Comments data from Reddit
   * @returns {Array} Parsed comments
   */
  parseComments(commentsData) {
    if (!commentsData || !commentsData.data || !commentsData.data.children) {
      return [];
    }

    const comments = [];

    const parseCommentTree = (children) => {
      children.forEach(child => {
        if (child.kind === 't1') { // t1 = comment
          const comment = child.data;
          comments.push({
            id: comment.id,
            author: comment.author,
            body: comment.body,
            score: comment.score,
            created_utc: comment.created_utc,
            parent_id: comment.parent_id
          });

          // Recursively parse replies
          if (comment.replies && comment.replies.data && comment.replies.data.children) {
            parseCommentTree(comment.replies.data.children);
          }
        }
      });
    };

    parseCommentTree(commentsData.data.children);
    return comments;
  }

  /**
   * Extract player mentions from text
   * @param {string} text - Text to analyze
   * @param {Array} playerNames - Array of player names to look for
   * @returns {Array} Array of mentioned player names
   */
  extractPlayerMentions(text, playerNames) {
    const mentions = [];
    const lowerText = text.toLowerCase();

    playerNames.forEach(playerName => {
      const lowerName = playerName.toLowerCase();
      // Look for full name or last name
      const lastName = lowerName.split(' ').pop();

      if (lowerText.includes(lowerName) || lowerText.includes(lastName)) {
        mentions.push(playerName);
      }
    });

    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Analyze sentiment in text (simple keyword-based)
   * @param {string} text - Text to analyze
   * @returns {Object} Sentiment analysis result
   */
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

  /**
   * Get comprehensive player analysis from Reddit
   * @param {string} playerName - Player name to analyze
   * @returns {Promise<Object>} Analysis object with posts, mentions, sentiment
   */
  async analyzePlayer(playerName) {
    // Search for posts mentioning the player
    const posts = await this.searchPlayer(playerName, 15);

    // Get comments from top posts
    let allComments = [];
    for (const post of posts.slice(0, 5)) { // Limit to top 5 posts to avoid rate limiting
      try {
        const comments = await this.getPostComments(post.id, 30);
        allComments = allComments.concat(comments);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Error fetching comments for post ${post.id}:`, err.message);
      }
    }

    // Analyze sentiment across all content
    const allText = [
      ...posts.map(p => `${p.title} ${p.selftext}`),
      ...allComments.map(c => c.body)
    ].join(' ');

    const sentiment = this.analyzeSentiment(allText);

    return {
      player_name: playerName,
      posts_found: posts.length,
      total_score: posts.reduce((sum, p) => sum + p.score, 0),
      total_comments: posts.reduce((sum, p) => sum + p.num_comments, 0),
      recent_posts: posts.slice(0, 5),
      comment_count: allComments.length,
      sentiment_analysis: sentiment,
      top_discussions: posts.slice(0, 3).map(p => ({
        title: p.title,
        score: p.score,
        url: p.url
      }))
    };
  }

  /**
   * Get trending topics/players from hot posts
   * @returns {Promise<Object>} Trending analysis
   */
  async getTrendingTopics() {
    const hotPosts = await this.getHotPosts(50);

    // Extract player names from titles (simple approach)
    const playerMentions = {};

    hotPosts.forEach(post => {
      // This is a simple approach - in production, you'd want to use
      // your player database to match actual player names
      const title = post.title;

      // Common patterns: "Player Name ROS", "Player Name outlook", etc.
      const words = title.split(/\s+/);

      // Store post data
      playerMentions[title] = {
        score: post.score,
        comments: post.num_comments,
        url: post.url
      };
    });

    return {
      hot_posts: hotPosts.slice(0, 10),
      total_discussions: hotPosts.length,
      top_by_score: hotPosts.sort((a, b) => b.score - a.score).slice(0, 5),
      top_by_comments: hotPosts.sort((a, b) => b.num_comments - a.num_comments).slice(0, 5)
    };
  }
}

// Export for use in n8n or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RedditScraper;
}
