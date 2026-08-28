const axios = require('axios');
const config = require('../config');

if (!config.discord.token) {
  throw new Error('DISCORD_TOKEN chưa được cấu hình trong .env');
}
if (!config.discord.channelId) {
  throw new Error('CHANNEL_ID chưa được cấu hình trong .env');
}

const api = axios.create({
  baseURL: config.discord.apiBase,
  headers: {
    'Authorization': config.discord.token,
    'Content-Type': 'application/json',
    'User-Agent': config.discord.userAgent
  }
});

// Gửi tin nhắn vào channel
async function sendMessage(content) {
  try {
    const res = await api.post(`/channels/${config.discord.channelId}/messages`, {
      content,
      tts: false
    });
    return { ok: true, data: res.data };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error(`[Discord API] Lỗi gửi tin nhắn: ${status}`, data);
    return {
      ok: false,
      error: status === 401 ? 'TOKEN_INVALID'
           : status === 429 ? 'RATE_LIMITED'
           : 'NETWORK_ERROR',
      status,
      details: data
    };
  }
}

module.exports = { sendMessage };
  try {
    const res = await api.post(`/interactions`, {
      type: 3, // MESSAGE_COMPONENT
      channel_id: config.discord.channelId,
      message_id: messageId,
      application_id: null, // sẽ tự điền từ tin nhắn
      data: { component_type: 2, custom_id: componentId }
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return handleError(err, 'nhấn nút');
  }
}

function handleError(err, action) {
  const status = err.response?.status;
  const text = err.response?.data ? JSON.stringify(err.response.data) : err.message;
  console.error(`[Discord] Lỗi ${action}: ${status} - ${text}`);
  if (status === 401) console.error('[Discord] Token không hợp lệ/hết hạn!');
  if (status === 429) console.warn('[Discord] Bị rate limit - thử lại sau');
  return { ok: false, error: action, status, message: text };
}

module.exports = { sendMessage, fetchLatestMessages, clickButton };
