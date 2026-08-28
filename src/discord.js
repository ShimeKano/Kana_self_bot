const axios = require('axios');
const config = require('../config');

// Kiểm tra cấu hình bắt buộc
if (!config.discord.token) {
  throw new Error('[Discord] DISCORD_TOKEN chưa được cấu hình trong .env');
}
if (!config.discord.channelId) {
  throw new Error('[Discord] CHANNEL_ID chưa được cấu hình trong .env');
}

// Tạo instance axios với cấu hình sẵn
const api = axios.create({
  baseURL: config.discord.apiBase,
  headers: {
    'Authorization': config.discord.token,
    'Content-Type': 'application/json',
    'User-Agent': config.discord.userAgent
  },
  timeout: 15000 // 15 giây timeout
});

/**
 * Gửi tin nhắn vào channel đã cấu hình
 * @param {string} content - Nội dung tin nhắn
 * @returns {Promise<{ok: boolean, data?: any, error?: string, status?: number}>}
 */
async function sendMessage(content) {
  try {
    const response = await api.post(
      `/channels/${config.discord.channelId}/messages`,
      {
        content,
        tts: false,
        flags: 0
      }
    );

    return {
      ok: true,
      data: response.data,
      messageId: response.data.id
    };
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = error.message;

    if (status === 401) {
      errorCode = 'UNAUTHORIZED';
      errorMessage = 'Token không hợp lệ hoặc hết hạn';
    } else if (status === 403) {
      errorCode = 'FORBIDDEN';
      errorMessage = 'Không có quyền gửi tin nhắn vào channel này';
    } else if (status === 404) {
      errorCode = 'CHANNEL_NOT_FOUND';
      errorMessage = 'Channel không tồn tại';
    } else if (status === 429) {
      errorCode = 'RATE_LIMITED';
      errorMessage = `Bị giới hạn tốc độ - Thử lại sau ${responseData?.retry_after || 5}s`;
    } else if (error.code === 'ECONNABORTED') {
      errorCode = 'TIMEOUT';
      errorMessage = 'Yêu cầu vượt quá thời gian chờ';
    }

    console.error(`[Discord API] Lỗi gửi "${content}": ${status || 'NETWORK'} - ${errorMessage}`);
    if (responseData) {
      console.error(`[Discord API] Chi tiết:`, JSON.stringify(responseData, null, 2));
    }

    return {
      ok: false,
      error: errorCode,
      status,
      message: errorMessage,
      details: responseData
    };
  }
}

/**
 * Lấy danh sách tin nhắn mới nhất trong channel
 * @param {number} limit - Số lượng tin nhắn (tối đa 100)
 * @returns {Promise<{ok: boolean, data?: any[], error?: string}>}
 */
async function fetchMessages(limit = 10) {
  try {
    const response = await api.get(
      `/channels/${config.discord.channelId}/messages?limit=${Math.min(limit, 100)}`
    );
    return { ok: true, data: response.data };
  } catch (error) {
    console.error(`[Discord API] Lỗi lấy tin nhắn: ${error.response?.status} - ${error.message}`);
    return {
      ok: false,
      error: 'FETCH_FAILED',
      status: error.response?.status,
      message: error.message
    };
  }
}

module.exports = {
  sendMessage,
  fetchMessages
};
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
