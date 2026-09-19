const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'data', 'memory');

function ensureMemoryDir() { fs.mkdirSync(MEMORY_DIR, { recursive: true }); }

function memoryFile(accountId) {
  const safeId = String(accountId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!safeId) throw new Error('accountId không hợp lệ');
  return path.join(MEMORY_DIR, safeId + '.mess.txt');
}

function loadMemory(accountId, limit = 40) {
  ensureMemoryDir();
  const file = memoryFile(accountId);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).slice(-Math.max(1, limit)).flatMap(line => {
    try {
      const item = JSON.parse(line);
      return item?.content ? [{ authorId: item.authorId || 'user', content: String(item.content) }] : [];
    } catch { return []; }
  });
}

function appendMemory(accountId, entries) {
  if (!accountId || !Array.isArray(entries) || !entries.length) return;
  ensureMemoryDir();
  const lines = entries.filter(item => item && String(item.content || '').trim()).map(item => JSON.stringify({
    timestamp: item.timestamp || new Date().toISOString(),
    authorId: item.authorId || 'user',
    content: String(item.content).trim()
  }));
  if (lines.length) fs.appendFileSync(memoryFile(accountId), lines.join('\n') + '\n', 'utf8');
}

function clearMemory(accountId) {
  const file = memoryFile(accountId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { MEMORY_DIR, memoryFile, loadMemory, appendMemory, clearMemory };
