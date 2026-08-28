const { sendMessage, fetchLatestMessages, clickButton } = require('./discord');
const config = require('../config');

let state = {
  running: false,
  retryCount: 0,
  lastMessageId: null,
  interval: null
};

// Tìm nút trong tin nhắn dựa vào label
function findButton(messages) {
  for (const msg of messages) {
    if (!msg.components?.length) continue;
    for (const row of msg.components) {
      if (!row.components?.length) continue;
      for (const btn of row.components) {
        if (config.monitor.buttonLabels.some(label => 
          btn.label?.includes(label) || btn.label === label
        )) {
          return { messageId: msg.id, buttonId: btn.custom_id, label: btn.label };
        }
      }
    }
  }
  return null;
}

// Chạy một chu kỳ: gửi .tlt → chờ → kiểm tra → nhấn nút/gửi lại
async function runCycle() {
  if (!state.running) return;

  console.log(`[Monitor] Gửi lệnh: ${config.monitor.command}`);
  const sendResult = await sendMessage(config.monitor.command);
  if (!sendResult.ok) {
    console.log('[Monitor] Gửi lệnh thất bại → dừng');
    return stop();
  }

  // Chờ tin nhắn phản hồi xuất hiện
  await delay(config.monitor.retryDelay);

  // Lấy tin nhắn mới nhất
  const fetchResult = await fetchLatestMessages(10);
  if (!fetchResult.ok) {
    console.log('[Monitor] Không lấy được tin nhắn → thử lại');
    return retry();
  }

  const button = findButton(fetchResult.data);
  if (button) {
    console.log(`[Monitor] Tìm thấy nút: "${button.label}" → đang nhấn...`);
    const clickResult = await clickButton(button.messageId, button.buttonId);
    if (clickResult.ok) {
      console.log('[Monitor] ✅ Nhấn nút thành công! Chu kỳ hoàn tất.');
      state.retryCount = 0;
      // Tự động chạy lại sau khi hoàn tất (tùy chọn)
      // setTimeout(() => runCycle(), 10000);
    } else {
      console.log('[Monitor] ❌ Nhấn nút thất bại → gửi lại lệnh');
      await retry();
    }
  } else {
    console.log('[Monitor] ⚠ Không tìm thấy nút → gửi lại lệnh');
    await retry();
  }
}

async function retry() {
  state.retryCount++;
  if (state.retryCount >= config.monitor.maxRetries) {
    console.log(`[Monitor] Đã thử ${state.retryCount} lần thất bại → dừng`);
    return stop();
  }
  console.log(`[Monitor] Thử lại lần ${state.retryCount}/${config.monitor.maxRetries}...`);
  await delay(config.monitor.retryDelay);
  return runCycle();
}

function start() {
  if (state.running) return { ok: false, message: 'Đã chạy rồi' };
  if (!config.discord.token) return { ok: false, message: 'Chưa cấu hình DISCORD_TOKEN' };
  if (!config.discord.channelId) return { ok: false, message: 'Chưa cấu hình CHANNEL_ID' };

  state.running = true;
  state.retryCount = 0;
  console.log('[Monitor] 🟢 Bắt đầu theo dõi...');
  runCycle();
  return { ok: true, message: 'Đã bắt đầu' };
}

function stop() {
  state.running = false;
  state.retryCount = 0;
  if (state.interval) clearInterval(state.interval);
  console.log('[Monitor] 🔴 Đã dừng');
  return { ok: true, message: 'Đã dừng' };
}

function status() {
  return {
    running: state.running,
    retryCount: state.retryCount,
    maxRetries: config.monitor.maxRetries,
    command: config.monitor.command
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { start, stop, status, runCycle };
