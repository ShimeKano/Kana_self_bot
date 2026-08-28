const { startServer } = require('./http-server');
const { Scheduler } = require('./scheduler');
const { ObservationStore } = require('./observation-store');
const { DEFAULT_TASKS, TltStateMachine } = require('./automation-core');
const config = require('../config');

const observations = new ObservationStore();
const tlt = new TltStateMachine({
  command: config.monitor.command,
  buttonLabels: config.monitor.buttonLabels,
  responseTimeoutMs: config.monitor.responseTimeoutMs
});
const scheduler = new Scheduler({
  onError: message => observations.append({ type: 'scheduler_error', message })
});

for (const [id, task] of Object.entries(DEFAULT_TASKS)) {
  scheduler.add({
    id,
    intervalMs: task.intervalMs,
    enabled: config.monitor.tasks[id] !== false,
    run: async () => {
      observations.append({ type: 'scheduled_task', taskId: id, command: task.command, mode: 'simulation' });
      console.log(`[Scheduler] ${id}: ${task.command}`);
    }
  });
}

scheduler.add({
  id: 'tlt',
  intervalMs: config.monitor.tltIntervalMs,
  enabled: config.monitor.tasks.tlt !== false,
  run: async () => {
    const result = tlt.begin();
    observations.append({ type: 'tlt_cycle', result });
    console.log(`[TLT] ${result.ok ? result.action.command : result.reason}`);
  }
});

console.log('Kana automation core ready (transport-neutral mode).');
console.log('Tasks:', scheduler.status());
startServer({ scheduler, tlt, observations });
scheduler.start();

process.on('SIGINT', () => {
  scheduler.stop();
  console.log('\n🛑 Đã dừng scheduler.');
  process.exit(0);
});

module.exports = { scheduler, tlt, observations };
