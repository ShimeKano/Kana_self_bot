class Scheduler {
  constructor({ tasks = [], clock = () => Date.now(), onError = console.error } = {}) {
    this.tasks = new Map(tasks.map(task => [task.id, { ...task, nextRunAt: null, running: false, runs: 0, failures: 0 }]));
    this.clock = clock;
    this.onError = onError;
    this.timer = null;
  }

  add(task) {
    if (!task?.id || !Number.isFinite(task.intervalMs) || typeof task.run !== 'function') {
      throw new Error('Task requires id, intervalMs and run()');
    }
    this.tasks.set(task.id, { ...task, nextRunAt: null, running: false, runs: 0, failures: 0 });
  }

  start() {
    if (this.timer) return;
    const now = this.clock();
    for (const task of this.tasks.values()) {
      if (task.enabled !== false && task.nextRunAt === null) task.nextRunAt = now;
    }
    this.#arm();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  async tick() {
    const now = this.clock();
    const due = [...this.tasks.values()]
      .filter(task => task.enabled !== false && !task.running && task.nextRunAt !== null && task.nextRunAt <= now)
      .sort((a, b) => a.nextRunAt - b.nextRunAt);

    for (const task of due) {
      task.running = true;
      task.nextRunAt = now + task.intervalMs;
      try {
        await task.run({ taskId: task.id, scheduledAt: now });
        task.runs += 1;
      } catch (error) {
        task.failures += 1;
        this.onError(`[Scheduler] ${task.id} failed: ${error.message}`);
      } finally {
        task.running = false;
      }
    }

    this.#arm();
  }

  setEnabled(id, enabled) {
    const task = this.tasks.get(id);
    if (!task) return false;
    task.enabled = Boolean(enabled);
    if (task.enabled && task.nextRunAt === null) task.nextRunAt = this.clock();
    return true;
  }

  status() {
    const now = this.clock();
    return [...this.tasks.values()].map(task => ({
      id: task.id,
      enabled: task.enabled !== false,
      running: task.running,
      intervalMs: task.intervalMs,
      nextRunAt: task.nextRunAt,
      dueInMs: task.nextRunAt === null ? null : Math.max(0, task.nextRunAt - now),
      runs: task.runs,
      failures: task.failures
    }));
  }

  #arm() {
    if (this.timer) clearTimeout(this.timer);
    const next = [...this.tasks.values()]
      .filter(task => task.enabled !== false && !task.running && task.nextRunAt !== null)
      .reduce((min, task) => Math.min(min, task.nextRunAt), Infinity);
    if (!Number.isFinite(next)) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.tick().catch(error => this.onError(`[Scheduler] tick failed: ${error.message}`));
    }, Math.max(0, next - this.clock()));
  }
}

module.exports = { Scheduler };
