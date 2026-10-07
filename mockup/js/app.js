/* Rotation prototype: views, interactions and the design-notes layer. */

(() => {
  const E = Engine;
  const $ = (s, el = document) => el.querySelector(s);
  const byId = E.byId;
  const money = (n) => '$' + n.toFixed(2);
  const isShop = (it) => CATALOG.includes(it);
  const SLOTS = ['outer', 'top', 'bottom', 'shoes', 'acc'];
  const SLOT_LABEL = { outer: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', acc: 'Extra' };
  const svgOf = (it) => Garments.svg(it.type, it.color, it.pattern);
  const tile = (it, cls = '') => `<div class="tile ${cls}">${svgOf(it)}</div>`;
  const brandChip = (it) => `<span class="chip">${it.brand}</span>`;
  const storeCount = (p) => `${p.options.length} store${p.options.length > 1 ? 's' : ''}`;
  const fromPrice = (p) => `From ${money(p.price)} at ${storeCount(p)}`;
  const recent = (i) => !['Mar', 'Feb', 'Jan', 'Apr', 'May', 'Jun'].some((m) => i.last.startsWith(m));

  /* Shopping-list entries are "<piece id>|<store>". */
  const listKey = (pieceId, store) => `${pieceId}|${store}`;
  const fromKey = (key) => {
    const [pid, store] = key.split('|');
    const piece = byId(pid);
    return { piece, option: piece.options.find((o) => o.store === store) };
  };

  /* ---------- Icons ---------- */
  const ICONS = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5 5l1.4 1.4M17.6 17.6 19 19M2.5 12h2M19.5 12h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    closet: '<path d="M12 7.5a2 2 0 1 1 2-2c0 1-.8 1.5-1.5 1.9-.4.2-.5.5-.5.9V9"/><path d="M12 9 3.5 15.2c-.9.7-.4 1.8.6 1.8h15.8c1 0 1.5-1.1.6-1.8Z"/>',
    builder: '<path d="M11 3.5 12.6 8 17 9.5l-4.4 1.6L11 15.5l-1.6-4.4L5 9.5 9.4 8Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    planner: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.7"/><path d="M12 14.5v2"/>',
    insights: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3" height="6.5" rx="1"/><rect x="10.5" y="6" width="3" height="11.5" rx="1"/><rect x="16" y="13" width="3" height="4.5" rx="1"/>',
    journey: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
    bag: '<path d="M5 8h14l-1 12.5H6Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    sync: '<path d="M20 11a8 8 0 0 0-14.3-4.3L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15"/><path d="M20 20v-5h-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    out: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6c1.1 1.7 2.3 2.7 4.3 2.7H21"/><path d="M3 17h3.5c1.3 0 2.2-.4 3-1.1M14.2 8.1c.8-.7 1.7-1.1 3-1.1H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-5h4v5"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M5 5l1.4 1.4M17.6 17.6 19 19M2.5 12h2M19.5 12h2M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    fog: '<path d="M5 10a5 5 0 0 1 9.6-1.9A3.8 3.8 0 0 1 19.5 11.5"/><path d="M3 14.5h18M5 18h14M8 21.5h8"/>',
    cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5Z"/>',
    wind: '<path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16.5h7"/>',
    shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6Z"/><path d="m9 12 2 2 4-4"/>',
    tag: '<path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8a1.4 1.4 0 0 1 0 2l-7 7a1.4 1.4 0 0 1-2 0Z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21Z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
    metric: '<path d="m4 17 5.5-5.5 4 4L21 8"/><path d="M15 8h6v6"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.3v.2"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/>',
  };
  const icon = (n) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const skyIcon = { sun: 'sun', fog: 'fog', cloud: 'cloud', wind: 'wind' };

  /* ---------- Flat-lay layout ---------- */
  // [left %, top %, width %]; pieces are square.
  const LAYOUT = { outer: [1, 3, 49], top: [47, 1, 48], bottom: [46, 40, 51], shoes: [2, 58, 44], acc: [27, 41, 25] };
  const LAYOUT_BARE = { top: [3, 3, 52], bottom: [44, 30, 53], shoes: [4, 57, 44], acc: [60, 2, 30] };

  function flatlay(outfit, cls = '') {
    const L = outfit.outer ? LAYOUT : LAYOUT_BARE;
    const pieces = SLOTS.filter((s) => outfit[s] && L[s])
      .map((s) => {
        const it = byId(outfit[s]);
        const [l, t, w] = L[s];
        return `<div class="piece ${isShop(it) ? 'ghost' : ''}" style="left:${l}%;top:${t}%;width:${w}%;aspect-ratio:1">${svgOf(it)}</div>`;
      })
      .join('');
    return `<div class="flatlay ${cls}">${pieces}</div>`;
  }

  /* The most wearable outfit around one item: favour pieces the person reaches for most. */
  function bestOutfitWith(item, withLayer = true) {
    let best = null;
    let bestScore = -1;
    for (const o of E.outfitsWith(item)) {
      const score = Object.values(o).map(byId).reduce((a, i) => a + (i.wears || 0), 0);
      if (score > bestScore) [best, bestScore] = [o, score];
    }
    if (!best) return { [item.cat]: item.id };
    if (withLayer && item.cat !== 'outer') {
      const base = Object.values(best).map(byId);
      const layer = E.owned('outer')
        .filter((l) => E.check([...base, l]).ok)
        .sort((a, b) => b.wears - a.wears)[0];
      if (layer) best = { outer: layer.id, ...best };
    }
    return best;
  }

  /* Up to n outfits for a new piece, built from favourite owned pieces and as varied as possible.
     offset rotates the starting point so neighbouring cards don't repeat the same looks. */
  function previewsFor(item, n = 3, offset = 0) {
    const scored = E.outfitsWith(item)
      .map((o) => ({ o, s: Object.values(o).map(byId).filter((i) => i !== item).reduce((a, i) => a + i.wears, 0) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.o);
    const list = scored.slice(offset).concat(scored.slice(0, offset));
    const varyKey = item.cat === 'top' ? 'bottom' : 'top';
    const out = [];
    for (const strict of [true, false])
      for (const o of list) {
        if (out.length === n) break;
        if (out.includes(o) || out.some((p) => p[varyKey] === o[varyKey])) continue;
        if (strict && out.some((p) => p.shoes === o.shoes)) continue;
        out.push(o);
      }
    return out;
  }

  const TODAY_PICKS = [
    {
      title: 'Client-ready, fog-proof',
      outfit: { outer: 'o2', top: 't3', bottom: 'b1', shoes: 's2', acc: 'a1' },
      reasons: [
        ['planner', '<b>Client presentation at 2 PM.</b> An oxford with clean denim looks polished without a suit.'],
        ['fog', '<b>61° and foggy until noon.</b> The trench comes off once the sun is out.'],
        ['builder', '<b>Your oxford is due a wear.</b> Last worn Sep 15, after 19 wears.'],
      ],
    },
    {
      title: 'A notch sharper',
      outfit: { outer: 'o2', top: 't4', bottom: 'b3', shoes: 's2' },
      reasons: [
        ['planner', '<b>Client presentation at 2 PM.</b> Merino and tailored wool read sharp without a suit.'],
        ['fog', '<b>61° and foggy until noon.</b> Trench for the morning, boots for damp sidewalks.'],
        ['builder', '<b>Your wool trousers have 8 wears.</b> A good day to change that.'],
      ],
    },
    {
      title: 'Relaxed, still intentional',
      outfit: { outer: 'o1', top: 't7', bottom: 'b2', shoes: 's2' },
      reasons: [
        ['planner', '<b>Client presentation at 2 PM.</b> Linen and dark denim keep it relaxed but deliberate.'],
        ['fog', '<b>Fog until noon, 68° by afternoon.</b> A denim jacket is easy to carry.'],
        ['builder', '<b>Your linen shirt has only 6 wears.</b> Early fall is its last good window.'],
      ],
    },
  ];

  /* ---------- State ---------- */
  const VIEWS = ['today', 'closet', 'builder', 'planner', 'fill', 'insights', 'journey'];
  const state = {
    view: VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today',
    list: [],
    showShop: true,
    notes: new URLSearchParams(location.search).has('notes'),
    noteHL: null,
    closet: { cat: 'all', source: 'all', sort: 'worn' },
    overlay: null,
    todayIdx: 0,
    builder: { outfit: { ...TODAY_PICKS[0].outfit }, focus: 'bottom', tray: 'top', name: 'Client presentation' },
  };

  /* ---------- Shared pieces ---------- */
  function side() {
    const nav = [
      ['today', 'Today', 'today'],
      ['closet', 'Closet', 'closet', CLOSET.length],
      ['builder', 'Outfit builder', 'builder'],
      ['planner', 'Planner', 'planner'],
      ['fill', 'Fill the gap', 'unlock'],
      ['insights', 'Insights', 'insights'],
    ];
    const item = ([v, label, ic, count]) =>
      `<button class="nav-item ${state.view === v ? 'active' : ''}" data-act="nav" data-view="${v}" ${state.view === v ? 'aria-current="page"' : ''}>
        ${icon(ic)}<span>${label}</span>${count ? `<span class="count">${count}</span>` : ''}
      </button>`;
    const emailed = CLOSET.filter((i) => i.source === 'email');
    return `
      <div class="logo">${APP.name}<span>.</span></div>
      <div class="logo-sub">${APP.tagline}</div>
      <nav class="nav" aria-label="Main">
        ${nav.map(item).join('')}
        <div class="nav-label">Concept</div>
        ${item(['journey', 'Across the journey', 'journey'])}
      </nav>
      <div class="side-foot">
        <div class="sync-status"><span class="pulse"></span><span><b>Order emails connected</b><br/>${PERSON.inbox} · ${new Set(emailed.map(E.storeOf)).size} stores found</span></div>
        <div class="me"><div class="avatar">JL</div><div><b>${PERSON.first} ${PERSON.last}</b><small>${PERSON.city}</small></div></div>
        <button class="notes-toggle" data-act="toggle-notes" aria-pressed="${state.notes}"><span class="notes-dot"></span><span class="lbl">Design notes</span><span class="switch" aria-hidden="true"><span></span></span></button>
        <div class="disclaimer">Prototype. Store names are for illustration; products and prices are examples. Not affiliated with any retailer.</div>
      </div>`;
  }

  function topbar() {
    return `<div class="topbar">
      <button class="icon-btn" data-act="list" aria-label="Shopping list, ${state.list.length} items">${icon('bag')}${state.list.length ? `<span class="bag-count">${state.list.length}</span>` : ''}</button>
    </div>`;
  }

  function shopSwitch(label = 'Show shopping suggestions') {
    return `<button class="switch-row" data-act="toggle-shop" aria-pressed="${state.showShop}">
      <span class="switch ${state.showShop ? 'on' : ''}"><span></span></span>${label}</button>`;
  }

  function disclosure() {
    return `<div class="disclosure">${icon('shield')}<span><b>How we rank, and how we make money.</b> Pieces are ranked by the new outfits they create with your closet, your style, your size being in stock, and whether you already own something similar. Stores are listed by your favorites, then price. We may earn a commission when you buy through a link; it never changes the ranking.</span></div>`;
  }

  /* Store options for a piece; addable rows go to the shopping list. */
  function optionRows(p) {
    return `<div class="opt-list">${E.optionsFor(p)
      .map((o) => {
        const key = listKey(p.id, o.store);
        const added = state.list.includes(key);
        return `<div class="opt-row">
          <div><div class="opt-store">${o.store}${FAVORITE_STORES.includes(o.store) ? `<span class="fav" title="One of your favorite stores">${icon('star')}</span>` : ''}</div>
          <div class="opt-product">${o.product}</div>
          ${o.fit ? `<div class="opt-fit">${icon('ruler')}${o.fit}</div>` : ''}</div>
          <div class="opt-price">${money(o.price)}</div>
          ${added ? `<span class="chip good">${icon('check')}On list</span>` : `<button class="btn xs" data-act="add-list" data-key="${key}">Add to list</button>`}
        </div>`;
      })
      .join('')}</div>`;
  }

  /* ---------- Today ---------- */
  function viewToday() {
    const pick = TODAY_PICKS[state.todayIdx];
    const pieces = SLOTS.filter((s) => pick.outfit[s]).map((s) => byId(pick.outfit[s]));
    const lead = E.gapPicks()[0];
    const tops = new Set(E.outfitsWith(lead).map((o) => o.top)).size;
    const worn90 = CLOSET.filter(recent).length;
    const avgCpw = CLOSET.reduce((a, i) => a + i.price, 0) / CLOSET.reduce((a, i) => a + i.wears, 0);
    const redis = ['o4', 't9', 'b5'].map(byId);

    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Tuesday, October 6</div>
          <h1>Good morning, ${PERSON.first}</h1>
          <div class="weather-line">${icon('fog')} 61° in ${PERSON.city} · Fog until noon, then sun · High 68°</div>
        </div>
      </header>

      <section class="today-grid">
        <article class="card hero" data-note="1">
          <div class="hero-visual">${flatlay(pick.outfit)}</div>
          <div class="hero-body">
            <div>
              <div class="eyebrow">Today's outfit · ${state.todayIdx + 1} of ${TODAY_PICKS.length}</div>
              <h2>${pick.title}</h2>
            </div>
            <ul class="reasons">${pick.reasons.map(([ic, t]) => `<li>${icon(ic)}<span>${t}</span></li>`).join('')}</ul>
            <div class="piece-list">
              ${pieces.map((it) => `<div class="piece-row">${tile(it)}<span class="name">${it.name}</span>${brandChip(it)}</div>`).join('')}
            </div>
            <div class="share-line">${icon('builder')}<span><b>A combination you haven't worn yet,</b> all from your closet</span></div>
            <div class="hero-actions">
              <button class="btn primary" data-act="wear">${icon('check')}Wear this</button>
              <button class="btn" data-act="shuffle">${icon('shuffle')}Shuffle</button>
              <button class="btn ghost" data-act="edit-today" aria-label="Edit in builder">${icon('builder')}</button>
            </div>
          </div>
        </article>

        <aside class="today-side">
          ${
            state.showShop
              ? `<article class="card unlock-card" data-note="2">
            <div class="eyebrow">Fill the gap</div>
            <div class="row">
              ${tile(lead)}
              <div><div class="big-num">${lead.unlock}</div><div>new outfits from ${lead.phrase}</div></div>
            </div>
            <p>They pair with ${tops} of your ${E.owned('top').length} tops. ${lead.why} ${fromPrice(lead)}, in your size.</p>
            <button class="btn" data-act="nav" data-view="fill">See the outfits ${icon('arrow')}</button>
          </article>`
              : `<article class="card card-pad" data-note="2"><div class="eyebrow">Fill the gap</div><p class="sub" style="margin-top:0">Shopping suggestions are hidden. Your closet already makes ${E.totalOutfits()} outfits.</p><div style="margin-top:14px">${shopSwitch('Show them again')}</div></article>`
          }
          <article class="card stats" data-note="3">
            <div class="eyebrow">Your closet</div>
            <div class="stat-row">
              <div class="stat"><div class="v">${E.totalOutfits()}</div><div class="l">outfits you can make today</div></div>
              <div class="stat"><div class="v">${Math.round((worn90 / CLOSET.length) * 100)}%</div><div class="l">worn in the last 90 days</div></div>
              <div class="stat"><div class="v">${money(avgCpw)}</div><div class="l">average cost per wear</div></div>
            </div>
          </article>
        </aside>
      </section>

      <section class="section">
        <div class="section-head">
          <div><h3>Rediscover what you own</h3><p>Pieces you haven't reached for lately, styled with things you wear all the time.</p></div>
        </div>
        <div class="rediscover" data-note="4">
          ${redis
            .map(
              (it) => `<article class="card redis-card">
              ${flatlay(bestOutfitWith(it))}
              <div class="redis-meta">
                <div><h4>${it.name}</h4><p>${brandChip(it)} &nbsp;Worn ${it.wears} times · last ${it.last}</p></div>
                <button class="btn sm" data-act="style-item" data-id="${it.id}">Style it</button>
              </div>
            </article>`
            )
            .join('')}
        </div>
      </section>`;
  }

  /* ---------- Closet ---------- */
  function viewCloset() {
    const { cat, source, sort } = state.closet;
    const emailed = CLOSET.filter((i) => i.source === 'email');
    let items = CLOSET.filter((i) => (cat === 'all' || i.cat === cat) && (source === 'all' || (source === 'email') === (i.source === 'email')));
    const sorters = { worn: (a, b) => b.wears - a.wears, least: (a, b) => a.wears - b.wears, cpw: (a, b) => E.cpw(a) - E.cpw(b) };
    items = [...items].sort(sorters[sort]);
    const chip = (v, label, n) =>
      `<button class="filter-chip ${cat === v ? 'active' : ''}" data-act="closet-cat" data-v="${v}">${label}<b>${n}</b></button>`;
    const seg = (v, label) => `<button class="${source === v ? 'active' : ''}" data-act="closet-source" data-v="${v}">${label}</button>`;
    const srcBadge = (it) =>
      it.source === 'email'
        ? `<span class="src">${icon('mail')}${E.storeOf(it)}</span>`
        : `<span class="src">${icon(it.source === 'photo' ? 'camera' : 'link')}${it.source === 'photo' ? 'Photo' : 'Link'}</span>`;

    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Closet</div>
          <h1>${CLOSET.length} pieces, ${E.totalOutfits()} outfits</h1>
          <p class="sub">${emailed.length} imported from order emails at ${new Set(emailed.map(E.storeOf)).size} stores · ${CLOSET.length - emailed.length} added by photo or link</p>
        </div>
        <div class="head-actions">
          <button class="btn" data-act="email">${icon('mail')}Check for new orders</button>
          <button class="btn primary" data-act="add">${icon('plus')}Add pieces</button>
        </div>
      </header>

      <div class="banner" data-note="1">
        ${icon('mail')}
        <div class="grow"><b>Your inbox does the work.</b> Order confirmations from ${E.stores().length} stores, from Gap to Zara to Nordstrom, were turned into closet pieces with product photos and sizes. New orders appear automatically.</div>
        <button class="link" data-act="email">See how</button>
      </div>

      <div class="toolbar">
        ${chip('all', 'All', CLOSET.length)}
        ${CATS.map((c) => chip(c.id, c.label, CLOSET.filter((i) => i.cat === c.id).length)).join('')}
        <span class="spacer"></span>
        <div class="seg" role="group" aria-label="Source filter" data-note="3">${seg('all', 'All')}${seg('email', 'From emails')}${seg('mine', 'Added by you')}</div>
        <select class="select" data-act="closet-sort" aria-label="Sort">
          <option value="worn" ${sort === 'worn' ? 'selected' : ''}>Most worn</option>
          <option value="least" ${sort === 'least' ? 'selected' : ''}>Least worn</option>
          <option value="cpw" ${sort === 'cpw' ? 'selected' : ''}>Lowest cost per wear</option>
        </select>
      </div>

      <div class="closet-grid">
        ${items
          .map(
            (it, i) => `
          <button class="item-card" data-act="open-item" data-id="${it.id}" ${i === 0 ? 'data-note="2"' : ''}>
            ${srcBadge(it)}
            ${tile(it)}
            <div>
              <div class="item-name">${it.name}</div>
              <div class="item-sub"><span>${it.brand} · ${it.wears} wears</span><span class="cpw" ${i === 1 ? 'data-note="4"' : ''}>${money(E.cpw(it))}/wear</span></div>
            </div>
          </button>`
          )
          .join('')}
      </div>`;
  }

  function drawerItem(it) {
    const pairs = E.pairsWith(it);
    const shop = state.showShop ? E.gapPicks().filter((c) => c.cat !== it.cat && c.unlock > 0 && E.check([it, c]).ok).slice(0, 2) : [];
    const store = E.storeOf(it);
    const prov =
      it.source === 'email'
        ? `${icon('mail')}<span><b>Imported from your ${store} order email</b> from ${it.bought}. The photo, size ${it.size} and color came from the receipt, so there was nothing to type.</span>`
        : it.source === 'photo'
        ? `${icon('camera')}<span><b>Added from a photo.</b> The background was removed and the category and color tagged automatically; you confirmed the details.</span>`
        : `${icon('link')}<span><b>Added from a product link.</b> The product photo and details were pulled from the store's page.</span>`;
    return `
      <div class="backdrop" data-act="close"></div>
      <aside class="drawer" role="dialog" aria-label="${it.name}">
        <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>
        ${tile(it, 'big')}
        <div>
          ${brandChip(it)}${it.store ? ` <span class="chip">Bought at ${it.store}</span>` : ''}
          <h2 style="margin-top:10px">${it.name}</h2>
          <div class="meta-line">${it.colorName} · Size ${it.size}</div>
        </div>
        <div class="kv">
          <div><div class="v">${it.wears}</div><div class="l">wears</div></div>
          <div><div class="v">${money(E.cpw(it))}</div><div class="l">cost per wear</div></div>
          <div><div class="v">${it.last}</div><div class="l">last worn</div></div>
        </div>
        <div>
          <h3 class="small">Pairs with ${pairs.length} pieces you own</h3>
          <p class="meta-line" style="margin:2px 0 10px">Most-worn first · ${E.outfitsWith(it).length} complete outfits</p>
          <div class="thumb-row">${pairs
            .slice(0, 10)
            .map((p) => `<div class="thumb" title="${p.name} · ${p.brand}">${tile(p)}</div>`)
            .join('')}</div>
        </div>
        <button class="btn primary" data-act="style-item" data-id="${it.id}">${icon('builder')}Style it in the builder</button>
        ${
          shop.length
            ? `<div>
          <h3 class="small">Complete it</h3>
          <p class="meta-line" style="margin:2px 0 6px">Pieces that pair with this one, ranked by outfits unlocked</p>
          ${shop
            .map(
              (c) => `<div class="sugg shop">${tile(c)}<div><div class="sugg-name">${c.name}</div>
            <div class="unlock-line">${icon('unlock')}Unlocks ${c.unlock} outfits</div><div class="sugg-sub">${fromPrice(c)}</div></div>
            <button class="btn xs" data-act="compare" data-id="${c.id}">Compare</button></div>`
            )
            .join('')}
        </div>`
            : ''
        }
        <div class="provenance">${prov}</div>
      </aside>`;
  }

  /* ---------- Builder ---------- */
  function viewBuilder() {
    const b = state.builder;
    const outfit = b.outfit;
    const items = SLOTS.filter((s) => outfit[s]).map((s) => byId(outfit[s]));
    const complete = outfit.top && outfit.bottom && outfit.shoes;
    const verdict = E.check(items);
    const trialItems = items.filter(isShop);

    const slotEl = (s) => {
      const [l, t, w] = LAYOUT[s];
      const it = outfit[s] && byId(outfit[s]);
      const style = `left:${l}%;top:${t}%;width:${w}%;aspect-ratio:1`;
      const focused = b.focus === s ? 'focused' : '';
      if (!it)
        return `<div class="slot empty ${focused}" role="button" tabindex="0" data-act="focus-slot" data-slot="${s}" style="${style};inset:auto;left:${l + w * 0.18}%;top:${t + w * 0.18}%;width:${w * 0.64}%">+ ${SLOT_LABEL[s]}</div>`;
      return `<div class="slot ${focused} ${isShop(it) ? 'trial' : ''}" role="button" tabindex="0" aria-label="${it.name}" data-act="focus-slot" data-slot="${s}" style="${style}">
        ${svgOf(it)}
        <button class="slot-x" data-act="remove-slot" data-slot="${s}" aria-label="Remove ${it.name}">${icon('x')}</button>
        ${isShop(it) ? `<div class="trial-tag">Not in your closet · from ${money(it.price)}<button class="btn" data-act="compare" data-id="${it.id}">Compare stores</button></div>` : ''}
      </div>`;
    };

    const sugg = E.forSlot(b.focus, outfit);
    const row = (it) => {
      const on = outfit[b.focus] === it.id;
      return `<div class="sugg ${on ? 'current' : ''}">${tile(it)}
        <div><div class="sugg-name">${it.name}</div><div class="sugg-sub">${brandChip(it)}<span>${it.wears} wears</span></div></div>
        ${on ? '<span class="chip good">On board</span>' : `<button class="btn xs" data-act="put" data-slot="${b.focus}" data-id="${it.id}">Use</button>`}</div>`;
    };
    const shopRow = (c) => {
      const on = outfit[b.focus] === c.id;
      return `<div class="sugg shop">${tile(c)}
        <div><div class="sugg-name">${c.name}</div><div class="unlock-line">${icon('unlock')}Unlocks ${c.unlock} outfits</div>
        <div class="sugg-sub">${fromPrice(c)}</div></div>
        ${on ? `<button class="btn xs" data-act="compare" data-id="${c.id}">Compare</button>` : `<button class="btn xs" data-act="put" data-slot="${b.focus}" data-id="${c.id}">Try it</button>`}</div>`;
    };

    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Outfit builder</div>
          <div class="outfit-name">${b.name}</div>
        </div>
        <div class="head-actions">
          <button class="btn" data-act="plan-outfit">${icon('planner')}Plan for a day</button>
          <button class="btn primary" data-act="save-outfit" ${complete && verdict.ok ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>Save outfit</button>
        </div>
      </header>

      <div class="builder">
        <section class="card tray" aria-label="Your closet">
          <div class="tray-tabs">${CATS.map((c) => `<button class="${b.tray === c.id ? 'active' : ''}" data-act="tray" data-v="${c.id}">${c.label}</button>`).join('')}</div>
          <div class="tray-grid">
            ${E.owned(b.tray)
              .map(
                (it) => `<button class="tray-item ${outfit[it.cat] === it.id ? 'on' : ''}" draggable="true" data-act="place" data-id="${it.id}" title="${it.name} · ${it.brand}">
              ${tile(it)}</button>`
              )
              .join('')}
          </div>
          <div class="tray-hint">Click or drag onto the board</div>
        </section>

        <section class="board-wrap" data-note="1">
          <div class="board" id="board" aria-label="Outfit board">${SLOTS.map(slotEl).join('')}</div>
          <div class="board-status" data-note="4">
            ${
              !complete
                ? `<span class="verdict empty">${icon('info')}Add a top, bottom and shoes to complete the outfit</span>`
                : verdict.ok
                ? `<span class="verdict ok">${icon('check')}These work together</span>`
                : `<span class="verdict bad">${icon('alert')}${verdict.reason}</span>`
            }
            <span class="share-line">${icon('closet')}<span><b>${items.length - trialItems.length} of ${items.length}</b> from your closet${trialItems.length ? ` · ${trialItems.length} to shop` : ''}</span></span>
          </div>
        </section>

        <section class="card complete" aria-label="Complete the look" data-note="2">
          <h3>Complete the look</h3>
          <p class="help">Pieces that work with everything else on the board.</p>
          <div class="slot-tabs">${SLOTS.map((s) => `<button class="${b.focus === s ? 'active' : ''}" data-act="focus-slot" data-slot="${s}">${SLOT_LABEL[s]}</button>`).join('')}</div>
          <div class="group">
            <div class="group-label">From your closet <span class="chip">Least-worn first</span></div>
            ${sugg.mine.length ? sugg.mine.map(row).join('') : `<div class="empty-note">Nothing you own fits with the rest of this outfit. Try changing another piece.</div>`}
          </div>
          <div class="group" data-note="3">
            <div class="group-label">Shop the gap ${state.showShop ? '<span class="chip">Ranked by outfits unlocked</span>' : ''}</div>
            ${
              state.showShop
                ? sugg.shop.length
                  ? sugg.shop.map(shopRow).join('')
                  : `<div class="empty-note">Nothing new needed here. Your closet already covers this slot.</div>`
                : `<div class="shop-off">${icon('info')}<span>Shopping suggestions are hidden. Only pieces you own are shown.</span></div>`
            }
          </div>
          <div class="complete-foot" data-note="5">${shopSwitch()}</div>
        </section>
      </div>`;
  }

  /* ---------- Fill the gap ---------- */
  function viewFill() {
    const picks = E.gapPicks().filter((p) => p.unlock > 0);
    const top3 = picks.slice(0, 3);
    const more = picks.slice(3);
    const total = top3.reduce((a, p) => a + p.unlock, 0);
    const spend = top3.reduce((a, p) => a + p.price, 0);
    const skipped = CATALOG.filter((c) => c.dupOf || E.unlock(c) === 0);

    const head = `
      <header class="page-head">
        <div>
          <div class="eyebrow">Fill the gap</div>
          <h1>${state.showShop ? `Three pieces, <em>${total} new outfits</em>` : 'Your closet, as it is'}</h1>
          <p class="sub">We compared common pieces across ${SUPPORTED_STORES.length} stores with your ${CLOSET.length}. These create the most new outfits with what you already own.</p>
        </div>
        <div class="head-actions">${shopSwitch()}</div>
      </header>`;

    if (!state.showShop)
      return (
        head +
        `<div class="card off-state">${icon('shield')}<h3>Shopping suggestions are off</h3>
        <p>Your closet already makes ${E.totalOutfits()} outfits. We'll keep styling what you own and won't show anything for sale until you turn this back on.</p>
        ${shopSwitch('Turn suggestions back on')}</div>`
      );

    const whyLine = (p) => {
      const outs = E.outfitsWith(p);
      const count = (k) => new Set(outs.map((o) => o[k])).size;
      if (p.cat === 'bottom')
        return `Pairs with ${count('top')} of your ${E.owned('top').length} tops and ${count('shoes')} of your ${E.owned('shoes').length} pairs of shoes. ${p.why}`;
      if (p.cat === 'top')
        return `Pairs with ${count('bottom')} of your ${E.owned('bottom').length} bottoms and ${count('shoes')} of your ${E.owned('shoes').length} pairs of shoes. ${p.why}`;
      return p.why;
    };

    const pickCard = (p, i) => {
      const prev = previewsFor(p, 3, i * 2);
      return `<article class="card pick" ${i === 0 ? 'data-note="1"' : ''}>
        <div class="pick-product"><span class="rank">${i + 1}</span>${tile(p)}</div>
        <div class="pick-info">
          <div><h3>${p.name}</h3><div class="price">${p.colorName} · ${fromPrice(p)}</div></div>
          <div class="unlock-big"><span class="num">${p.unlock}</span><span class="lbl">new outfits with what you own</span></div>
          <p class="why" ${i === 0 ? 'data-note="2"' : ''}>${whyLine(p)}</p>
          <div ${i === 0 ? 'data-note="3"' : ''}>${optionRows(p)}</div>
          <button class="btn sm" data-act="try-builder" data-id="${p.id}" style="align-self:flex-start">Try with my closet</button>
        </div>
        <div class="pick-previews">
          <div class="previews-label">Outfits it unlocks</div>
          <div class="previews">${prev
            .map((o) => `<figure>${flatlay(o)}<figcaption>${byId(p.cat === 'top' ? o.bottom : o.top).name} · ${byId(o.shoes).name}</figcaption></figure>`)
            .join('')}</div>
        </div>
      </article>`;
    };

    return `${head}
      <div class="card summary-bar">
        <div class="stack">${top3.map((p) => tile(p)).join('')}</div>
        <div class="txt"><b>${total} new outfits from ${money(spend)}</b><span>Lowest price for each piece, about ${money(spend / total)} per new outfit before a single wear.</span></div>
        <button class="btn" data-act="add-best">${icon('bag')}Add lowest prices to list</button>
      </div>
      ${top3.map(pickCard).join('')}

      <section class="section">
        <div class="section-head"><div><h3>Also worth a look</h3><p>Fewer new outfits, still a good fit with your closet.</p></div></div>
        <div class="more-picks">${more
          .map(
            (p) => `<article class="card mini-pick">${tile(p)}<div><h4>${p.name}</h4>
          <div class="unlock-line">${icon('unlock')}Unlocks ${p.unlock} outfits · from ${money(p.price)}</div><p>${p.why}</p>
          <button class="link" data-act="compare" data-id="${p.id}" style="margin-top:6px;font-size:12.5px">Compare ${storeCount(p)}</button></div></article>`
          )
          .join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><div><h3>What we didn't recommend, and why</h3><p>Fewer, better picks mean fewer returns and more trust.</p></div></div>
        <div class="card skipped" data-note="4">${skipped
          .map(
            (c) => `<div class="skip-row">${tile(c)}<div><h4>${c.name} · ${c.colorName}</h4><p>${c.why}</p></div>
          ${c.dupOf ? `<span class="chip warn">${icon('alert')}You own this</span>` : `<span class="chip">0 new outfits</span>`}</div>`
          )
          .join('')}</div>
      </section>
      <div class="section" data-note="5">${disclosure()}</div>`;
  }

  /* ---------- Planner ---------- */
  function looks(ids) {
    const its = ids.map(byId);
    const pick = (c) => its.filter((i) => i.cat === c);
    let n = 0;
    for (const t of pick('top')) for (const b of pick('bottom')) for (const s of pick('shoes')) if (E.check([t, b, s]).ok) n++;
    return n;
  }

  function viewPlanner() {
    const miss = byId(TRIP.missing);
    const honest = byId(TRIP.honest);
    const base = looks(TRIP.pack);
    const withMiss = looks([...TRIP.pack, TRIP.missing]);
    const day = (d) => {
      const status = d.worn
        ? `<span class="chip good">${icon('check')}Worn</span>`
        : d.today
        ? '<span class="chip" style="background:var(--ink);color:#fff">Today</span>'
        : d.rediscover
        ? '<span class="chip gap">Rediscover</span>'
        : '<span>Planned</span>';
      const n = Object.keys(d.outfit).length;
      return `<article class="card day ${d.today ? 'today' : ''}" ${d.rediscover ? 'data-note="2"' : ''}>
        <div class="day-head"><div><div class="d">${d.day}</div><div class="n">${d.date}</div></div><div class="wx">${icon(skyIcon[d.sky])}${d.temp}°</div></div>
        ${d.events.map((e) => `<div class="event">${e}</div>`).join('') || '<div class="event" style="opacity:.55">No events</div>'}
        ${flatlay(d.outfit)}
        <div class="day-foot">${status}<span>${n} pieces</span></div>
      </article>`;
    };
    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Planner</div>
          <h1>This week</h1>
          <p class="sub">October 5 to 11 · Planned around your calendar and the forecast.</p>
        </div>
        <div class="head-actions">
          <button class="icon-btn" aria-label="Previous week">${icon('left')}</button>
          <button class="icon-btn" aria-label="Next week">${icon('right')}</button>
          <button class="btn primary" data-act="toast" data-msg="Trip planning opens here in the full build">${icon('plus')}Plan a trip</button>
        </div>
      </header>
      <div class="week" data-note="1">${WEEK.map(day).join('')}</div>
      <article class="card trip" data-note="3">
        <div class="trip-head">
          <div><div class="eyebrow" style="margin-bottom:4px">Trip · ${TRIP.days}</div><h3 class="trip-title">${TRIP.name}</h3></div>
          <div class="trip-meta"><span class="wx">${icon('sun')}${TRIP.high}° / ${TRIP.low}°</span><span class="event">${TRIP.event}</span></div>
        </div>
        <div class="trip-body">
          <div>
            <h3 class="small">Packed: ${TRIP.pack.length} pieces, ${base} looks</h3>
            <div class="pack-grid" style="margin-top:10px">${TRIP.pack.map((id) => tile(byId(id))).join('')}</div>
          </div>
          ${
            state.showShop
              ? `<div class="gap-callout">${tile(miss)}<div>
            <h4>Missing: something dressier than jeans for the winery dinner</h4>
            <p>${miss.name} take your packed looks from ${base} to ${withMiss}, day and night. ${fromPrice(miss)}, in your size.</p>
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn sm gap" data-act="compare" data-id="${miss.id}">Compare stores</button><button class="btn sm" data-act="try-builder" data-id="${miss.id}">Try with my closet</button></div>
          </div></div>`
              : ''
          }
          <div class="honest">${tile(honest)}<span><b>Or pack your ${honest.name}.</b> They work for dinner with your linen shirt, but are too dressy for daytime tees.</span><button class="btn xs" data-act="toast" data-msg="Added ${honest.name} to your packing list">Pack</button></div>
        </div>
      </article>`;
  }

  /* ---------- Insights ---------- */
  function viewInsights() {
    const total = E.totalOutfits();
    const worn90 = CLOSET.filter(recent).length;
    const avgCpw = CLOSET.reduce((a, i) => a + i.price, 0) / CLOSET.reduce((a, i) => a + i.wears, 0);
    const most = [...CLOSET].sort((a, b) => b.wears - a.wears).slice(0, 8);
    const max = most[0].wears;
    const waiting = [...CLOSET].sort((a, b) => a.wears - b.wears).slice(0, 5);
    const counts = {};
    CLOSET.forEach((i) => (counts[E.storeOf(i)] = (counts[E.storeOf(i)] || 0) + 1));
    const storeRows = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const shown = storeRows.slice(0, 7);
    const rest = storeRows.slice(7);
    if (rest.length) shown.push([`${rest.length} other stores`, rest.reduce((a, r) => a + r[1], 0)]);
    const smax = Math.max(...shown.map((r) => r[1]));

    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Insights</div>
          <h1>Your closet is working</h1>
          <p class="sub">${worn90} of your ${CLOSET.length} pieces were worn in the last 90 days. Five are waiting for an outfit.</p>
        </div>
      </header>
      <div class="kpis" data-note="1">
        <div class="card kpi"><div class="v">${total}</div><div class="l">Outfits you can make</div><div class="s">From ${CLOSET.length} pieces</div></div>
        <div class="card kpi"><div class="v">${Math.round((worn90 / CLOSET.length) * 100)}<small>%</small></div><div class="l">Worn in 90 days</div><div class="s">${worn90} of ${CLOSET.length} pieces</div></div>
        <div class="card kpi"><div class="v">${money(avgCpw)}</div><div class="l">Average cost per wear</div><div class="s">Across every piece you own</div></div>
        <div class="card kpi"><div class="v">${E.stores().length}</div><div class="l">Stores in your closet</div><div class="s">Your size saved for each</div></div>
      </div>
      <div class="ins-grid">
        <article class="card card-pad">
          <h3 class="small">Most worn</h3>
          <div class="bars">${most
            .map(
              (it) => `<div class="bar-row" title="${it.name}: ${it.wears} wears, ${money(E.cpw(it))} per wear">${tile(it)}<span class="nm">${it.name}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(it.wears / max) * 100}%"></div></div>
            <span class="val">${it.wears} · ${money(E.cpw(it))}</span></div>`
            )
            .join('')}</div>
          <p class="meta-line" style="margin-top:10px">Wears · cost per wear</p>
        </article>
        <div style="display:flex;flex-direction:column;gap:22px">
          <article class="card card-pad" data-note="2">
            <h3 class="small">Waiting to be worn</h3>
            <p class="meta-line">Your least-worn pieces, one tap from an outfit</p>
            <div style="margin-top:8px">${waiting
              .map(
                (it) => `<div class="waiting-row">${tile(it)}<div><b>${it.name}</b><small>${it.brand} · ${it.wears} wears · ${money(E.cpw(it))}/wear</small></div>
              <button class="btn xs" data-act="style-item" data-id="${it.id}">Style it</button></div>`
              )
              .join('')}</div>
          </article>
          <article class="card card-pad">
            <h3 class="small">Pieces by store</h3>
            <div class="bars">${shown
              .map(
                ([k, n]) => `<div class="bar-row" style="grid-template-columns:minmax(0,150px) 1fr 40px" title="${k}: ${n} pieces"><span class="nm">${k}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(n / smax) * 100}%"></div></div><span class="val">${n}</span></div>`
              )
              .join('')}</div>
          </article>
        </div>
      </div>`;
  }

  /* ---------- Across the journey ---------- */
  function viewJourney() {
    const k = { ...byId('n1'), unlock: E.unlock(byId('n1')) };
    const hoodie = byId('t6');
    const cardi = byId('n5');
    const prev = previewsFor(k);
    const tee = byId('t1');
    const stages = [
      {
        name: 'Discover',
        where: "Any store's product page",
        thought: '“Will these go with anything I own?”',
        mock: `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>Store product page + browser extension</span></div><div class="mock-body">
          ${tile(k)}<div><div class="mock-title">Straight Chinos</div><div class="mock-price">${money(59.95)}</div></div>
          <div class="mock-module"><b>Goes with 9 tops you own</b><div class="mini-row">${['t3', 't1', 't4', 't5'].map((id) => tile(byId(id))).join('')}</div><div class="mock-btn light">See ${k.unlock} outfits</div></div>
        </div></div>`,
        hook: ['Your closet on any product page', 'A browser extension shows what a product pairs with, at any store.'],
        metric: 'Saves to shopping list',
      },
      {
        name: 'Evaluate',
        where: 'In a store',
        thought: '“I like them, but do I need them?”',
        mock: `<div class="mock phone"><div class="mock-body"><div class="viewfinder"><div class="tagcard">CHINO<i></i>32 × 30</div></div>
          <div class="sheet"><div class="mock-title">Straight chinos</div><b style="font-size:11px;color:var(--gap-ink)">${k.unlock} outfits with your closet</b>
          <div class="ok-line">${icon('check')}Nothing similar in your closet</div><div class="mock-btn">Save to closet if I buy</div></div></div></div>`,
        hook: ['Scan a tag in any store', 'See what it pairs with at home before buying.'],
        metric: 'Scans per active person',
      },
      {
        name: 'Purchase',
        where: 'Checkout, via the extension',
        thought: '“Didn’t I already buy one of these?”',
        mock: `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>Store checkout</span></div><div class="mock-body">
          <div class="warn-box"><b>You already own this</b><div style="display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:center">${tile(hoodie)}<span>${hoodie.name}, ${hoodie.colorName} · ${hoodie.wears} wears</span></div></div>
          <div style="display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:center">${tile(cardi)}<span><b style="font-size:11px">Try a ${cardi.name.toLowerCase()}?</b><br/>+${E.unlock(cardi)} new outfits</span></div>
          <div class="mock-btn light">See the cardigan</div><div class="mock-btn">Continue to checkout</div>
        </div></div>`,
        hook: ['A duplicate check at checkout', 'Flags near-duplicates and suggests a piece that adds more outfits.'],
        metric: 'Duplicate purchases avoided',
      },
      {
        name: 'Receive',
        where: 'Order email',
        thought: '“What do I wear these with first?”',
        mock: `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>Notification</span></div><div class="mock-body">
          <div class="email-head">Your chinos are in your closet</div><div class="mock-price">Added from your order email · three ways to wear them this week</div>
          <div class="mini-flats">${prev.map((o) => flatlay(o)).join('')}</div><div class="mock-btn">Plan my week</div>
        </div></div>`,
        hook: ['Orders add themselves, styled', 'The order email becomes a closet piece with outfits, so the first wear comes sooner.'],
        metric: 'Time to first wear',
      },
      {
        name: 'Wear',
        where: 'Daily, app and lock screen',
        thought: '“I have nothing to wear.”',
        mock: `<div class="mock phone"><div class="mock-body"><div class="lockscreen"><div class="time">7:42</div>
          <div class="notif"><div class="app-ic">o</div><div><b>Today's outfit</b>Oxford, chinos and boots. 61° and foggy, so bring the trench.</div></div>
          <div class="notif"><div class="app-ic">o</div><div><b>Friday is planned</b>Your blazer's first outing since June.</div></div></div></div></div>`,
        hook: ['A daily outfit from what they own', 'Explained by weather and calendar, with forgotten pieces brought back.'],
        metric: 'Outfits worn per week (north star)',
      },
      {
        name: 'Keep or return',
        where: 'Return-window reminders',
        thought: '“These don’t fit. And my favorite tee is wearing out.”',
        mock: `<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>Reminder</span></div><div class="mock-body">
          <div class="mock-title">Return window closes Friday</div><div class="mock-price">You haven't worn the chinos yet. Same pair in 32 × 32 still unlocks ${k.unlock} outfits.</div><div class="mock-btn">Exchange size</div>
          <div style="border-top:1px solid var(--line);padding-top:8px;display:grid;grid-template-columns:34px 1fr;gap:6px;align-items:center">${tile(tee)}<span><b style="font-size:11px">${tee.wears} wears on your ${tee.name}</b><br/>Find it again in size ${tee.size}?</span></div>
        </div></div>`,
        hook: ['Decide before the window closes', 'Exchange reminders while returns are still possible, and replacements timed to wear count.'],
        metric: 'Unworn purchases kept past the window',
      },
    ];

    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">Across the journey</div>
          <h1>One closet, every store</h1>
          <p class="sub">How the closet shows up at each stage of shopping, from a product page to a fitting room to a return. Each moment names the metric it should move.</p>
        </div>
      </header>
      <div class="journey" data-note="1">
        ${stages
          .map(
            (s, i) => `<div class="stage">
          <div class="stage-head"><span class="num">${i + 1}</span><span><b>${s.name}</b><span class="where">${s.where}</span></span></div>
          <div class="thought">${s.thought}</div>
          ${s.mock}
          <div class="hook"><b>${s.hook[0]}</b>${s.hook[1]}</div>
          <span class="metric">${icon('metric')}${s.metric}</span>
        </div>`
          )
          .join('')}
      </div>
      <div class="lanes" data-note="2">
        <article class="card lane">
          <h3>How it stays neutral</h3>
          <p>Product rules the customer can see, not promises.</p>
          <ul>
            <li>${icon('unlock')}<span>Pieces are ranked by outfits unlocked, style fit, size in stock and duplication only</span></li>
            <li>${icon('star')}<span>Stores are listed by the customer's favorites, then price</span></li>
            <li>${icon('shield')}<span>Commissions are disclosed and never change the ranking</span></li>
            <li>${icon('layers')}<span>Shopping can be switched off entirely; the closet still works</span></li>
          </ul>
        </article>
        <article class="card lane">
          <h3>Works with major stores</h3>
          <p>Order emails, product links and photos bring in clothes from anywhere.</p>
          <div class="store-chips">${SUPPORTED_STORES.map((s) => `<span class="chip">${s}</span>`).join('')}<span class="chip">and more</span></div>
        </article>
      </div>`;
  }

  /* ---------- Overlays ---------- */
  function modalEmail(step) {
    const imported = CLOSET.filter((i) => i.source === 'email');
    const storesFound = new Set(imported.map(E.storeOf));
    const steps = `<div class="steps">${[1, 2, 3].map((n) => `<span class="${n <= step ? 'on' : ''}"></span>`).join('')}</div>`;
    let body = '';
    if (step === 1)
      body = `${steps}<h2>Build your closet from your inbox</h2>
        <p class="lede">We look for order confirmations from clothing stores and add what you bought, with product photos, sizes and colors.</p>
        <div class="store-chips" style="margin-top:16px">${SUPPORTED_STORES.slice(0, 12).map((s) => `<span class="chip">${s}</span>`).join('')}<span class="chip">and more</span></div>
        <div class="consent">
          <button data-act="noop" aria-pressed="true"><span><b>Read order confirmations from clothing stores only</b><small>Nothing else in your inbox is opened or stored</small></span><span class="switch on"><span></span></span></button>
          <button data-act="noop" aria-pressed="true"><span><b>Add new orders automatically</b><small>Returns you send back are removed for you</small></span><span class="switch on"><span></span></span></button>
          <button data-act="toggle-shop" aria-pressed="${state.showShop}"><span><b>Suggest pieces that fill gaps in my closet</b><small>You can turn this off anytime</small></span><span class="switch ${state.showShop ? 'on' : ''}"><span></span></span></button>
        </div>
        <div class="fineprint">${icon('shield')}<span>Disconnect at any time and everything imported from your email is deleted. Your closet is never sold or shared with stores.</span></div>
        <div class="modal-actions"><button class="btn ghost" data-act="close">Not now</button><button class="btn" data-act="email-step" data-step="2">Use Outlook</button><button class="btn primary" data-act="email-step" data-step="2">Connect Gmail</button></div>`;
    if (step === 2)
      body = `${steps}<h2>We found ${imported.length} pieces from ${storesFound.size} stores</h2>
        <p class="lede">From order emails since 2023. Deselect anything you gave away or no longer own.</p>
        <div class="found-grid">${imported.map((it) => `<div class="thumb" title="${it.name} · ${E.storeOf(it)}">${tile(it)}<span class="check">${icon('check')}</span></div>`).join('')}</div>
        <div class="fineprint">${icon('info')}<span>Three returned orders were skipped automatically.</span></div>
        <div class="modal-actions"><button class="btn ghost" data-act="email-step" data-step="1">Back</button><button class="btn primary" data-act="email-step" data-step="3">Add ${imported.length} pieces</button></div>`;
    if (step === 3)
      body = `${steps}<h2>Your closet is started</h2>
        <p class="lede">${imported.length} pieces added in under a minute, with nothing typed. Add older pieces, gifts and thrift finds with a quick photo.</p>
        <div class="add-options">
          <button class="add-opt" data-act="photo">${icon('camera')}<b>Snap a photo</b><small>We remove the background and tag it</small></button>
          <button class="add-opt" data-act="toast" data-msg="Paste a link from any store to add it">${icon('link')}<b>Paste a product link</b><small>From any online store</small></button>
        </div>
        <div class="modal-actions"><button class="btn primary" data-act="close">Go to my closet</button></div>`;
    return `<div class="backdrop" data-act="close"></div><div class="modal-wrap"><div class="modal" role="dialog" aria-label="Connect your email">
      <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>${body}</div></div>`;
  }

  function modalAdd() {
    return `<div class="backdrop" data-act="close"></div><div class="modal-wrap"><div class="modal" role="dialog" aria-label="Add pieces">
      <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>
      <h2>Add pieces</h2><p class="lede">Most pieces arrive from your order emails. For everything else, pick the fastest way.</p>
      <div class="add-options">
        <button class="add-opt rec" data-act="email">${icon('mail')}<b>Import from order emails</b><small>Connected · checked today</small></button>
        <button class="add-opt" data-act="photo">${icon('camera')}<b>Snap a photo</b><small>Background removed, category and color tagged</small></button>
        <button class="add-opt" data-act="toast" data-msg="Paste a link from any store to add it">${icon('link')}<b>Paste a product link</b><small>From any online store</small></button>
        <button class="add-opt" data-act="toast" data-msg="Forward a receipt to your closet address to add it">${icon('mail')}<b>Forward a receipt</b><small>For stores we don't read automatically</small></button>
      </div></div></div>`;
  }

  function modalPhoto(step) {
    const it = { type: 'sneakers', color: '#F5F4F0' };
    return `<div class="backdrop" data-act="close"></div><div class="modal-wrap"><div class="modal" role="dialog" aria-label="Add from photo">
      <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>
      <h2>${step === 1 ? 'Reading your photo' : 'Does this look right?'}</h2>
      <p class="lede">${step === 1 ? 'Removing the background and identifying the piece.' : 'We tagged it from the photo. Tap a tag to change it.'}</p>
      <div class="scan">
        <div class="photo">${Garments.svg(it.type, it.color)}</div>
        <div class="arrow">${icon('arrow')}</div>
        ${step === 1 ? '<div class="shimmer"></div>' : tile(it)}
      </div>
      ${
        step === 2
          ? `<div class="tags"><span class="chip">${icon('tag')}Shoes</span><span class="chip">Sneakers</span><span class="chip">White</span><span class="chip">Casual</span><span class="chip">Fall · Spring · Summer</span></div>
        <div class="modal-actions"><button class="btn ghost" data-act="close">Retake</button><button class="btn primary" data-act="toast" data-msg="Added to your closet (demo)">Looks right</button></div>`
          : ''
      }
    </div></div>`;
  }

  function drawerCompare(p) {
    const piece = { ...p, unlock: E.unlock(p) };
    return `<div class="backdrop" data-act="close"></div>
      <aside class="drawer" role="dialog" aria-label="Compare stores for ${p.name}">
        <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>
        <div class="eyebrow">Compare stores</div>
        <div style="display:grid;grid-template-columns:96px 1fr;gap:16px;align-items:center">${tile(piece)}
          <div><h2>${p.name}</h2><div class="unlock-line" style="font-size:13px">${icon('unlock')}Unlocks ${piece.unlock} new outfits</div></div></div>
        <p class="why">${p.why}</p>
        ${optionRows(p)}
        ${disclosure()}
      </aside>`;
  }

  function drawerList() {
    const entries = state.list.map(fromKey);
    const byStore = {};
    entries.forEach((e) => (byStore[e.option.store] = byStore[e.option.store] || []).push(e));
    const total = entries.reduce((a, e) => a + e.option.price, 0);
    return `<div class="backdrop" data-act="close"></div>
      <aside class="drawer" role="dialog" aria-label="Shopping list">
        <button class="icon-btn close" data-act="close" aria-label="Close">${icon('x')}</button>
        <div><div class="eyebrow">Shopping list</div><h2>${entries.length ? `${entries.length} piece${entries.length > 1 ? 's' : ''}, ${money(total)}` : 'Your list is empty'}</h2></div>
        ${
          entries.length
            ? Object.entries(byStore)
                .map(
                  ([store, es]) => `<div class="list-store">
            <div class="list-store-head"><b>${store}</b><button class="btn xs primary" data-act="toast" data-msg="In the full app this opens ${store}'s site with your size selected">Buy at ${store} ${icon('out')}</button></div>
            ${es
              .map(
                ({ piece, option }) => `<div class="sugg">${tile(piece)}<div><div class="sugg-name">${option.product}</div>
              <div class="unlock-line">${icon('unlock')}+${E.unlock(piece)} outfits with your closet</div><div class="sugg-sub">${money(option.price)}${option.fit ? ` · ${option.fit.split(',')[0]}` : ''}</div></div>
              <button class="btn xs" data-act="remove-list" data-key="${listKey(piece.id, option.store)}">Remove</button></div>`
              )
              .join('')}
          </div>`
                )
                .join('') +
              `<div class="provenance">${icon('check')}<span><b>No duplicates.</b> Nothing on your list is too close to something you already own.</span></div>
          ${disclosure()}`
            : `<p class="sub">Pieces you add from Fill the gap land here, grouped by store, with the outfits they unlock.</p>
          <button class="btn primary" data-act="nav" data-view="fill">See Fill the gap</button>`
        }
      </aside>`;
  }

  function renderOverlay() {
    const o = state.overlay;
    let html = '';
    if (o?.type === 'item') html = drawerItem(byId(o.id));
    if (o?.type === 'list') html = drawerList();
    if (o?.type === 'compare') html = drawerCompare(byId(o.id));
    if (o?.type === 'email') html = modalEmail(o.step);
    if (o?.type === 'add') html = modalAdd();
    if (o?.type === 'photo') html = modalPhoto(o.step);
    $('#overlay').innerHTML = html;
    document.body.style.overflow = html ? 'hidden' : '';
    const focusable = $('#overlay .close');
    if (focusable) focusable.focus();
  }

  /* ---------- Design notes layer ---------- */
  function renderNotes() {
    document.querySelectorAll('.pin').forEach((p) => p.remove());
    $('#notes-panel')?.remove();
    document.querySelectorAll('.notes-toggle').forEach((t) => t.setAttribute('aria-pressed', String(state.notes)));
    if (!state.notes) return;
    const notes = NOTES[state.view];
    document.querySelectorAll('#main [data-note]').forEach((el) => {
      const n = el.dataset.note;
      el.insertAdjacentHTML('beforeend', `<button class="pin" data-act="note" data-n="${n}" aria-label="Design note ${n}">${n}</button>`);
    });
    const panel = document.createElement('div');
    panel.className = 'notes-panel';
    panel.id = 'notes-panel';
    panel.innerHTML = `
      <button class="icon-btn close" data-act="toggle-notes" aria-label="Hide design notes" style="position:absolute;top:14px;right:14px;width:32px;height:32px">${icon('x')}</button>
      <div class="eyebrow">Design notes · ${notes.title}</div>
      <h3>Why it works this way</h3>
      <p class="lede">${notes.lede}</p>
      <div style="margin-top:10px">${notes.items
        .map((i) => `<div class="note-item ${state.noteHL === i.n ? 'hl' : ''}" id="note-${i.n}"><span class="n">${i.n}</span><div><b>${i.title}</b><p>${i.body}</p></div></div>`)
        .join('')}</div>
      <div class="notes-foot">Prototype for a portfolio case study. Store names are used for illustration.</div>`;
    document.body.appendChild(panel);
    if (state.noteHL) $(`#note-${state.noteHL}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ---------- Render ---------- */
  const RENDER = { today: viewToday, closet: viewCloset, builder: viewBuilder, planner: viewPlanner, fill: viewFill, insights: viewInsights, journey: viewJourney };

  function render() {
    $('#side').innerHTML = side();
    $('#main').innerHTML = topbar() + RENDER[state.view]();
    renderNotes();
  }

  function go(view) {
    if (location.hash.slice(1) !== view) location.hash = view;
    else show(view);
  }
  function show(view) {
    state.view = VIEWS.includes(view) ? view : 'today';
    state.noteHL = null;
    state.overlay = null;
    renderOverlay();
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  let toastTimer;
  function toast(msg, ic = 'check') {
    const t = $('#toast');
    t.innerHTML = `${icon(ic)}<span>${msg}</span>`;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function addToList(key) {
    const { piece, option } = fromKey(key);
    if (!state.list.includes(key)) state.list.push(key);
    toast(`Added to your list · ${option.product} from ${option.store}, ${money(option.price)}`, 'bag');
    render();
    if (state.overlay) renderOverlay();
    return piece;
  }

  function place(id) {
    const it = byId(id);
    state.builder.outfit[it.cat] = id;
    state.builder.focus = it.cat;
    render();
  }

  function styleItem(id) {
    const it = byId(id);
    state.builder.outfit = { ...bestOutfitWith(it) };
    state.builder.focus = it.cat;
    state.builder.tray = it.cat;
    state.builder.name = isShop(it) ? `Trying ${it.name.toLowerCase()}` : `Styling the ${it.name}`;
    go('builder');
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, id, slot, v, key } = el.dataset;
    switch (act) {
      case 'nav': state.overlay = null; renderOverlay(); go(el.dataset.view); break;
      case 'toggle-notes': state.notes = !state.notes; state.noteHL = null; renderNotes(); break;
      case 'note': e.stopPropagation(); state.noteHL = +el.dataset.n; renderNotes(); break;
      case 'shuffle': state.todayIdx = (state.todayIdx + 1) % TODAY_PICKS.length; render(); break;
      case 'wear': toast('Logged as worn today. That’s 20 wears for your oxford.'); break;
      case 'edit-today':
        state.builder.outfit = { ...TODAY_PICKS[state.todayIdx].outfit };
        state.builder.name = 'Client presentation';
        state.builder.focus = 'bottom';
        go('builder');
        break;
      case 'open-item': state.overlay = { type: 'item', id }; renderOverlay(); break;
      case 'close': state.overlay = null; renderOverlay(); break;
      case 'closet-cat': state.closet.cat = v; render(); break;
      case 'closet-source': state.closet.source = v; render(); break;
      case 'add-list': e.stopPropagation(); addToList(key); break;
      case 'add-best':
        E.gapPicks().filter((p) => p.unlock > 0).slice(0, 3).forEach((p) => {
          const cheapest = [...p.options].sort((a, b) => a.price - b.price)[0];
          const k = listKey(p.id, cheapest.store);
          if (!state.list.includes(k)) state.list.push(k);
        });
        toast('Added the lowest price for each piece to your list', 'bag');
        render();
        break;
      case 'remove-list': state.list = state.list.filter((x) => x !== key); render(); renderOverlay(); break;
      case 'list': state.overlay = { type: 'list' }; renderOverlay(); break;
      case 'compare': e.stopPropagation(); state.overlay = { type: 'compare', id }; renderOverlay(); break;
      case 'style-item': state.overlay = null; renderOverlay(); styleItem(id); break;
      case 'try-builder': state.overlay = null; renderOverlay(); styleItem(id); break;
      case 'tray': state.builder.tray = v; render(); break;
      case 'place': place(id); break;
      case 'focus-slot': state.builder.focus = slot; if (CATS.some((c) => c.id === slot)) state.builder.tray = slot; render(); break;
      case 'remove-slot': e.stopPropagation(); delete state.builder.outfit[slot]; state.builder.focus = slot; render(); break;
      case 'put': state.builder.outfit[slot] = id; render(); break;
      case 'toggle-shop':
        state.showShop = !state.showShop;
        render();
        if (state.overlay) renderOverlay();
        toast(state.showShop ? 'Shopping suggestions are on' : `Shopping suggestions hidden. Your closet still makes ${E.totalOutfits()} outfits.`, 'shield');
        break;
      case 'save-outfit': toast('Saved to your outfits'); break;
      case 'plan-outfit': toast('Planned for Tuesday, October 6', 'planner'); break;
      case 'email': state.overlay = { type: 'email', step: 1 }; renderOverlay(); break;
      case 'email-step': state.overlay = { type: 'email', step: +el.dataset.step }; renderOverlay(); break;
      case 'add': state.overlay = { type: 'add' }; renderOverlay(); break;
      case 'photo':
        state.overlay = { type: 'photo', step: 1 };
        renderOverlay();
        setTimeout(() => {
          if (state.overlay?.type === 'photo') { state.overlay.step = 2; renderOverlay(); }
        }, 1500);
        break;
      case 'toast': toast(el.dataset.msg, 'info'); break;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'closet-sort') { state.closet.sort = e.target.value; render(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.overlay) { state.overlay = null; renderOverlay(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });

  /* Drag from the tray onto the board */
  document.addEventListener('dragstart', (e) => {
    const el = e.target.closest('.tray-item');
    if (el) e.dataTransfer.setData('text/plain', el.dataset.id);
  });
  document.addEventListener('dragover', (e) => {
    const board = e.target.closest('#board');
    if (board) { e.preventDefault(); board.classList.add('drag-over'); }
  });
  document.addEventListener('dragleave', (e) => {
    if (e.target.id === 'board') e.target.classList.remove('drag-over');
  });
  document.addEventListener('drop', (e) => {
    const board = e.target.closest('#board');
    if (!board) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) place(id);
  });

  render();
})();
