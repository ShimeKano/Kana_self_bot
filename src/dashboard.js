const express = require('express');
const path = require('path');
const {
  loadAccounts,
  saveAccounts,
  loadMessages,
  saveMessages,
  getPublicAccounts
} = require('./config-store');
const config = require('../config');
const { aiListener } = require('./ai/ai-listener');

const app = express();
app.use(express.json({ limit: '64kb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

app.get('/api/config', (req, res) => {
  res.json({
    ...getPublicAccounts(),
    messages: loadMessages(),
    ai: aiListener.getStatus()
  });
});

app.post('/api/accounts', (req, res) => {
  const { id, name, token } = req.body || {};
  if (!id || !name || !token) {
    return res.status(400).json({ ok: false, error: 'id, name và token là bắt buộc' });
  }

  const data = loadAccounts();
  if (data.accounts.some(account => account.id === id)) {
    return res.status(409).json({ ok: false, error: 'Account ID đã tồn tại' });
  }

  data.accounts.push({ id, name, token, channels: [] });
  if (!data.activeAccountId) data.activeAccountId = id;
  saveAccounts(data);

  res.status(201).json({ ok: true, accounts: getPublicAccounts() });
});

app.delete('/api/accounts/:id', (req, res) => {
  const data = loadAccounts();
  const before = data.accounts.length;
  data.accounts = data.accounts.filter(account => account.id !== req.params.id);

  if (data.accounts.length === before) {
    return res.status(404).json({ ok: false, error: 'Account không tồn tại' });
  }

  if (data.activeAccountId === req.params.id) {
    data.activeAccountId = data.accounts[0]?.id || null;
  }

  saveAccounts(data);
  res.json({ ok: true, accounts: getPublicAccounts() });
});

app.post('/api/accounts/:id/channels', (req, res) => {
  const { channelId, name } = req.body || {};
  const data = loadAccounts();
  const account = data.accounts.find(item => item.id === req.params.id);

  if (!account) return res.status(404).json({ ok: false, error: 'Account không tồn tại' });
  if (!channelId) return res.status(400).json({ ok: false, error: 'channelId là bắt buộc' });

  account.channels ||= [];
  if (account.channels.some(channel => channel.id === channelId)) {
    return res.status(409).json({ ok: false, error: 'Channel đã tồn tại trong account này' });
  }

  account.channels.push({ id: channelId, name: name || channelId });
  saveAccounts(data);

  res.status(201).json({ ok: true, accounts: getPublicAccounts() });
});

app.delete('/api/accounts/:id/channels/:channelId', (req, res) => {
  const data = loadAccounts();
  const account = data.accounts.find(item => item.id === req.params.id);

  if (!account) return res.status(404).json({ ok: false, error: 'Account không tồn tại' });

  const before = account.channels?.length || 0;
  account.channels = (account.channels || []).filter(channel => channel.id !== req.params.channelId);

  if (account.channels.length === before) {
    return res.status(404).json({ ok: false, error: 'Channel không tồn tại' });
  }

  saveAccounts(data);
  res.json({ ok: true, accounts: getPublicAccounts() });
});

app.post('/api/accounts/:id/active-channel', (req, res) => {
  const { channelId } = req.body || {};
  const data = loadAccounts();
  const account = data.accounts.find(item => item.id === req.params.id);
  if (!account) return res.status(404).json({ ok: false, error: 'Account không tồn tại' });
  if (!(account.channels || []).some(channel => channel.id === channelId)) {
    return res.status(404).json({ ok: false, error: 'Channel không tồn tại trong account' });
  }
  account.activeChannelId = channelId;
  saveAccounts(data);
  res.json({ ok: true, accounts: getPublicAccounts() });
});

app.post('/api/active-account', (req, res) => {
  const { accountId } = req.body || {};
  const data = loadAccounts();

  if (!data.accounts.some(account => account.id === accountId)) {
    return res.status(404).json({ ok: false, error: 'Account không tồn tại' });
  }

  data.activeAccountId = accountId;
  saveAccounts(data);
  res.json({ ok: true, accounts: getPublicAccounts() });
});

app.put('/api/messages', (req, res) => {
  const { defaultMessage, messages } = req.body || {};
  if (typeof defaultMessage !== 'string') {
    return res.status(400).json({ ok: false, error: 'defaultMessage phải là chuỗi' });
  }

  saveMessages({
    defaultMessage,
    messages: messages && typeof messages === 'object' ? messages : {}
  });

  res.json({ ok: true, messages: loadMessages() });
});

app.post('/api/ai/toggle', (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  aiListener.setEnabled(enabled);
  res.json({ ok: true, ai: aiListener.getStatus() });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Kana local dashboard',
    port: config.server.port
  });
});

function startDashboard() {
  app.listen(config.server.port, '127.0.0.1', () => {
    console.log(`[Dashboard] 🚀 http://127.0.0.1:${config.server.port}`);
  });
}

module.exports = { startDashboard };
