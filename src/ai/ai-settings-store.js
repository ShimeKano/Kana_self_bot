const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const AI_FILE = path.join(DATA_DIR, 'ai.json');

const DEFAULTS = {
  enabled: false,
  apiKey: '',
  provider: null,
  apiBase: null,
  model: null,
  models: [],
  updatedAt: null
};

function ensureAiFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AI_FILE)) fs.writeFileSync(AI_FILE, JSON.stringify(DEFAULTS, null, 2) + '\n', 'utf8');
}

function loadAiSettings() {
  ensureAiFile();
  try {
    const raw = JSON.parse(fs.readFileSync(AI_FILE, 'utf8'));
    return { ...DEFAULTS, ...raw, models: Array.isArray(raw.models) ? raw.models : [] };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveAiSettings(changes = {}) {
  const next = { ...loadAiSettings(), ...changes, updatedAt: new Date().toISOString() };
  fs.writeFileSync(AI_FILE, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}

function getPublicAiSettings() {
  const data = loadAiSettings();
  return {
    enabled: Boolean(data.enabled),
    provider: data.provider || null,
    apiConfigured: Boolean(data.apiKey),
    apiPreview: data.apiKey ? '••••••••••••' : '',
    apiBase: data.apiBase || null,
    model: data.model || null,
    models: data.models || [],
    updatedAt: data.updatedAt || null
  };
}

module.exports = { AI_FILE, loadAiSettings, saveAiSettings, getPublicAiSettings };
