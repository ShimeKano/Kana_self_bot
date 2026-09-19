const { sendMessage } = require('./discord');
const { getActiveTarget, loadMessages } = require('./config-store');
const config = require('../config');

const DEFAULT_TASKS = Object.freeze({
  tl: { id: 'tl', command: '.tl', intervalMs: 65_000, description: 'Lệnh TL - mỗi 65 giây' },
  tranyeu: { id: 'tranyeu', command: '.tranyeu', intervalMs: 25_000, description: 'Lệnh Trà Nước - mỗi 25 giây' },
  pvp: { id: 'pvp', command: '.pvp', intervalMs: 305_000, description: 'Lệnh PvP - mỗi 5 phút 5 giây' },
  tlt: { id: 'tlt', command: '.tlt', intervalMs: 60_000, description: 'Lệnh TLT - mỗi 1 phút' }
});

class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.intervals = new Map();
    this.observations = [];
    this.startTime = null;
  }

  add(taskConfig) {
    if (!taskConfig?.id) throw new Error('Task phải có id');
    if (!Number.isFinite(taskConfig.intervalMs)) throw new Error(`Task ${taskConfig.id} phải có intervalMs hợp lệ`);
    this.tasks.set(taskConfig.id, { enabled: true, lastRunAt: null, runCount: 0, failCount: 0, ...taskConfig });
  }

  enable(id) { const task = this.tasks.get(id); if (!task) return false; task.enabled = true; return true; }
  disable(id) { const task = this.tasks.get(id); if (!task) return false; task.enabled = false; return true; }

  resolveMessage(task) {
    const messages = loadMessages();
    return messages.messages?.[task.id] ?? task.command ?? messages.defaultMessage;
  }

  async runTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return { ok: false, error: 'TASK_NOT_FOUND' };
    if (!task.enabled) return { ok: false, error: 'TASK_DISABLED' };

    const target = getActiveTarget();
    const command = this.resolveMessage(task);
    if (!target) {
      task.failCount++;
      return { ok: false, error: 'NO_ACTIVE_TARGET', message: 'Chưa có account/channel hợp lệ' };
    }

    try {
      const result = await sendMessage(command, target);
      task.lastRunAt = new Date();
      task.runCount++;
      if (!result?.ok) task.failCount++;

      this.observations.push({
        type: 'scheduled_task',
        taskId,
        command,
        accountId: target.accountId,
        channelId: target.channelId,
        timestamp: new Date().toISOString(),
        success: Boolean(result?.ok),
        error: result?.error || null,
        message: result?.message || null,
        messageId: result?.messageId || null
      });

      if (this.observations.length > 500) this.observations.splice(0, this.observations.length - 500);
      return result;
    } catch (error) {
      task.lastRunAt = new Date();
      task.runCount++;
      task.failCount++;
      return { ok: false, error: 'TASK_EXCEPTION', message: error.message };
    }
  }

  startAll() {
    if (this.startTime) return;
    this.startTime = new Date();

    for (const [taskId, task] of this.tasks) {
      if (!task.enabled) continue;
      this.runTask(taskId).catch(console.error);
      this.intervals.set(taskId, setInterval(() => {
        if (task.enabled) this.runTask(taskId).catch(console.error);
      }, task.intervalMs));
    }
  }

  start() { this.startAll(); }

  stopAll() {
    for (const intervalId of this.intervals.values()) clearInterval(intervalId);
    this.intervals.clear();
    this.startTime = null;
  }

  stop() { this.stopAll(); }

  setEnabled(id, enabled) { return enabled ? this.enable(id) : this.disable(id); }

  getStatus() {
    const now = Date.now();
    const tasks = [...this.tasks].map(([id, task]) => {
      const lastRunMs = task.lastRunAt?.getTime() ?? null;
      const nextRunInMs = this.intervals.has(id) && lastRunMs !== null
        ? Math.max(0, task.intervalMs - (now - lastRunMs)) : null;
      return {
        id, command: this.resolveMessage(task), description: task.description || null,
        intervalMs: task.intervalMs, intervalSeconds: task.intervalMs / 1000,
        enabled: task.enabled, running: this.intervals.has(id),
        runCount: task.runCount, failCount: task.failCount,
        lastRunAt: task.lastRunAt?.toISOString() || null,
        nextRunInMs,
        nextRunInSeconds: nextRunInMs === null ? null : Math.ceil(nextRunInMs / 1000)
      };
    });

    return {
      running: this.intervals.size > 0,
      startTime: this.startTime?.toISOString() || null,
      activeTasks: this.intervals.size,
      totalTasks: this.tasks.size,
      tasks,
      recentLogs: this.observations.slice(-20)
    };
  }

  status() { return this.getStatus(); }
}

const scheduler = new Scheduler();
for (const [id, task] of Object.entries(DEFAULT_TASKS)) {
  scheduler.add({
    ...task,
    enabled: (config.tasks || {})[id] !== false
  });
}

module.exports = { Scheduler, scheduler, DEFAULT_TASKS };
