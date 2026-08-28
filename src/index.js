const { startServer } = require('./http-server');
const { startClient } = require('./discord-client');
const config = require('../config');

async function main() {
  console.log('='.repeat(50));
  console.log('  Kana Discord Controller');
  console.log('='.repeat(50));
  console.log(`  Channel ID: ${config.discord.channelId || '(chưa cấu hình)'}`);
  console.log(`  Command:    ${config.monitor.command}`);
  console.log(`  Port:       ${config.server.port}`);
  console.log('='.repeat(50));

  if (!config.discord.botToken) {
    console.error('❌ DISCORD_BOT_TOKEN chưa được đặt trong .env');
    process.exit(1);
  }
  if (!config.discord.channelId) {
    console.error('❌ CHANNEL_ID chưa được đặt trong .env');
    process.exit(1);
  }

  await startClient();
  startServer();
}

main().catch(error => {
  console.error('❌ Không thể khởi động:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Đang tắt...');
  process.exit(0);
});
