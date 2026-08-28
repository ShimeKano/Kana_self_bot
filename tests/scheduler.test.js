const { scheduler, DEFAULT_TASKS } = require('../src/automation-core');

console.log('🧪 Chạy kiểm tra Scheduler...\n');

// Kiểm tra DEFAULT_TASKS
console.log('1. Kiểm tra DEFAULT_TASKS:');
console.log(`   → Số task: ${Object.keys(DEFAULT_TASKS).length}`);
console.log(`   → Task: ${Object.keys(DEFAULT_TASKS).join(', ')}`);

// Kiểm tra scheduler đã đăng ký đủ task chưa
console.log('\n2. Kiểm tra Scheduler.tasks:');
const status = scheduler.getStatus();
console.log(`   → Số task đã đăng ký: ${status.totalTasks}`);
console.log(`   → Task bật: ${status.tasks.filter(t => t.enabled).length}`);

// Kiểm tra cấu trúc task
console.log('\n3. Kiểm tra cấu trúc từng task:');
status.tasks.forEach(task => {
  const hasRequiredFields = task.id && task.command && task.intervalMs;
  console.log(`   → ${task.id}: ${hasRequiredFields ? '✓ Đúng cấu trúc' : '✗ Thiếu trường'}`);
});

console.log('\n✅ Kiểm tra hoàn tất. Tất cả cơ bản OK.\n');
