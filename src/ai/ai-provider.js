const PROVIDERS = {
  openai: { name: 'OpenAI', base: 'https://api.openai.com/v1' },
  openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1' },
  ollama: { name: 'Ollama', base: 'http://127.0.0.1:11434' }
};

function detectProvider(apiKey) {
  const key = String(apiKey || '').trim();
  if (key.startsWith('sk-or-v1-')) return { id: 'openrouter', ...PROVIDERS.openrouter };
  if (key.startsWith('sk-')) return { id: 'openai', ...PROVIDERS.openai };
  return null;
}

function cleanModels(data) {
  const list = Array.isArray(data?.data) ? data.data : [];
  return list.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean).map(String)
    .filter(id => !/(embedding|whisper|tts|dall-e|moderation|transcri|audio|image-generation)/i.test(id))
    .sort((a, b) => a.localeCompare(b));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('AI provider timeout sau '+Math.round(timeoutMs/1000)+' giây');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function scanModels(apiKey) {
  const provider = detectProvider(apiKey);
  if (!provider) throw new Error('Không nhận diện được API key. Hiện hỗ trợ API key OpenAI và OpenRouter.');
  const response = await fetchWithTimeout(provider.base + '/models', { headers: { Authorization: 'Bearer ' + String(apiKey).trim() } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(provider.name + ' HTTP ' + response.status + (body ? ': ' + body.slice(0, 180) : ''));
  }
  const models = cleanModels(await response.json());
  if (!models.length) throw new Error(provider.name + ' không trả về model chat khả dụng');
  return { provider, models };
}

async function scanOllamaModels(base = PROVIDERS.ollama.base) {
  const root = String(base).replace(/\/$/, '');
  const response = await fetchWithTimeout(root + '/api/tags', {}, 10000);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error('Ollama HTTP ' + response.status + (body ? ': ' + body.slice(0, 180) : ''));
  }
  const data = await response.json();
  const models = Array.isArray(data?.models) ? data.models.map(x => x?.name).filter(Boolean) : [];
  return { provider: { id: 'ollama', ...PROVIDERS.ollama }, models };
}

async function generateReply({ apiKey, providerId, provider, apiBase, model, message, history = [] }) {
  const selectedId = providerId || provider;
  if (selectedId === 'ollama') return generateOllamaReply({ apiBase, model, message, history });

  const selected = PROVIDERS[selectedId];
  if (!selected) throw new Error('AI provider chưa được cấu hình');
  if (!apiKey) throw new Error('API key không có; hãy nhập API key để dùng provider này');

  const base = String(apiBase || selected.base).replace(/\/$/, '');
  const messages = buildMessages(message, history);
  const response = await fetchWithTimeout(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + String(apiKey).trim() },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 500 })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(selected.name + ' HTTP ' + response.status + (body ? ': ' + body.slice(0, 220) : ''));
  }
  const data = await response.json();
  const reply = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!reply) throw new Error(selected.name + ' trả về câu trả lời rỗng');
  return reply.slice(0, 2000);
}

function buildMessages(message, history) {
  return [
    { role: 'system', content: 'You are a friendly Discord chat participant. Reply naturally in the same language when possible. Keep replies concise unless detail is clearly requested. Do not mention that you are an AI unless asked.' },
    ...history.slice(-20).map(item => ({ role: item.authorId === 'assistant' ? 'assistant' : 'user', content: String(item.content || '') })),
    { role: 'user', content: String(message.content || '') }
  ];
}

async function generateOllamaReply({ apiBase, model, message, history = [] }) {
  const base = String(apiBase || PROVIDERS.ollama.base).replace(/\/$/, '');
  if (!model) throw new Error('Chưa chọn Ollama model');
  const response = await fetchWithTimeout(base + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: buildMessages(message, history), stream: false, options: { temperature: 0.8 } })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error('Ollama HTTP ' + response.status + (body ? ': ' + body.slice(0, 220) : ''));
  }
  const data = await response.json();
  const reply = String(data?.message?.content || '').trim();
  if (!reply) throw new Error('Ollama trả về câu trả lời rỗng');
  return reply.slice(0, 2000);
}

module.exports = { detectProvider, scanModels, scanOllamaModels, generateReply, PROVIDERS };
