const { scheduler } = require('./automation-core');
const config = require('../config');
const { ensureDataFiles, getPublicAccounts } = require('./config-store');
const { startDashboard } = require('./dashboard');
const { aiListener } = require('./ai/ai-listener');
const { loadAiSettings } = require('./ai/ai-settings-store');

function printStartupInfo() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                 KANA CONTROL PANEL                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  const accounts = getPublicAccounts();
  console.log(`  Accounts: ${accounts.accounts.length}`);
  console.log(`  Active:   ${accounts.activeAccountId || 'none'}`);
  console.log('');
}

try {
  ensureDataFiles();
  printStartupInfo();
  startDashboard();
  if (loadAiSettings().enabled) aiListener.start();
  scheduler.startAll();

  console.log('✅ Scheduler đang chạy. Nhấn Ctrl+C để dừng.\n');

  process.on('SIGINT', () => {
    console.log('\n🛑 Đang dừng...');
    scheduler.stopAll();
    aiListener.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    console.error('\n❌ LỖI:', err);
    scheduler.stopAll();
    aiListener.stop();
    process.exit(1);
  });
} catch (error) {
  console.error('\n❌ KHÔNG THỂ KHỞI ĐỘNG:', error.message);
  process.exit(1);
}
