/* app.js — Cross-border Navigation Station */
(function () {
  'use strict';

  /* ===== State ===== */
  const state = {
    data: null,           // raw JSON
    category: 'all',     // current sidebar filter
    query: '',            // search query
    sort: 'default',      // default | views
  };

  /* ===== Category map ===== */
  const CATEGORIES = [
    { key: 'all',       label: '全部资源', icon: '🏠' },
    { key: 'blogger',   label: '博主自用', icon: '⭐' },
    { key: 'website',   label: '建站工具', icon: '🖥️' },
    { key: 'payment',   label: '支付收款', icon: '💳' },
    { key: 'adnetwork', label: '广告联盟', icon: '📣' },
    { key: 'analytics', label: '数据分析', icon: '📊' },
    { key: 'ai',        label: 'AI 工具',  icon: '🤖' },
  ];

  const CATEGORY_LABELS = {
    blogger:    '博主自用',
    website:    '建站工具',
    payment:    '支付收款',
    adnetwork:  '广告联盟',
    analytics:  '数据分析',
    ai:         'AI 工具',
  };

  const TAG_LABELS = {
    featured:   '精选',
    popular:    '热门',
    hot:        '爆款',
    new:        '新上线',
    enterprise: '企业级',
    free:       '免费',
  };

  /* ===== DOM refs ===== */
  const $ = id => document.getElementById(id);
  const els = {
    sidebarNav:   $('sidebar-nav'),
    searchInput:  $('search-input'),
    sortSelect:   $('sort-select'),
    resultCount:  $('result-count'),
    contentArea:  $('content-area'),
    btnMenu:      $('btn-mobile-menu'),
    sidebar:      $('sidebar'),
    overlay:      $('sidebar-overlay'),
  };

  /* ===== Fetch Data ===== */
  function loadData() {
    renderSkeletons();
    fetch('data/deals.json')
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(json => {
        state.data = json;
        render();
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        els.contentArea.innerHTML = `
          <div class="section">
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <p>数据加载失败，请刷新页面重试。</p>
            </div>
          </div>`;
      });
  }

  /* ===== Skeleton ===== */
  function renderSkeletons() {
    let html = '<div class="section"><div class="cards-grid">';
    for (let i = 0; i < 8; i++) {
      html += `
        <div class="skeleton-card">
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <div class="skeleton sk-logo"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;margin-top:4px;">
              <div class="skeleton sk-title"></div>
              <div class="skeleton sk-desc"></div>
            </div>
          </div>
          <div class="skeleton sk-desc2"></div>
          <div class="skeleton sk-btn"></div>
        </div>`;
    }
    html += '</div></div>';
    els.contentArea.innerHTML = html;
  }

  /* ===== Sidebar ===== */
  function buildSidebar() {
    let html = '';
    CATEGORIES.forEach((c, i) => {
      if (i === CATEGORIES.length - 3 && i > 0) {
        html += '<li class="sidebar-divider"></li>';
      }
      html += `
        <li>
          <button class="nav-item${state.category === c.key ? ' active' : ''}" data-cat="${c.key}">
            <span class="nav-icon">${c.icon}</span>
            <span>${c.label}</span>
          </button>
        </li>`;
    });
    html += `
      <li class="sidebar-divider"></li>
      <li>
        <button class="nav-item" id="btn-submit-url">
          <span class="nav-icon">🔗</span>
          <span>Submit URL</span>
        </button>
      </li>
      <li>
        <button class="nav-item" id="btn-about">
          <span class="nav-icon">ℹ️</span>
          <span>About Us</span>
        </button>
      </li>`;
    els.sidebarNav.innerHTML = html;

    els.sidebarNav.querySelectorAll('.nav-item[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.cat;
        updateActiveNav();
        render();
        closeMobileSidebar();
      });
    });
  }

  function updateActiveNav() {
    els.sidebarNav.querySelectorAll('.nav-item[data-cat]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === state.category);
    });
  }

  /* ===== Filter & Sort ===== */
  function getFilteredItems() {
    const { data, category, query, sort } = state;
    if (!data) return { featured: [], groups: [] };

    const q = query.trim().toLowerCase();

    // merge all items for search/filter
    const allFeatured = data.featured || [];
    const allItems = data.items || [];

    function matchItem(item) {
      if (category !== 'all' && item.category !== category) return false;
      if (q) {
        const haystack = (item.name + item.description + item.category).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }

    function sortItems(arr) {
      if (sort === 'views') return [...arr].sort((a, b) => b.views - a.views);
      return arr;
    }

    // If searching or filtering by category, flatten everything
    const isFiltered = category !== 'all' || q !== '';

    if (isFiltered) {
      const filtered = sortItems([...allFeatured, ...allItems].filter(matchItem));
      return { featured: [], groups: [{ label: '搜索结果', items: filtered }] };
    }

    // Default: featured section + grouped sections
    const filteredFeatured = sortItems(allFeatured.filter(matchItem));

    // Group items by category
    const groupMap = {};
    sortItems(allItems.filter(matchItem)).forEach(item => {
      const label = CATEGORY_LABELS[item.category] || item.category;
      if (!groupMap[item.category]) groupMap[item.category] = { label, items: [] };
      groupMap[item.category].items.push(item);
    });

    // Pair categories in two columns
    const groups = Object.values(groupMap);

    return { featured: filteredFeatured, groups };
  }

  /* ===== Card HTML ===== */
  function cardHTML(item) {
    const tagKey = item.tag || 'popular';
    const tagLabel = TAG_LABELS[tagKey] || tagKey;
    const views = item.views >= 1000
      ? (item.views / 1000).toFixed(1) + 'k'
      : item.views;

    const logoSrc = item.logo || '';
    const fallbackChar = item.name.charAt(0).toUpperCase();

    return `
      <div class="card" role="article">
        <div class="card-header">
          <img
            class="card-logo"
            src="${escHtml(logoSrc)}"
            alt="${escHtml(item.name)} logo"
            loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
          />
          <div class="card-logo-fallback" style="display:none;">${escHtml(fallbackChar)}</div>
          <div class="card-name">${escHtml(item.name)}</div>
        </div>
        <p class="card-desc">${escHtml(item.description)}</p>
        <div class="card-footer">
          <span class="card-tag tag-${escHtml(tagKey)}">${escHtml(tagLabel)}</span>
          <span class="card-views">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5zm0 8a3 3 0 110-6 3 3 0 010 6z"/></svg>
            ${views}
          </span>
        </div>
        <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="card-link-btn">访问官网</a>
      </div>`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ===== Main Render ===== */
  function render() {
    if (!state.data) return;
    const { featured, groups } = getFilteredItems();

    let totalCount = featured.length + groups.reduce((sum, g) => sum + g.items.length, 0);
    els.resultCount.textContent = `共 ${totalCount} 个资源`;

    let html = '';

    // Featured section
    if (featured.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">⭐ Featured</h2>
          <div class="cards-grid">
            ${featured.map(cardHTML).join('')}
          </div>
        </div>`;
    }

    // Groups
    if (groups.length === 0 && featured.length === 0) {
      html += `
        <div class="section">
          <div class="cards-grid">
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <p>没有找到相关资源，请尝试其他关键词。</p>
            </div>
          </div>
        </div>`;
    } else {
      // Pair groups side by side in two columns (like screenshot)
      for (let i = 0; i < groups.length; i += 2) {
        const g1 = groups[i];
        const g2 = groups[i + 1];

        if (g2) {
          // Two-column layout using CSS grid
          html += `
            <div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px;">
              <div>
                <h2 class="section-title">${escHtml(g1.label)}</h2>
                <div class="cards-grid" style="grid-template-columns:repeat(3,1fr);">
                  ${g1.items.map(cardHTML).join('')}
                </div>
              </div>
              <div>
                <h2 class="section-title">${escHtml(g2.label)}</h2>
                <div class="cards-grid" style="grid-template-columns:repeat(3,1fr);">
                  ${g2.items.map(cardHTML).join('')}
                </div>
              </div>
            </div>`;
        } else {
          html += `
            <div class="section">
              <h2 class="section-title">${escHtml(g1.label)}</h2>
              <div class="cards-grid">
                ${g1.items.map(cardHTML).join('')}
              </div>
            </div>`;
        }
      }
    }

    els.contentArea.innerHTML = html;

    // Staggered fade-in for cards
    requestAnimationFrame(() => {
      els.contentArea.querySelectorAll('.card').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.18s ease, border-color 0.18s ease';
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * 30);
      });
    });

    // Respond to two-column sections on mobile
    applyResponsiveTwoCol();
  }

  /* On narrow screens, stack the two-column sections */
  function applyResponsiveTwoCol() {
    if (window.innerWidth < 768) {
      els.contentArea.querySelectorAll('.section[style*="grid-template-columns:1fr 1fr"]').forEach(el => {
        el.style.gridTemplateColumns = '1fr';
      });
      els.contentArea.querySelectorAll('.cards-grid[style*="grid-template-columns:repeat(3,1fr)"]').forEach(el => {
        el.style.gridTemplateColumns = '';
      });
    }
  }

  /* ===== Mobile Sidebar ===== */
  function openMobileSidebar() {
    els.sidebar.classList.add('open');
    els.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileSidebar() {
    els.sidebar.classList.remove('open');
    els.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ===== Events ===== */
  function bindEvents() {
    // Search
    els.searchInput.addEventListener('input', () => {
      state.query = els.searchInput.value;
      render();
    });

    // Sort
    els.sortSelect.addEventListener('change', () => {
      state.sort = els.sortSelect.value;
      render();
    });

    // Mobile menu
    els.btnMenu.addEventListener('click', openMobileSidebar);
    els.overlay.addEventListener('click', closeMobileSidebar);

    // Resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) closeMobileSidebar();
      applyResponsiveTwoCol();
    });
  }

  /* ===== Init ===== */
  function init() {
    buildSidebar();
    bindEvents();
    loadData();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
