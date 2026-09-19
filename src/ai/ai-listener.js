const { fetchLatestMessages, fetchCurrentUser, sendMessage } = require('../discord');
const { getActiveTarget } = require('../config-store');
const { loadAiSettings } = require('./ai-settings-store');
const { generateReply } = require('./ai-provider');
const { loadMemory, appendMemory } = require('../memory-store');

class AiListener {
  constructor() {
    this.enabled = false;
    this.intervalMs = 5000;
    this.cooldownMs = 5000;
    this.timer = null;
    this.lastChannelId = null;
    this.lastAccountId = null;
    this.seenIds = new Set();
    this.history = [];
    this.lastReplyAt = 0;
    this.userId = null;
    this.processing = false;
  }

  async poll() {
    if (!this.enabled || this.processing) return;
    const target = getActiveTarget();
    const settings = loadAiSettings();
    if (!target || !settings.apiKey || !settings.provider || !settings.model) return;

    if (this.lastChannelId !== target.channelId || this.lastAccountId !== target.accountId) {
      this.lastChannelId = target.channelId;
      this.lastAccountId = target.accountId;
      this.seenIds.clear();
      this.history = loadMemory(target.accountId, 40);
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
        if (Date.now() - this.lastReplyAt < this.cooldownMs) continue;

        const normalized = { authorId: message.author?.id || 'user', content: String(message.content).trim() };
        this.history.push(normalized);
        if (this.history.length > 40) this.history.shift();

        const reply = await generateReply({ ...settings, message: normalized, history: this.history.slice(0, -1) });
        const sent = await sendMessage(reply, target);
        if (sent.ok) {
          this.lastReplyAt = Date.now();
          const assistant = { authorId: 'assistant', content: reply };
          this.history.push(assistant);
          appendMemory(target.accountId, [normalized, assistant]);
          if (this.history.length > 40) this.history.shift();
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
    if (enabled && !loadAiSettings().apiKey) throw new Error('Hãy cấu hình API trong Dashboard trước');
    if (enabled && !loadAiSettings().model) throw new Error('Hãy Scan API và chọn model trước');
    if (enabled) this.start(); else this.stop();
    return this.enabled;
  }

  getStatus() {
    const target = getActiveTarget();
    const settings = loadAiSettings();
    return {
      enabled: this.enabled,
      running: Boolean(this.timer),
      channelId: target?.channelId || null,
      accountId: target?.accountId || null,
      provider: settings.provider || null,
      model: settings.model || null,
      apiConfigured: Boolean(settings.apiKey),
      memoryMessages: target ? loadMemory(target.accountId, 100000).length : 0
    };
  }
}
const aiListener = new AiListener();
module.exports = { AiListener, aiListener };
