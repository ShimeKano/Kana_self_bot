const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.js') ? [full] : [];
  });
}

const repoRoot = path.join(__dirname, '..');
const sourceFiles = walk(path.join(repoRoot, 'src'));
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  new vm.Script(source, { filename: path.relative(repoRoot, file) });
}

const html = fs.readFileSync(path.join(repoRoot, 'web', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
assert.ok(scripts.length > 0, 'Dashboard script not found');
for (const script of scripts) new vm.Script(script, { filename: 'web/index.html<script>' });
console.log('✅ Toàn bộ JavaScript trong src/ và dashboard đều hợp lệ về cú pháp.');
