const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('files/app.js');
const css = read('files/style.css');
const index = read('files/index.html');
const readme = read('README.md');

assert.match(app, /class="section category-pair"/);
assert.match(app, /class="category-column"/);
assert.match(app, /class="cards-grid category-grid"/);
assert.doesNotMatch(app, /style="display:grid;grid-template-columns:1fr 1fr/);
assert.doesNotMatch(app, /applyResponsiveTwoCol/);
assert.match(css, /\.category-pair\s*\{/);
assert.match(css, /@media \(max-width: 768px\)[\s\S]*\.category-pair\s*\{/);

assert.match(app, /TAG_LABELS\[item\.tag\]/);
assert.match(app, /setTimeout\([\s\S]*render\(\)/);
assert.match(app, /clearTimeout/);

assert.match(index, /href="privacy\.html"/);
assert.match(index, /href="terms\.html"/);
assert.match(index, /© 2026/);
assert.ok(fs.existsSync(path.join(root, 'files/privacy.html')));
assert.ok(fs.existsSync(path.join(root, 'files/terms.html')));

assert.match(readme, /docs\/README\.zh-CN\.md/);
assert.match(readme, /docs\/README\.en\.md/);
assert.ok(fs.existsSync(path.join(root, 'docs/README.zh-CN.md')));
assert.ok(fs.existsSync(path.join(root, 'docs/README.en.md')));

console.log('Site structure checks passed.');
