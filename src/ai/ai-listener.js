const { fetchLatestMessages, fetchCurrentUser, sendMessage } = require('../discord');
const { getActiveTarget } = require('../config-store');
const { generateReply } = require('./ai-service');

class AiListener {
  constructor() {
    this.enabled = false;
    this.intervalMs = Number(process.env.AI_POLL_INTERVAL_MS || 5000);
    this.cooldownMs = Number(process.env.AI_COOLDOWN_MS || 5000);
    this.timer = null;
    this.lastChannelId = null;
    this.seenIds = new Set();
    this.history = [];
    this.lastReplyAt = 0;
    this.userId = null;
    this.processing = false;
  }

  async poll() {
    if (!this.enabled || this.processing) return;
    const target = getActiveTarget();
    if (!target) return;

    if (this.lastChannelId !== target.channelId) {
      this.lastChannelId = target.channelId;
      this.seenIds.clear();
      this.history = [];
      this.userId = null;
    }

    this.processing = true;
    try {
      if (!this.userId) {
        const identity = await fetchCurrentUser(target);
        if (identity.ok) this.userId = identity.data?.id || null;
      }

      const result = await fetchLatestMessages(20, target);
      if (!result.ok) return;

      for (const message of [...(result.data || [])].reverse()) {
        if (!message?.id || this.seenIds.has(message.id)) continue;
        this.seenIds.add(message.id);
        if (!message.content?.trim()) continue;
        if (this.userId && message.author?.id === this.userId) continue;
        if (message.author?.bot) continue;

        const normalized = {
          authorId: message.author?.id || 'user',
          content: String(message.content).trim()
        };
        this.history.push(normalized);
        if (this.history.length > 20) this.history.shift();

        if (Date.now() - this.lastReplyAt < this.cooldownMs) continue;

        const reply = await generateReply(normalized, this.history.slice(0, -1));
        const sent = await sendMessage(reply, target);
        if (sent.ok) {
          this.lastReplyAt = Date.now();
          this.history.push({ authorId: 'assistant', content: reply });
          if (this.history.length > 20) this.history.shift();
        }
      }
    } finally {
      this.processing = false;
    }
  }

  start() {
    if (this.timer) return;
    this.enabled = true;
    this.poll().catch(error => console.error('[AI]', error.message));
    this.timer = setInterval(() => this.poll().catch(error => console.error('[AI]', error.message)), this.intervalMs);
  }

  stop() {
    this.enabled = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.processing = false;
  }

  setEnabled(enabled) {
    if (enabled) this.start();
    else this.stop();
    return this.enabled;
  }

  getStatus() {
    const target = getActiveTarget();
    return {
      enabled: this.enabled,
      running: Boolean(this.timer),
      channelId: target?.channelId || null,
      accountId: target?.accountId || null,
      pollIntervalMs: this.intervalMs,
      cooldownMs: this.cooldownMs
    };
  }
}

const aiListener = new AiListener();
module.exports = { AiListener, aiListener };
