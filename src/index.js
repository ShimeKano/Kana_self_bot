require('dotenv').config();
const { scheduler } = require('./automation-core');
const config = require('../config');

console.log('='.repeat(50));
console.log('  Kana Self Bot — Scheduler');
console.log('='.repeat(50));
console.log(`  Channel ID: ${config.discord.channelId}`);
console.log(`  Tasks đã đăng ký: ${scheduler.tasks.size}`);
console.log('='.repeat(50));

// Bắt đầu tất cả task
scheduler.startAll();

console.log('\n✅ Scheduler đã khởi động — đang gửi tin nhắn...');
console.log('Nhấn Ctrl+C để dừng\n');

process.on('SIGINT', () => {
  console.log('\n🛑 Đang dừng...');
  scheduler.stopAll();
  process.exit(0);
});
