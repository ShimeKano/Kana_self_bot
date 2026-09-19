require('dotenv').config();

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

module.exports = {
  discord: {
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
  ai: {
    enabled: parseBoolean(process.env.AI_ENABLED ?? false),
    ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:1.7b'
  },
  scheduler: {
    maxRetries: 5,
    retryDelayMs: 5000
  }
};
