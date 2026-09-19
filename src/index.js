const { scheduler } = require('./automation-core');
const { ensureDataFiles, getPublicAccounts } = require('./config-store');
const { startDashboard } = require('./dashboard');

function printStartupInfo() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                 KANA CONTROL PANEL                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  const accounts = getPublicAccounts();
  console.log(`  Accounts: ${accounts.accounts.length}`);
  console.log(`  Active:   ${accounts.activeAccountId || 'none'}`);
  console.log(`  Tasks:    ${scheduler.tasks.size}`);
  console.log('');
}

try {
  ensureDataFiles();
  printStartupInfo();
  startDashboard();
  scheduler.startAll();

  console.log('✅ Scheduler đang chạy. Nhấn Ctrl+C để dừng.\n');

  process.on('SIGINT', () => {
    console.log('\n🛑 Đang dừng...');
    scheduler.stopAll();
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    console.error('\n❌ LỖI:', err);
    scheduler.stopAll();
    process.exit(1);
  });
} catch (error) {
  console.error('\n❌ KHÔNG THỂ KHỞI ĐỘNG:', error.message);
  process.exit(1);
}
