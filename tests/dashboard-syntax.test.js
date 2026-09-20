const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'web', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]);
assert.ok(scripts.length > 0, 'Dashboard script not found');
for (const script of scripts) new vm.Script(script, { filename: 'web/index.html<script>' });
console.log('✅ Dashboard JavaScript syntax hợp lệ.');
