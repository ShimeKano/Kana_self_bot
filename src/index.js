const { startServer } = require('./http-server');
const config = require('../config');

console.log('='.repeat(50));
console.log('  Discord TLT Auto Bot');
console.log('='.repeat(50));
console.log(`  Channel ID: ${config.discord.channelId}`);
console.log(`  Command:    ${config.monitor.command}`);
console.log(`  Port:       ${config.server.port}`);
console.log(`  Retry:      ${config.monitor.maxRetries} lần, delay ${config.monitor.retryDelay}ms`);
console.log('='.repeat(50));

// Kiểm tra cấu hình
if (!config.discord.token) {
  console.error('❌ Lỗi: DISCORD_TOKEN chưa được đặt trong .env');
  process.exit(1);
}
if (!config.discord.channelId) {
  console.error('❌ Lỗi: CHANNEL_ID chưa được đặt trong .env');
  process.exit(1);
}

// Khởi động server HTTP
startServer();

// Nhấn Ctrl+C để dừng
process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt...');
  process.exit(0);
});
