const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const ACCOUNTS_EXAMPLE = path.join(DATA_DIR, 'accounts.example.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.copyFileSync(ACCOUNTS_EXAMPLE, ACCOUNTS_FILE);
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(
      MESSAGES_FILE,
      JSON.stringify({ defaultMessage: '.tlt', messages: {} }, null, 2) + '\n'
    );
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function loadAccounts() {
  ensureDataFiles();
  return readJson(ACCOUNTS_FILE);
}

function saveAccounts(value) {
  ensureDataFiles();
  writeJson(ACCOUNTS_FILE, value);
}

function loadMessages() {
  ensureDataFiles();
  return readJson(MESSAGES_FILE);
}

function saveMessages(value) {
  ensureDataFiles();
  writeJson(MESSAGES_FILE, value);
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
      id: account.id,
      name: account.name,
      tokenConfigured: Boolean(account.token),
      tokenPreview: maskToken(account.token),
      channels: (account.channels || []).map(channel => ({
        id: channel.id,
        name: channel.name || channel.id,
        configured: Boolean(channel.id)
      }))
    }))
  };
}

function getActiveTarget() {
  const data = loadAccounts();
  const account = (data.accounts || []).find(a => a.id === data.activeAccountId)
    || (data.accounts || [])[0];

  if (!account) return null;

  const channel = (account.channels || [])[0];
  if (!account.token || !channel?.id) return null;

  return {
    accountId: account.id,
    accountName: account.name,
    token: account.token,
    channelId: channel.id,
    channelName: channel.name || channel.id
  };
}

module.exports = {
  DATA_DIR,
  ACCOUNTS_FILE,
  MESSAGES_FILE,
  ensureDataFiles,
  loadAccounts,
  saveAccounts,
  loadMessages,
  saveMessages,
  getPublicAccounts,
  getActiveTarget
};
