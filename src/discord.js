const axios = require('axios');
const config = require('../config');

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
      content, tts: false
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return handleError(err, 'gửi tin nhắn');
  }
}

// Lấy tin nhắn mới nhất trong channel
async function fetchLatestMessages(limit = 5) {
  try {
    const res = await api.get(`/channels/${config.discord.channelId}/messages?limit=${limit}`);
    return { ok: true, data: res.data };
  } catch (err) {
    return handleError(err, 'lấy tin nhắn');
  }
}

// Nhấn nút (gửi interaction)
async function clickButton(messageId, componentId) {
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
