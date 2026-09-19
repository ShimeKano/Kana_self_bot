const express = require('express');
const path = require('path');
const { loadAccounts, saveAccounts, loadMessages, saveMessages, getPublicAccounts } = require('./config-store');
const config = require('../config');
const { aiListener } = require('./ai/ai-listener');
const { scheduler } = require('./automation-core');

const app = express();
app.use(express.json({ limit: '64kb' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'web', 'index.html')));

app.get('/api/config', (req, res) => res.json({
  ...getPublicAccounts(), messages: loadMessages(), ai: aiListener.getStatus(), scheduler: scheduler.getStatus()
}));

app.post('/api/accounts', (req, res) => {
  const { id, name, token } = req.body || {};
  if (!id || !name || !token) return res.status(400).json({ ok:false, error:'id, name và token là bắt buộc' });
  const data = loadAccounts();
  if (data.accounts.some(a => a.id === id)) return res.status(409).json({ ok:false, error:'Account ID đã tồn tại' });
  data.accounts.push({ id, name, token, channels: [] });
  if (!data.activeAccountId) data.activeAccountId = id;
  saveAccounts(data); res.status(201).json({ ok:true, accounts:getPublicAccounts() });
});

app.delete('/api/accounts/:id', (req, res) => {
  const data = loadAccounts(), before = data.accounts.length;
  data.accounts = data.accounts.filter(a => a.id !== req.params.id);
  if (data.accounts.length === before) return res.status(404).json({ ok:false, error:'Account không tồn tại' });
  if (data.activeAccountId === req.params.id) data.activeAccountId = data.accounts[0]?.id || null;
  saveAccounts(data); res.json({ ok:true, accounts:getPublicAccounts() });
});

app.post('/api/accounts/:id/channels', (req, res) => {
  const { channelId, name } = req.body || {}, data = loadAccounts();
  const account = data.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ ok:false, error:'Account không tồn tại' });
  if (!channelId) return res.status(400).json({ ok:false, error:'channelId là bắt buộc' });
  account.channels ||= [];
  if (account.channels.some(c => c.id === channelId)) return res.status(409).json({ ok:false, error:'Channel đã tồn tại trong account này' });
  account.channels.push({ id:channelId, name:name || channelId }); saveAccounts(data);
  res.status(201).json({ ok:true, accounts:getPublicAccounts() });
});

app.delete('/api/accounts/:id/channels/:channelId', (req, res) => {
  const data = loadAccounts(), account = data.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ ok:false, error:'Account không tồn tại' });
  const before = account.channels?.length || 0;
  account.channels = (account.channels || []).filter(c => c.id !== req.params.channelId);
  if (account.channels.length === before) return res.status(404).json({ ok:false, error:'Channel không tồn tại' });
  saveAccounts(data); res.json({ ok:true, accounts:getPublicAccounts() });
});

app.post('/api/accounts/:id/active-channel', (req, res) => {
  const { channelId } = req.body || {}, data = loadAccounts();
  const account = data.accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ ok:false, error:'Account không tồn tại' });
  if (!(account.channels || []).some(c => c.id === channelId)) return res.status(404).json({ ok:false, error:'Channel không tồn tại trong account' });
  account.activeChannelId = channelId; saveAccounts(data); res.json({ ok:true, accounts:getPublicAccounts() });
});

app.post('/api/active-account', (req, res) => {
  const { accountId } = req.body || {}, data = loadAccounts();
  if (!data.accounts.some(a => a.id === accountId)) return res.status(404).json({ ok:false, error:'Account không tồn tại' });
  data.activeAccountId = accountId; saveAccounts(data); res.json({ ok:true, accounts:getPublicAccounts() });
});

function parseMessageInput(body) {
  const texts = String(body.text || '').split(',').map(s => s.trim()).filter(Boolean);
  const intervalSeconds = Number(body.intervalSeconds);
  if (!texts.length) throw new Error('Tin nhắn không được để trống');
  if (!Number.isFinite(intervalSeconds) || intervalSeconds < 1) throw new Error('Thời gian phải từ 1 giây');
  return { text:texts.join(', '), intervalSeconds:Math.floor(intervalSeconds), enabled:body.enabled !== false };
}

app.post('/api/messages', (req, res) => {
  try {
    const item = parseMessageInput(req.body || {});
    const data = loadMessages();
    const id = String(req.body.id || `message-${Date.now()}`);
    if (data.messages.some(m => m.id === id)) return res.status(409).json({ ok:false, error:'Message ID đã tồn tại' });
    data.messages.push({ id, ...item });
    if (!data.defaultMessage) data.defaultMessage = data.messages[0].text;
    saveMessages(data); res.status(201).json({ ok:true, messages:loadMessages() });
  } catch (e) { res.status(400).json({ ok:false, error:e.message }); }
});

app.put('/api/messages/:id', (req, res) => {
  try {
    const data = loadMessages(), item = data.messages.find(m => m.id === req.params.id);
    if (!item) return res.status(404).json({ ok:false, error:'Message không tồn tại' });
    Object.assign(item, parseMessageInput(req.body || {})); saveMessages(data);
    res.json({ ok:true, messages:loadMessages() });
  } catch (e) { res.status(400).json({ ok:false, error:e.message }); }
});

app.delete('/api/messages/:id', (req, res) => {
  const data = loadMessages(), before = data.messages.length;
  data.messages = data.messages.filter(m => m.id !== req.params.id);
  if (data.messages.length === before) return res.status(404).json({ ok:false, error:'Message không tồn tại' });
  if (!data.messages.length) data.defaultMessage = 'hello';
  else if (!data.messages.some(m => m.text === data.defaultMessage)) data.defaultMessage = data.messages[0].text;
  saveMessages(data); res.json({ ok:true, messages:loadMessages() });
});

app.post('/api/messages/default', (req, res) => {
  const data = loadMessages(), item = data.messages.find(m => m.id === req.body?.id);
  if (!item) return res.status(404).json({ ok:false, error:'Message không tồn tại' });
  data.defaultMessage = item.text; saveMessages(data); res.json({ ok:true, messages:loadMessages() });
});

app.post('/api/ai/toggle', (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  aiListener.setEnabled(enabled);
  if (enabled) scheduler.stopCustomTimers(); else scheduler.sync();
  res.json({ ok:true, ai:aiListener.getStatus(), scheduler:scheduler.getStatus() });
});

app.get('/api/health', (req, res) => res.json({ ok:true, service:'Kana local dashboard', port:config.server.port }));
function startDashboard() { app.listen(config.server.port, '127.0.0.1', () => console.log(`[Dashboard] 🚀 http://127.0.0.1:${config.server.port}`)); }
module.exports = { startDashboard };
