require('dotenv').config();
const { scheduler } = require('./automation-core');
const config = require('../config');

function printStartupInfo() {
  console.log('\n' + '╔════════════════════════════════════════════════════════════╗');
  console.log('║               KANA SELF BOT - DISCORD SCHEDULER             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`  📌 Channel ID:     ${config.discord.channelId}`);
  console.log(`  📌 Token:          ${config.discord.token ? '✓ Đã cấu hình' : '✗ CHƯA CẤU HÌNH'}`);
  console.log(`  📌 Tổng task:     ${scheduler.tasks.size}`);
  console.log('');

  const status = scheduler.getStatus();
  for (const task of status.tasks) {
    const icon = task.enabled ? '🟢' : '⚪';
    console.log(`  ${icon} ${task.command.padEnd(10)} | ${(task.intervalMs / 1000).toString().padStart(4)}s | ${task.enabled ? 'Bật' : 'Tắt'}`);
  }
  console.log('');
}

function validateConfig() {
  const errors = [];

  if (!config.discord.token) {
    errors.push('→ DISCORD_TOKEN chưa đặt trong .env');
  }
  if (!config.discord.channelId) {
    errors.push('→ CHANNEL_ID chưa đặt trong .env');
  }

  if (errors.length > 0) {
    console.error('❌ CẤU HÌNH THIẾU:');
    errors.forEach(e => console.error(e));
    console.error('\nVui lòng kiểm tra file .env và chạy lại.\n');
    process.exit(1);
  }
}

// === Bắt đầu chương trình chính ===
try {
  validateConfig();
  printStartupInfo();

  // Khởi động scheduler
  scheduler.startAll();

  console.log('✅ Scheduler đang chạy. Nhấn Ctrl+C để dừng.\n');

  // Xử lý tắt chương trình
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Nhận tín hiệu dừng...');
    scheduler.stopAll();
    console.log('👋 Tạm biệt!\n');
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    console.error('\n❌ LỖI KHÔNG BẮT ĐƯỢC:', err);
    scheduler.stopAll();
    process.exit(1);
  });

} catch (error) {
  console.error('\n❌ KHÔNG THỂ KHỞI ĐỘNG:', error.message);
  process.exit(1);
}
