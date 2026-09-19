require('dotenv').config();

module.exports = {
  discord: {
    apiBase: 'https://discord.com/api/v10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  },
  scheduler: {
    maxRetries: 5,
    retryDelayMs: 5000
  }
};
