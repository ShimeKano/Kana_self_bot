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
    this.lastError = null;
    this.lastEventAt = null;
    this.repliesSent = 0;
    this.logs = [];
  }

  log(level, message, data = null) {
    const entry = { time: new Date().toISOString(), level, message, ...(data ? { data } : {}) };
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs.splice(0, this.logs.length - 200);
    const line = `[AI][${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    if (level === 'ERROR') console.error(line); else console.log(line);
  }

  async poll() {
    if (!this.enabled || this.processing) return;
    const target = getActiveTarget();
    const settings = loadAiSettings();
    if (!target || !settings.apiKey || !settings.provider || !settings.model) {
      this.log('WARN', 'AI chưa sẵn sàng', { hasTarget: Boolean(target), apiConfigured: Boolean(settings.apiKey), provider: settings.provider || null, model: settings.model || null });
      return;
    }

    if (this.lastChannelId !== target.channelId || this.lastAccountId !== target.accountId) {
      this.lastChannelId = target.channelId;
      this.lastAccountId = target.accountId;
      this.seenIds.clear();
      this.history = loadMemory(target.accountId, 40);
      this.userId = null;
      this.log('INFO', 'Đổi AI target', { accountId: target.accountId, channelId: target.channelId });
    }

    this.processing = true;
    try {
      if (!this.userId) {
        const identity = await fetchCurrentUser(target);
        if (!identity.ok) {
          this.log('ERROR', 'Không lấy được Discord identity', { error: identity.message || identity.error || 'unknown error' });
          this.lastError = 'Discord identity: ' + (identity.message || identity.error || 'unknown error');
          return;
        }
        this.userId = identity.data?.id || null;
        this.log('INFO', 'Discord identity OK', { userId: this.userId });
      }

      const result = await fetchLatestMessages(20, target);
      if (!result.ok) {
        this.log('ERROR', 'Không đọc được channel messages', { error: result.message || result.error || 'unknown error' });
        this.lastError = 'Discord messages: ' + (result.message || result.error || 'unknown error');
        return;
      }

      for (const message of [...(result.data || [])].reverse()) {
        if (!message?.id || this.seenIds.has(message.id)) continue;
        if (!message.content?.trim()) {
          this.seenIds.add(message.id);
          continue;
        }
        if (this.userId && message.author?.id === this.userId) {
          this.seenIds.add(message.id);
          continue;
        }
        if (message.author?.bot) {
          this.seenIds.add(message.id);
          continue;
        }
        if (Date.now() - this.lastReplyAt < this.cooldownMs) continue;

        const normalized = {
          authorId: message.author?.id || 'user',
          content: String(message.content).trim()
        };
        this.log('IN', 'Nhận tin nhắn', { messageId: message.id, authorId: normalized.authorId, content: normalized.content });

        try {
          const history = this.history.slice(-20);
          this.log('AI', 'Đang tạo reply', { model: settings.model, historyMessages: history.length, content: normalized.content });
          const reply = await generateReply({
            ...settings,
            message: normalized,
            history
          });

          this.log('OUT', 'AI tạo reply', { content: reply });
          const sent = await sendMessage(reply, target);
          if (!sent.ok) {
            this.log('ERROR', 'Gửi reply thất bại', { error: sent.message || sent.error || 'unknown error', content: reply });
            this.lastError = 'Discord send: ' + (sent.message || sent.error || 'unknown error');
            continue;
          }

          this.lastReplyAt = Date.now();
          this.lastEventAt = new Date().toISOString();
          this.repliesSent += 1;
          this.log('SENT', 'Đã gửi reply thành công', { content: reply });
          this.lastError = null;
          this.history.push(normalized, { authorId: 'assistant', content: reply });
          this.history = this.history.slice(-40);
          appendMemory(target.accountId, [normalized, { authorId: 'assistant', content: reply }]);

          // Only mark a message as seen after a successful response or an intentional skip.
          this.seenIds.add(message.id);
        } catch (error) {
          // Keep the message unseen so a transient API failure can be retried.
          this.lastError = error.message;
          console.error('[AI] ' + error.message);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  start() {
    if (this.timer) return;
    this.enabled = true;
    this.lastError = null;
    this.poll().catch(error => {
      this.lastError = error.message;
      console.error('[AI] ' + error.message);
    });
    this.timer = setInterval(() => this.poll().catch(error => {
      this.lastError = error.message;
      console.error('[AI] ' + error.message);
    }), this.intervalMs);
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
      memoryMessages: target ? loadMemory(target.accountId, 100000).length : 0,
      lastError: this.lastError,
      lastEventAt: this.lastEventAt,
      repliesSent: this.repliesSent,
      logs: this.logs.slice(-200)
    };
  }
}

const aiListener = new AiListener();
module.exports = { AiListener, aiListener };
