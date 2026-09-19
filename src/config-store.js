const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const ACCOUNTS_EXAMPLE = path.join(DATA_DIR, 'accounts.example.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ACCOUNTS_FILE)) fs.copyFileSync(ACCOUNTS_EXAMPLE, ACCOUNTS_FILE);
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify({ defaultMessage: 'hello', messages: [] }, null, 2) + '\n');
  }
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); }

function loadAccounts() { ensureDataFiles(); return readJson(ACCOUNTS_FILE); }
function saveAccounts(value) { ensureDataFiles(); writeJson(ACCOUNTS_FILE, value); }

function normalizeMessages(data) {
  const source = data && typeof data === 'object' ? data : {};
  const defaultMessage = typeof source.defaultMessage === 'string' && source.defaultMessage.trim()
    ? source.defaultMessage.trim() : 'hello';

  if (Array.isArray(source.messages)) {
    return {
      defaultMessage,
      messages: source.messages.filter(item => item && typeof item.text === 'string' && item.text.trim())
        .map((item, index) => ({
          id: String(item.id || `message-${index + 1}`),
          text: item.text.trim(),
          intervalSeconds: Math.max(1, Number(item.intervalSeconds) || 60),
          enabled: item.enabled !== false
        }))
    };
  }

  const legacy = source.messages && typeof source.messages === 'object' ? source.messages : {};
  const legacyIntervals = { tl: 65, tranyeu: 25, pvp: 305, tlt: 60 };
  return {
    defaultMessage,
    messages: Object.entries(legacy)
      .filter(([, text]) => typeof text === 'string' && text.trim())
      .map(([id, text]) => ({
        id: String(id), text: text.trim(),
        intervalSeconds: legacyIntervals[id] || 60, enabled: true
      }))
  };
}

function loadMessages() {
  ensureDataFiles();
  return normalizeMessages(readJson(MESSAGES_FILE));
}

function saveMessages(value) {
  ensureDataFiles();
  const normalized = normalizeMessages(value);
  writeJson(MESSAGES_FILE, normalized);
  return normalized;
}

function maskToken(token) {
  if (!token) return '';
  if (token.length <= 8) return '••••••••';
  return token.slice(0, 4) + '••••••••' + token.slice(-4);
}

function getPublicAccounts() {
  const data = loadAccounts();
  return {
    activeAccountId: data.activeAccountId || null,
    accounts: (data.accounts || []).map(account => ({
      id: account.id, name: account.name, tokenConfigured: Boolean(account.token),
      tokenPreview: maskToken(account.token),
      activeChannelId: account.activeChannelId || account.channels?.[0]?.id || null,
      channels: (account.channels || []).map(channel => ({
        id: channel.id, name: channel.name || channel.id, configured: Boolean(channel.id)
      }))
    }))
  };
}

function getActiveTarget() {
  const data = loadAccounts();
  const account = (data.accounts || []).find(a => a.id === data.activeAccountId) || (data.accounts || [])[0];
  if (!account) return null;
  const channel = (account.channels || []).find(c => c.id === account.activeChannelId) || (account.channels || [])[0];
  if (!account.token || !channel?.id) return null;
  return {
    accountId: account.id, accountName: account.name, token: account.token,
    channelId: channel.id, channelName: channel.name || channel.id
  };
}

module.exports = { DATA_DIR, ACCOUNTS_FILE, MESSAGES_FILE, ensureDataFiles, loadAccounts, saveAccounts,
  loadMessages, saveMessages, getPublicAccounts, getActiveTarget };
