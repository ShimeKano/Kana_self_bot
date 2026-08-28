const { sendMessage } = require('./discord');
const config = require('../config');

// Định nghĩa các task mặc định
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
    intervalMs: 305_000, // 5 phút 5 giây
    description: 'Lệnh PvP - mỗi 5 phút 5 giây'
  },
  tlt: {
    id: 'tlt',
    command: '.tlt',
    intervalMs: 60_000, // 1 phút
    description: 'Lệnh TLT - mỗi 1 phút'
  }
});

/**
 * Class Scheduler - Quản lý các task định kỳ
 */
class Scheduler {
  constructor() {
    this.tasks = new Map();       // Map <taskId, taskConfig>
    this.intervals = new Map();   // Map <taskId, intervalId>
    this.observations = [];       // Lịch sử thực thi
    this.startTime = null;
  }

  /**
   * Thêm task vào scheduler
   * @param {Object} config - Cấu hình task
   */
  add(config) {
    const task = {
      enabled: true,
      lastRunAt: null,
      runCount: 0,
      failCount: 0,
      ...config
    };
    this.tasks.set(task.id, task);
    console.log(`[Scheduler] Đăng ký task: ${task.command} (${task.intervalMs / 1000}s)`);
  }

  /**
   * Bật task theo id
   */
  enable(taskId) {
    if (this.tasks.has(taskId)) {
      this.tasks.get(taskId).enabled = true;
    }
  }

  /**
   * Tắt task theo id
   */
  disable(taskId) {
    if (this.tasks.has(taskId)) {
      this.tasks.get(taskId).enabled = false;
    }
  }

  /**
   * Chạy một task ngay lập tức
   */
  async runTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return { ok: false, error: 'TASK_NOT_FOUND' };
    if (!task.enabled) return { ok: false, error: 'TASK_DISABLED' };

    console.log(`[Task:${taskId}] Đang gửi: ${task.command}`);
    const result = await sendMessage(task.command);

    task.lastRunAt = new Date();
    task.runCount++;

    if (!result.ok) {
      task.failCount++;
    }

    this.observations.push({
      taskId,
      command: task.command,
      timestamp: new Date().toISOString(),
      success: result.ok,
      error: result.error || null,
      messageId: result.messageId || null
    });

    if (result.ok) {
      console.log(`[Task:${taskId}] ✅ Thành công: ${task.command}`);
    } else {
      console.log(`[Task:${taskId}] ❌ Thất bại: ${task.command} → ${result.message}`);
    }

    return result;
  }

  /**
   * Bắt đầu chạy tất cả task đã đăng ký
   */
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

      // Chạy lần đầu ngay
      this.runTask(taskId);

      // Thiết lập chu kỳ lặp lại
      const intervalId = setInterval(
        () => this.runTask(taskId),
        task.intervalMs
      );
      this.intervals.set(taskId, intervalId);
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Dừng tất cả task
   */
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

  /**
   * Lấy trạng thái chi tiết
   */
  getStatus() {
    const taskList = [];
    for (const [id, task] of this.tasks) {
      taskList.push({
        id,
        command: task.command,
        intervalMs: task.intervalMs,
        enabled: task.enabled,
        runCount: task.runCount,
        failCount: task.failCount,
        lastRunAt: task.lastRunAt?.toISOString() || null
      });
    }

    return {
      running: this.intervals.size > 0,
      startTime: this.startTime?.toISOString() || null,
      activeTasks: this.intervals.size,
      totalTasks: this.tasks.size,
      tasks: taskList,
      recentLogs: this.observations.slice(-20) // 20 log gần nhất
    };
  }
}

// === Khởi tạo & đăng ký tất cả task ===
const scheduler = new Scheduler();

for (const [taskId, taskConfig] of Object.entries(DEFAULT_TASKS)) {
  // Kiểm tra xem task có được bật trong .env không
  const isEnabled = config.tasks[taskId] !== false;

  scheduler.add({
    id: taskId,
    command: taskConfig.command,
    intervalMs: taskConfig.intervalMs,
    enabled: isEnabled
  });
}

module.exports = {
  scheduler,
  DEFAULT_TASKS
};
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
