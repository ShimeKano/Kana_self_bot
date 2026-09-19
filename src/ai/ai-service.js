const OLLAMA_URL = String(process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:1.7b';

async function generateReply(message, history = []) {
  const context = history.slice(-8).map(item => ({
    role: item.authorId === 'assistant' ? 'assistant' : 'user',
    content: item.content
  }));
  const prompt = [
    'You are a friendly Discord chat participant.',
    'Reply naturally to the latest message in the same language when possible.',
    'Keep the reply concise unless the conversation clearly asks for detail.',
    'Do not mention that you are an AI unless asked.',
    '',
    ...context.map(item => `${item.role}: ${item.content}`),
    `user: ${message.content}`,
    'assistant:'
  ].join('\n');

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0.8 } })
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const reply = String(data.response || '').trim();
  if (!reply) throw new Error('Ollama trả về câu trả lời rỗng');
  return reply.slice(0, 2000);
}

function getInfo() { return { url: OLLAMA_URL, model: OLLAMA_MODEL }; }
module.exports = { generateReply, getInfo };