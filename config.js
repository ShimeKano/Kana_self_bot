require('dotenv').config();

const bool = (value, fallback = true) => {
  if (value === undefined) return fallback;
  return !['0', 'false', 'off', 'no'].includes(String(value).toLowerCase());
};

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN?.trim(),
    channelId: process.env.CHANNEL_ID?.trim(),
    apiBase: 'https://discord.com/api/v10',
    userAgent: 'Mozilla/5.0'
  },
  monitor: {
    retryDelay: parseInt(process.env.RETRY_DELAY || '5000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    responseTimeoutMs: parseInt(process.env.TLT_RESPONSE_TIMEOUT || '20000', 10),
    tltIntervalMs: parseInt(process.env.TLT_INTERVAL || '60000', 10),
    command: process.env.KANA_COMMAND?.trim() || '.tlt',
    buttonLabels: (process.env.BUTTON_LABELS || 'Bắt Đầu,Tiếp Tục').split(',').map(v => v.trim()).filter(Boolean),
    tasks: {
      tl: bool(process.env.ENABLE_TL),
      tranyeu: bool(process.env.ENABLE_TRANYEU),
      pvp: bool(process.env.ENABLE_PVP),
      tlt: bool(process.env.ENABLE_TLT)
    }
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
