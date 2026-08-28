const assert = require('assert');
const { DEFAULT_TASKS, TltStateMachine } = require('../src/automation-core');

assert.equal(DEFAULT_TASKS.tl.intervalMs, 65_000);
assert.equal(DEFAULT_TASKS.tranyeu.intervalMs, 25_000);
assert.equal(DEFAULT_TASKS.pvp.intervalMs, 305_000);

const machine = new TltStateMachine({ buttonLabels: ['Bắt Đầu', 'Tiếp Tục'] });
const started = machine.begin(1000);
assert.equal(started.ok, true);
assert.equal(machine.observe({ id: 'old', createdTimestamp: 900, components: [{ components: [{ type: 2, label: 'Bắt Đầu', custom_id: 'old' }] }] }), null);
const action = machine.observe({ id: 'new', createdTimestamp: 1100, components: [{ components: [{ type: 2, label: 'Không phải', custom_id: 'x' }, { type: 2, label: 'Bắt Đầu', custom_id: 'start' }] }] });
assert.deepEqual(action, { type: 'BUTTON_REQUIRED', messageId: 'new', buttonId: 'start', label: 'Bắt Đầu' });
assert.equal(machine.status().state, 'WAITING_BUTTON');
console.log('automation-core tests passed');
