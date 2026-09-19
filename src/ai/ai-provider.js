const PROVIDERS = {
  openai: { name: 'OpenAI', base: 'https://api.openai.com/v1' },
  openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1' }
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

async function scanModels(apiKey) {
  const provider = detectProvider(apiKey);
  if (!provider) throw new Error('Không nhận diện được API key. Hiện hỗ trợ API key OpenAI và OpenRouter.');
  const response = await fetch(provider.base + '/models', { headers: { Authorization: 'Bearer ' + String(apiKey).trim() } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(provider.name + ' HTTP ' + response.status + (body ? ': ' + body.slice(0, 180) : ''));
  }
  const models = cleanModels(await response.json());
  if (!models.length) throw new Error(provider.name + ' không trả về model chat khả dụng');
  return { provider, models };
}

async function generateReply({ apiKey, providerId, apiBase, model, message, history = [] }) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('AI provider chưa được cấu hình');
  const base = String(apiBase || provider.base).replace(/\/$/, '');
  const messages = [
    { role: 'system', content: 'You are a friendly Discord chat participant. Reply naturally in the same language when possible. Keep replies concise unless detail is clearly requested. Do not mention that you are an AI unless asked.' },
    ...history.slice(-20).map(item => ({ role: item.authorId === 'assistant' ? 'assistant' : 'user', content: String(item.content || '') })),
    { role: 'user', content: String(message.content || '') }
  ];
  const response = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + String(apiKey).trim() },
    body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 500 })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(provider.name + ' HTTP ' + response.status + (body ? ': ' + body.slice(0, 220) : ''));
  }
  const data = await response.json();
  const reply = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!reply) throw new Error(provider.name + ' trả về câu trả lời rỗng');
  return reply.slice(0, 2000);
}

module.exports = { detectProvider, scanModels, generateReply };
