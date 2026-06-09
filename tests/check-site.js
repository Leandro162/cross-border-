const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('files/app.js');
const css = read('files/style.css');
const index = read('files/index.html');
const readme = read('README.md');

assert.ok(app.includes("fetch('deals.json')"));
assert.ok(!app.includes('data/deals.json'));
assert.match(index, /id="category-nav"/);
assert.match(index, /class="hero-search"/);
assert.match(index, /id="stat-resources"/);
assert.doesNotMatch(app, /class="featured-card"/);
assert.match(app, /class="resource-section"/);
assert.match(app, /class="resource-card/);
assert.match(app, /is-featured/);
assert.match(app, /site-icon-placeholder/);
assert.doesNotMatch(app, /logo-fallback/);
assert.doesNotMatch(app, /charAt\(0\)/);
assert.doesNotMatch(app, /category-pair/);
assert.doesNotMatch(index, /class="sidebar"/);
assert.match(css, /\.category-nav\s*\{/);
assert.match(css, /\.featured-grid,/);
assert.match(css, /\.resource-grid\s*\{/);
assert.doesNotMatch(css, /\.featured-logo/);
assert.doesNotMatch(css, /\.logo-fallback/);
assert.match(css, /\.site-logo\s*\{/);
assert.match(css, /@media \(max-width: 720px\)/);

assert.match(app, /TAG_LABELS\[item\.tag\]/);
assert.match(app, /setTimeout\([\s\S]*render\(\)/);
assert.match(app, /clearTimeout/);
assert.match(app, /&amp;/);
assert.match(app, /&lt;/);
const data = JSON.parse(read('files/deals.json'));
const resources = [...data.featured, ...data.items];
assert.ok(resources.every(item => item.logo.startsWith('icons/')));
assert.ok(resources.every(item => fs.existsSync(path.join(root, 'files', item.logo))));

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
