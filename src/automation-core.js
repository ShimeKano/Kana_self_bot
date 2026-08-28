const { sendMessage } = require('./discord'); // ✅ Import hàm gửi tin nhắn

const DEFAULT_TASKS = Object.freeze({
  tl: { intervalMs: 65_000, command: '.tl' },
  tranyeu: { intervalMs: 25_000, command: '.tranyeu' },
  pvp: { intervalMs: 305_000, command: '.pvp' },
  tlt: { intervalMs: 60_000, command: '.tlt' } // lệnh mới
});

class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.intervals = new Map();
    this.observations = [];
  }

  add({ id, intervalMs, enabled = true, run }) {
    this.tasks.set(id, { id, intervalMs, enabled, run });
  }

  startAll() {
    for (const [id, task] of this.tasks) {
      if (!task.enabled) continue;
      this._startTask(task);
    }
  }

  _startTask(task) {
    // Chạy lần đầu ngay lập tức
    task.run();
    // Lặp lại theo chu kỳ
    const timer = setInterval(() => task.run(), task.intervalMs);
    this.intervals.set(task.id, timer);
  }

  stopAll() {
    for (const timer of this.intervals.values()) clearInterval(timer);
    this.intervals.clear();
  }

  getStatus() {
    return {
      running: this.intervals.size > 0,
      activeTasks: this.intervals.size,
      observations: [...this.observations]
    };
  }
}

const scheduler = new Scheduler();

// Đăng ký tất cả task
for (const [id, task] of Object.entries(DEFAULT_TASKS)) {
  scheduler.add({
    id,
    intervalMs: task.intervalMs,
    enabled: true, // sau này có thể đọc từ config
    run: async () => {
      console.log(`[Scheduler] Đang gửi: ${task.command}`);
      const result = await sendMessage(task.command); // ✅ GỬI TIN NHẮN THẬT
      scheduler.observations.push({
        type: 'scheduled_task',
        taskId: id,
        command: task.command,
        success: result.ok,
        timestamp: new Date().toISOString()
      });
      if (!result.ok) {
        console.error(`[Scheduler] Gửi ${task.command} thất bại: ${result.error}`);
      } else {
        console.log(`[Scheduler] ✅ Đã gửi: ${task.command}`);
      }
    }
  });
}

module.exports = { scheduler, DEFAULT_TASKS };
