require('dotenv').config();

module.exports = {
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN?.trim(),
    channelId: process.env.CHANNEL_ID?.trim()
  },
  monitor: {
    retryDelay: parseInt(process.env.RETRY_DELAY || '5000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    command: process.env.KANA_COMMAND?.trim() || '.tlt',
    buttonLabels: (process.env.BUTTON_LABELS || 'Bắt Đầu,Tiếp Tục')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
