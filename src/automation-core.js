const DEFAULT_TASKS = Object.freeze({
  tl: { intervalMs: 65_000, command: '.tl' },
  tranyeu: { intervalMs: 25_000, command: '.tranyeu' },
  pvp: { intervalMs: 305_000, command: '.pvp' }
});

class TltStateMachine {
  constructor({ command = '.tlt', buttonLabels = ['Bắt Đầu', 'Tiếp Tục'], responseTimeoutMs = 20_000 } = {}) {
    this.command = command;
    this.buttonLabels = buttonLabels;
    this.responseTimeoutMs = responseTimeoutMs;
    this.state = 'IDLE';
    this.lastCommandAt = null;
    this.lastMessageId = null;
  }

  begin(now = Date.now()) {
    if (this.state !== 'IDLE') return { ok: false, reason: 'busy', state: this.state };
    this.state = 'WAITING_RESPONSE';
    this.lastCommandAt = now;
    this.lastMessageId = null;
    return { ok: true, action: { type: 'SEND_COMMAND', command: this.command } };
  }

  observe(message) {
    if (this.state !== 'WAITING_RESPONSE' && this.state !== 'WAITING_BUTTON') return null;
    if (!message?.id || (this.lastCommandAt && message.createdTimestamp && message.createdTimestamp < this.lastCommandAt)) return null;

    const buttons = (message.components || []).flatMap(row => row.components || [])
      .filter(component => component.type === 2 || component.type === 'button')
      .map(component => ({ id: component.custom_id, label: component.label }));

    const target = buttons.find(button => this.buttonLabels.some(label => button.label === label || button.label?.includes(label)));
    if (!target) return null;

    this.state = 'WAITING_BUTTON';
    this.lastMessageId = message.id;
    return {
      type: 'BUTTON_REQUIRED',
      messageId: message.id,
      buttonId: target.id,
      label: target.label
    };
  }

  complete() {
    this.state = 'IDLE';
    return { ok: true, state: this.state };
  }

  timeout(now = Date.now()) {
    if (this.state === 'IDLE' || !this.lastCommandAt) return false;
    return now - this.lastCommandAt >= this.responseTimeoutMs;
  }

  status() {
    return {
      state: this.state,
      lastCommandAt: this.lastCommandAt,
      lastMessageId: this.lastMessageId,
      responseTimeoutMs: this.responseTimeoutMs
    };
  }
}

module.exports = { DEFAULT_TASKS, TltStateMachine };
