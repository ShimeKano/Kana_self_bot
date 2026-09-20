const assert = require('assert');
const { detectProvider, generateReply } = require('../src/ai/ai-provider');
const { AiListener } = require('../src/ai/ai-listener');

console.log('🧪 Chạy kiểm tra AI...');

assert.equal(detectProvider('sk-test-key')?.id, 'openai');
assert.equal(detectProvider('sk-or-v1-test-key')?.id, 'openrouter');
assert.equal(detectProvider('invalid-key'), null);

const listener = new AiListener();
assert.equal(listener.enabled, false);
assert.equal(listener.timer, null);
assert.equal(listener.getStatus().running, false);

listener.stop();

(async()=>{
  let threw = false;
  try {
    await generateReply({
      providerId: 'openai',
      apiKey: '',
      model: 'test-model',
      message: { content: 'test' }
    });
  } catch (error) {
    threw = /API key/i.test(error.message);
  }
  assert.equal(threw, true);
  console.log('✅ Provider detection, AI state và API-key validation hợp lệ.');
})();
