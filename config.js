require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN?.trim(),
    channelId: process.env.CHANNEL_ID?.trim(),
    apiBase: 'https://discord.com/api/v10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  monitor: {
    retryDelay: parseInt(process.env.RETRY_DELAY || '5000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    command: '.tlt',
    buttonLabels: ['Bắt Đầu', 'Tiếp Tục'] // các text nút cần nhấn
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
