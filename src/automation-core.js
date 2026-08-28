const { sendMessage } = require('./discord');
const config = require('../config');

const DEFAULT_TASKS = Object.freeze({
  tl: {
    id: 'tl',
    command: '.tl',
    intervalMs: 65_000,
    description: 'Lệnh TL - mỗi 65 giây'
  },
  tranyeu: {
    id: 'tranyeu',
    command: '.tranyeu',
    intervalMs: 25_000,
    description: 'Lệnh Trà Nước - mỗi 25 giây'
  },
  pvp: {
    id: 'pvp',
    command: '.pvp',
    intervalMs: 305_000,
    description: 'Lệnh PvP - mỗi 5 phút 5 giây'
  },
  tlt: {
    id: 'tlt',
    command: '.tlt',
    intervalMs: 60_000,
    description: 'Lệnh TLT - mỗi 1 phút'
  }
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
    if (!Number.isFinite(taskConfig.intervalMs)) {
      throw new Error(`Task ${taskConfig.id} phải có intervalMs hợp lệ`);
    }

    this.tasks.set(taskConfig.id, {
      enabled: true,
      lastRunAt: null,
      runCount: 0,
      failCount: 0,
      ...taskConfig
    });

    console.log(
      `[Scheduler] Đăng ký task: ${taskConfig.command} (${taskConfig.intervalMs / 1000}s)`
    );
  }

  enable(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.enabled = true;
    return true;
  }

  disable(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.enabled = false;
    return true;
  }

  async runTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) return { ok: false, error: 'TASK_NOT_FOUND' };
    if (!task.enabled) return { ok: false, error: 'TASK_DISABLED' };

    console.log(`[Task:${taskId}] Đang gửi: ${task.command}`);

    try {
      const result = await sendMessage(task.command);

      task.lastRunAt = new Date();
      task.runCount++;

      if (!result?.ok) task.failCount++;

      this.observations.push({
        type: 'scheduled_task',
        taskId,
        command: task.command,
        timestamp: new Date().toISOString(),
        success: Boolean(result?.ok),
        error: result?.error || null,
        message: result?.message || null,
        messageId: result?.messageId || null
      });

      if (this.observations.length > 500) {
        this.observations.splice(0, this.observations.length - 500);
      }

      if (result?.ok) {
        console.log(`[Task:${taskId}] ✅ Thành công: ${task.command}`);
      } else {
        console.log(
          `[Task:${taskId}] ❌ Thất bại: ${task.command} → ` +
          `${result?.message || result?.error || 'unknown error'}`
        );
      }

      return result;
    } catch (error) {
      task.lastRunAt = new Date();
      task.runCount++;
      task.failCount++;

      this.observations.push({
        type: 'scheduled_task',
        taskId,
        command: task.command,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        messageId: null
      });

      console.error(`[Task:${taskId}] ❌ ${error.message}`);

      return {
        ok: false,
        error: 'TASK_EXCEPTION',
        message: error.message
      };
    }
  }

  startAll() {
    if (this.startTime) {
      console.warn('[Scheduler] Đã chạy rồi, không khởi động lại');
      return;
    }

    this.startTime = new Date();

    console.log('\n' + '='.repeat(60));
    console.log('  🟢 SCHEDULER ĐANG KHỞI ĐỘNG');
    console.log('='.repeat(60));

    for (const [taskId, task] of this.tasks) {
      if (!task.enabled) {
        console.log(`  ⏭  Bỏ qua task ${taskId} (đã tắt)`);
        continue;
      }

      // Giữ nguyên logic: chạy lần đầu ngay.
      this.runTask(taskId).catch(error => {
        console.error(`[Task:${taskId}] ${error.message}`);
      });

      const intervalId = setInterval(() => {
        if (!task.enabled) return;
        this.runTask(taskId).catch(error => {
          console.error(`[Task:${taskId}] ${error.message}`);
        });
      }, task.intervalMs);

      this.intervals.set(taskId, intervalId);
    }

    console.log('='.repeat(60) + '\n');
  }

  start() {
    this.startAll();
  }

  stopAll() {
    console.log('\n' + '='.repeat(60));
    console.log('  🔴 ĐANG DỪNG TẤT CẢ TASK');
    console.log('='.repeat(60));

    for (const [taskId, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`  ⏹  Dừng task: ${taskId}`);
    }

    this.intervals.clear();
    this.startTime = null;
    console.log('='.repeat(60) + '\n');
  }

  stop() {
    this.stopAll();
  }

  getStatus() {
    const now = Date.now();

    const tasks = [...this.tasks].map(([id, task]) => {
      const lastRunMs = task.lastRunAt?.getTime() ?? null;
      const nextRunInMs =
        this.intervals.has(id) && lastRunMs !== null
          ? Math.max(0, task.intervalMs - (now - lastRunMs))
          : null;

      return {
        id,
        command: task.command,
        description: task.description || null,
        intervalMs: task.intervalMs,
        intervalSeconds: task.intervalMs / 1000,
        enabled: task.enabled,
        running: this.intervals.has(id),
        runCount: task.runCount,
        failCount: task.failCount,
        lastRunAt: task.lastRunAt?.toISOString() || null,
        nextRunInMs,
        nextRunInSeconds:
          nextRunInMs === null ? null : Math.ceil(nextRunInMs / 1000)
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

  status() {
    return this.getStatus();
  }
}

const scheduler = new Scheduler();
const taskSettings = config.tasks || {};

for (const [taskId, task] of Object.entries(DEFAULT_TASKS)) {
  scheduler.add({
    id: taskId,
    command: task.command,
    intervalMs: task.intervalMs,
    description: task.description,
    enabled: taskSettings[taskId] !== false
  });
}

module.exports = {
  Scheduler,
  scheduler,
  DEFAULT_TASKS
};
