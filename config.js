require('dotenv').config();

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN?.trim() || '',
    channelId: process.env.CHANNEL_ID?.trim() || '',
    apiBase: 'https://discord.com/api/v10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },

  tasks: {
    tl: parseBoolean(process.env.ENABLE_TL ?? true),
    tranyeu: parseBoolean(process.env.ENABLE_TRANYEU ?? true),
    pvp: parseBoolean(process.env.ENABLE_PVP ?? true),
    tlt: parseBoolean(process.env.ENABLE_TLT ?? true)
  },

  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  },

  scheduler: {
    maxRetries: 5,
    retryDelayMs: 5000
  }
};
