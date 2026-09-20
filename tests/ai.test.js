const assert = require('assert');
const { detectProvider, scanModels, scanOllamaModels, generateReply } = require('../src/ai/ai-provider');
const { AiListener } = require('../src/ai/ai-listener');
const { getEffectiveAiSettings } = require('../src/ai/ai-settings-store');

async function main() {
  console.log('🧪 Chạy kiểm tra AI...');

  assert.equal(detectProvider('sk-test-key')?.id, 'openai');
  assert.equal(detectProvider('sk-or-v1-test-key')?.id, 'openrouter');
  assert.equal(detectProvider('invalid-key'), null);

  const listener = new AiListener();
  assert.equal(listener.enabled, false);
  assert.equal(listener.timer, null);
  assert.equal(listener.getStatus().running, false);
  listener.stop();

  await assert.rejects(
    generateReply({ providerId: 'openai', apiKey: '', model: 'test-model', message: { content: 'test' } }),
    /API key/i
  );

  const originalFetch = global.fetch;
  try {
    global.fetch = async (url) => ({
      ok: true,
      async json() {
        if (String(url).endsWith('/models')) return { data: [{ id: 'gpt-test' }, { id: 'text-embedding-test' }] };
        if (String(url).endsWith('/api/tags')) return { models: [{ name: 'qwen3:1.7b' }] };
        throw new Error('Unexpected URL: ' + url);
      },
      async text() { return ''; }
    });
    const apiScan = await scanModels('sk-test-key');
    assert.deepEqual(apiScan.models, ['gpt-test']);
    const ollamaScan = await scanOllamaModels();
    assert.deepEqual(ollamaScan.models, ['qwen3:1.7b']);
  } finally {
    global.fetch = originalFetch;
  }

  const effective = getEffectiveAiSettings();
  assert.ok(Object.prototype.hasOwnProperty.call(effective, 'provider'));
  if (!effective.provider) assert.equal(effective.model, null);
  else assert.ok(effective.model);

  console.log('✅ Provider, model scan, settings và listener state hợp lệ.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
