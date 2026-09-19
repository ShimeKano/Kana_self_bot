const { sendMessage } = require('./discord');
const { getActiveTarget, loadMessages } = require('./config-store');
const { aiListener } = require('./ai/ai-listener');

class Scheduler {
  constructor() { this.intervals = new Map(); this.observations = []; this.startTime = null; }

  async runMessage(message) {
    if (aiListener.enabled || !message?.enabled) return;
    const target = getActiveTarget(); if (!target || !message.text?.trim()) return;
    try {
      const result = await sendMessage(message.text.trim(), target);
      this.observations.push({ type:'custom_message', messageId:message.id, text:message.text, accountId:target.accountId, channelId:target.channelId, timestamp:new Date().toISOString(), success:Boolean(result?.ok), error:result?.error || null });
      if (this.observations.length > 500) this.observations.splice(0, this.observations.length - 500);
    } catch (error) {
      this.observations.push({type:'custom_message',messageId:message.id,text:message.text,timestamp:new Date().toISOString(),success:false,error:error.message});
    }
  }

  stopCustomTimers() {
    for (const timer of this.intervals.values()) clearInterval(timer);
    this.intervals.clear();
  }

  sync() {
    if (aiListener.enabled) { this.stopCustomTimers(); return; }
    const desired = new Map(loadMessages().messages.map(m => [m.id, m]));
    for (const [id, timer] of this.intervals) {
      if (!desired.has(id) || !desired.get(id).enabled) { clearInterval(timer); this.intervals.delete(id); }
    }
    for (const message of desired.values()) {
      if (!message.enabled || this.intervals.has(message.id)) continue;
      this.runMessage(message);
      this.intervals.set(message.id, setInterval(() => this.runMessage(message), message.intervalSeconds * 1000));
    }
  }

  startAll() {
    if (this.startTime) return;
    this.startTime = new Date(); this.sync();
    this.configTimer = setInterval(() => this.sync(), 2000);
  }
  start() { this.startAll(); }
  stopAll() {
    this.stopCustomTimers();
    if (this.configTimer) clearInterval(this.configTimer);
    this.configTimer = null; this.startTime = null;
  }
  stop() { this.stopAll(); }
  getStatus() {
    const messages = loadMessages().messages;
    return { running:this.intervals.size > 0, startTime:this.startTime?.toISOString() || null, activeTasks:this.intervals.size, totalTasks:messages.length,
      tasks:messages.map(m => ({id:m.id,text:m.text,intervalSeconds:m.intervalSeconds,enabled:m.enabled,running:this.intervals.has(m.id)})),
      recentLogs:this.observations.slice(-20) };
  }
  status() { return this.getStatus(); }
}
const scheduler = new Scheduler();
module.exports = { Scheduler, scheduler };
