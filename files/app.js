/* app.js — Cross-border Navigation Station */
(function () {
  'use strict';

  const state = {
    data: null,
    category: 'all',
    query: '',
    sort: 'default',
  };

  const CATEGORIES = [
    { key: 'all', label: '全部资源', icon: 'grid' },
    { key: 'blogger', label: '内容创作', icon: 'edit' },
    { key: 'website', label: '建站工具', icon: 'browser' },
    { key: 'payment', label: '支付收款', icon: 'card' },
    { key: 'adnetwork', label: '广告联盟', icon: 'megaphone' },
    { key: 'analytics', label: '数据分析', icon: 'chart' },
    { key: 'ai', label: 'AI 工具', icon: 'spark' },
  ];

  const CATEGORY_LABELS = Object.fromEntries(
    CATEGORIES.filter(category => category.key !== 'all').map(category => [category.key, category.label]),
  );

  const TAG_LABELS = {
    featured: '编辑精选',
    popular: '广受欢迎',
    hot: '高热度',
    new: '新上线',
    enterprise: '企业级',
    free: '免费使用',
  };

  const ICON_PATHS = {
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
    megaphone: '<path d="m4 13 13-6v10L4 13Zm0 0v5h4v-3M17 10.5c2 .5 3 1.7 3 3.5s-1 3-3 3.5"/>',
    chart: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
    spark: '<path d="m12 3 1.3 4.2L17.5 9l-4.2 1.8L12 15l-1.3-4.2L6.5 9l4.2-1.8L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/>',
  };

  const $ = id => document.getElementById(id);
  const els = {
    categoryNav: $('category-nav'),
    searchInput: $('search-input'),
    sortSelect: $('sort-select'),
    resultCount: $('result-count'),
    contentArea: $('content-area'),
    statResources: $('stat-resources'),
    statCategories: $('stat-categories'),
  };
  let searchTimer = null;

  function iconSvg(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.grid}</svg>`;
  }

  function loadData() {
    renderSkeletons();
    fetch('deals.json')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        state.data = data;
        const total = (data.featured || []).length + (data.items || []).length;
        els.statResources.textContent = total;
        els.statCategories.textContent = CATEGORIES.length - 1;
        render();
      })
      .catch(error => {
        console.error('Failed to load data:', error);
        els.resultCount.textContent = '资源加载失败';
        els.contentArea.innerHTML = `
          <div class="empty-state">
            <span class="empty-symbol">!</span>
            <h2>暂时无法加载资源</h2>
            <p>请刷新页面重试，或稍后再来看看。</p>
          </div>`;
      });
  }

  function buildCategoryNav() {
    els.categoryNav.innerHTML = CATEGORIES.map(category => `
      <button class="category-chip${state.category === category.key ? ' active' : ''}" data-category="${category.key}" type="button">
        ${iconSvg(category.icon)}
        <span>${category.label}</span>
      </button>
    `).join('');

    els.categoryNav.addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = button.dataset.category;
      updateActiveCategory();
      render();
      document.querySelector('.content-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function updateActiveCategory() {
    els.categoryNav.querySelectorAll('[data-category]').forEach(button => {
      button.classList.toggle('active', button.dataset.category === state.category);
    });
  }

  function getFilteredItems() {
    if (!state.data) return { featured: [], groups: [] };
    const featured = state.data.featured || [];
    const items = state.data.items || [];
    const query = state.query.trim().toLowerCase();

    function matches(item) {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (!query) return true;
      const searchText = [
        item.name,
        item.description,
        item.category,
        CATEGORY_LABELS[item.category],
        item.tag,
        TAG_LABELS[item.tag],
      ].filter(Boolean).join(' ').toLowerCase();
      return searchText.includes(query);
    }

    function sortItems(list) {
      return state.sort === 'views'
        ? [...list].sort((a, b) => b.views - a.views)
        : list;
    }

    if (state.category !== 'all' || query) {
      return {
        featured: [],
        groups: [{
          key: state.category,
          label: state.category === 'all' ? '搜索结果' : CATEGORY_LABELS[state.category],
          items: sortItems([...featured, ...items].filter(matches)),
        }],
      };
    }

    const groupMap = new Map();
    sortItems(items.filter(matches)).forEach(item => {
      if (!groupMap.has(item.category)) {
        groupMap.set(item.category, {
          key: item.category,
          label: CATEGORY_LABELS[item.category] || item.category,
          items: [],
        });
      }
      groupMap.get(item.category).items.push(item);
    });

    return { featured: sortItems(featured.filter(matches)), groups: [...groupMap.values()] };
  }

  function logoHtml(item) {
    return `
      <span class="site-logo">
        <img src="${escHtml(item.logo || '')}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false;" />
        <span class="site-icon-placeholder" hidden aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"/></svg>
        </span>
      </span>`;
  }

  function resourceCard(item, isFeatured = false) {
    const category = CATEGORY_LABELS[item.category] || item.category;
    const tag = TAG_LABELS[item.tag] || item.tag;
    return `
      <a class="resource-card${isFeatured ? ' is-featured' : ''}" href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        ${logoHtml(item)}
        <span class="resource-card-copy">
          <span class="resource-card-heading">
            <strong>${escHtml(item.name)}</strong>
            <span class="card-arrow" aria-hidden="true">↗</span>
          </span>
          <span class="resource-card-meta">
            ${isFeatured ? '<span class="featured-badge">精选</span>' : ''}
            <span>${escHtml(category)} · ${escHtml(tag)}</span>
          </span>
          <span class="resource-card-desc">${escHtml(item.description)}</span>
        </span>
      </a>`;
  }

  function renderSkeletons() {
    els.contentArea.innerHTML = `
      <section class="content-section">
        <div class="section-heading skeleton-heading"></div>
        <div class="featured-grid">
          ${Array.from({ length: 3 }, () => '<div class="skeleton-card skeleton"></div>').join('')}
        </div>
      </section>`;
  }

  function render() {
    if (!state.data) return;
    const { featured, groups } = getFilteredItems();
    const total = featured.length + groups.reduce((sum, group) => sum + group.items.length, 0);
    els.resultCount.textContent = `找到 ${total} 个资源`;

    if (total === 0) {
      els.contentArea.innerHTML = `
        <div class="empty-state">
          <span class="empty-symbol">?</span>
          <h2>没有找到匹配的资源</h2>
          <p>换一个关键词，或选择“全部资源”再试试。</p>
        </div>`;
      return;
    }

    let html = '';
    if (featured.length) {
      html += `
        <section class="content-section featured-section" id="featured">
          <div class="section-heading">
            <div><span class="section-kicker">EDITOR'S PICKS</span><h2>本周精选</h2></div>
            <p>经过筛选、值得优先了解的跨境工具</p>
          </div>
          <div class="featured-grid">${featured.map(item => resourceCard(item, true)).join('')}</div>
        </section>`;
    }

    html += `<div id="resources">`;
    groups.forEach((group, index) => {
      if (!group.items.length) return;
      const category = CATEGORIES.find(item => item.key === group.key);
      html += `
        <section class="resource-section">
          <div class="section-heading compact">
            <div class="section-title-with-icon">
              <span class="section-icon">${iconSvg(category?.icon || 'grid')}</span>
              <div><span class="section-kicker">CATEGORY ${String(index + 1).padStart(2, '0')}</span><h2>${escHtml(group.label)}</h2></div>
            </div>
            <span class="section-count">${group.items.length} 个资源</span>
          </div>
          <div class="resource-grid">${group.items.map(resourceCard).join('')}</div>
        </section>`;
    });
    html += '</div>';
    els.contentArea.innerHTML = html;
  }

  function escHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindEvents() {
    els.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = els.searchInput.value;
        render();
      }, 180);
    });

    els.sortSelect.addEventListener('change', () => {
      state.sort = els.sortSelect.value;
      render();
    });

    document.addEventListener('keydown', event => {
      if (event.key === '/' && document.activeElement !== els.searchInput) {
        event.preventDefault();
        els.searchInput.focus();
      }
    });
  }

  function init() {
    buildCategoryNav();
    bindEvents();
    loadData();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
