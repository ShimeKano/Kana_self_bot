const axios = require('axios');
const config = require('../config');

if (!config.discord.token) {
  throw new Error('[Discord] DISCORD_TOKEN chưa được cấu hình trong .env');
}

if (!config.discord.channelId) {
  throw new Error('[Discord] CHANNEL_ID chưa được cấu hình trong .env');
}

const api = axios.create({
  baseURL: config.discord.apiBase,
  headers: {
    Authorization: config.discord.token,
    'Content-Type': 'application/json',
    'User-Agent': config.discord.userAgent
  },
  timeout: 15000
});

function handleError(error, action) {
  const status = error.response?.status;
  const responseData = error.response?.data;

  let errorCode = 'UNKNOWN_ERROR';
  let errorMessage = error.message;

  if (status === 401) {
    errorCode = 'UNAUTHORIZED';
    errorMessage = 'Token không hợp lệ hoặc hết hạn';
  } else if (status === 403) {
    errorCode = 'FORBIDDEN';
    errorMessage = 'Không có quyền thực hiện thao tác này';
  } else if (status === 404) {
    errorCode = 'NOT_FOUND';
    errorMessage = 'Channel hoặc resource không tồn tại';
  } else if (status === 429) {
    errorCode = 'RATE_LIMITED';
    errorMessage = `Bị giới hạn tốc độ - thử lại sau ${responseData?.retry_after || 5}s`;
  } else if (error.code === 'ECONNABORTED') {
    errorCode = 'TIMEOUT';
    errorMessage = 'Yêu cầu vượt quá thời gian chờ';
  }

  console.error(
    `[Discord API] Lỗi ${action}: ${status || 'NETWORK'} - ${errorMessage}`
  );

  if (responseData) {
    console.error(
      '[Discord API] Chi tiết:',
      JSON.stringify(responseData, null, 2)
    );
  }

  return {
    ok: false,
    error: errorCode,
    status,
    message: errorMessage,
    details: responseData
  };
}

/**
 * Gửi một message vào channel đã cấu hình.
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
      messageId: response.data?.id || null
    };
  } catch (error) {
    return handleError(error, `gửi "${content}"`);
  }
}

/**
 * Lấy message mới nhất trong channel.
 */
async function fetchMessages(limit = 10) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const response = await api.get(
      `/channels/${config.discord.channelId}/messages?limit=${safeLimit}`
    );

    return {
      ok: true,
      data: response.data
    };
  } catch (error) {
    return handleError(error, 'lấy tin nhắn');
  }
}

/**
 * Alias được automation/monitor sử dụng.
 */
async function fetchLatestMessages(limit = 10) {
  return fetchMessages(limit);
}

/**
 * Giữ API clickButton của code cũ để các module khác không bị crash.
 * Phần component interaction được giữ tách biệt với sendMessage().
 */
async function clickButton(messageId, componentId) {
  if (!messageId) {
    return {
      ok: false,
      error: 'MESSAGE_ID_REQUIRED',
      message: 'Thiếu messageId'
    };
  }

  if (!componentId) {
    return {
      ok: false,
      error: 'COMPONENT_ID_REQUIRED',
      message: 'Thiếu componentId'
    };
  }

  return {
    ok: false,
    error: 'COMPONENT_ACTION_NOT_IMPLEMENTED',
    message: 'Component interaction adapter chưa được triển khai'
  };
}

module.exports = {
  sendMessage,
  fetchMessages,
  fetchLatestMessages,
  clickButton
};
