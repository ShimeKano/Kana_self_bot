const assert = require('assert');
const { Scheduler } = require('../src/automation-core');

console.log('🧪 Chạy kiểm tra Custom Message Scheduler...');

const scheduler = new Scheduler();
const status = scheduler.getStatus();

assert.equal(status.totalTasks, 0);
assert.equal(status.activeTasks, 0);
assert.equal(status.running, false);
assert.deepEqual(status.tasks, []);

scheduler.stopAll();

console.log('✅ Scheduler khởi tạo và trạng thái ban đầu hợp lệ.');