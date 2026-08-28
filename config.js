require('dotenv').config();

const bool = (v) => v === 'true' || v === true;

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN?.trim(),
    channelId: process.env.CHANNEL_ID?.trim(),
    apiBase: 'https://discord.com/api/v10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  tasks: {
    tl: bool(process.env.ENABLE_TL ?? true),
    tranyeu: bool(process.env.ENABLE_TRANYEU ?? true),
    pvp: bool(process.env.ENABLE_PVP ?? true),
    tlt: bool(process.env.ENABLE_TLT ?? true)
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
