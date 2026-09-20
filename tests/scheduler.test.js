const assert = require('assert');
const { Scheduler } = require('../src/automation-core');

console.log('🧪 Chạy kiểm tra Custom Message Scheduler...');

const scheduler = new Scheduler();
const status = scheduler.getStatus();
assert.equal(status.activeTasks, 0);
assert.equal(status.running, false);
assert.deepEqual(status.tasks, []);
assert.equal(scheduler.signature({ text: 'hello', intervalSeconds: 10, enabled: true }), JSON.stringify(['hello', 10, true]));
assert.notEqual(scheduler.signature({ text: 'hello', intervalSeconds: 10, enabled: true }), scheduler.signature({ text: 'hello 2', intervalSeconds: 10, enabled: true }));
assert.notEqual(scheduler.signature({ text: 'hello', intervalSeconds: 10, enabled: true }), scheduler.signature({ text: 'hello', intervalSeconds: 20, enabled: true }));
assert.notEqual(scheduler.signature({ text: 'hello', intervalSeconds: 10, enabled: true }), scheduler.signature({ text: 'hello', intervalSeconds: 10, enabled: false }));
scheduler.stopAll();
console.log('✅ Scheduler state và timer-change detection hợp lệ.');
