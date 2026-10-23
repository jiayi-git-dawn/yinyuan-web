window.YinPlantGrowth = {
  mount(root, options) {
  'use strict';
  options = options || {};
  let disposed = false;
  let frameId = 0;
  const NS = 'http://www.w3.org/2000/svg';

  const vine         = root.querySelector('.vine-stem');
  const leafLayer    = root.querySelector('[data-leaf-layer]');
  const tendrilLayer = root.querySelector('[data-tendril-layer]');
  const list         = root.querySelector('.plant-list');
  const sway         = root.querySelector('.vine-sway');

  leafLayer.replaceChildren();
  tendrilLayer.replaceChildren();
  list.replaceChildren();
  sway.classList.remove('run');

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. 固定种子随机：每次观感一致 ---------- */
  let _seed = 20240607;
  const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647;

  /* ---------- 1. 主茎：手工节点 + Catmull-Rom，摆脱"标准 S 形" ---------- */
  const NODES = [
    [172, 492], [167, 462], [152, 432], [120, 400], [ 96, 370], [ 99, 340],
    [126, 312], [158, 286], [176, 256], [174, 226], [152, 200], [120, 176],
    [ 98, 150], [104, 124], [130, 100], [148,  72], [140,  44], [116,  20]
  ];

  function catmullRomPath(pts) {
    const p = [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M ${p[1][0]} ${p[1][1]}`;
    for (let i = 1; i < p.length - 2; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i];
      const [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
      const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
      const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }
    return d;
  }

  vine.setAttribute('d', catmullRomPath(NODES));
  const TOTAL = vine.getTotalLength();
  vine.style.strokeDasharray  = TOTAL;
  vine.style.strokeDashoffset = TOTAL;

  /* ---------- 2. 路径几何工具 ---------- */
  const tangentAtT = t => {
    const a = vine.getPointAtLength(Math.max(0, t * TOTAL - 1.5));
    const b = vine.getPointAtLength(Math.min(TOTAL, t * TOTAL + 1.5));
    return Math.atan2(b.y - a.y, b.x - a.x);
  };

  const SAMPLES = (() => {
    const n = 800, arr = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = vine.getPointAtLength(t * TOTAL);
      arr.push({ x: p.x, y: p.y, t });
    }
    return arr;
  })();

  function sampleAtY(targetY) {
    let best = SAMPLES[0], bestD = Infinity;
    for (let i = 0; i < SAMPLES.length; i++) {
      const d = Math.abs(SAMPLES[i].y - targetY);
      if (d < bestD) { bestD = d; best = SAMPLES[i]; }
    }
    return best;
  }

  /* ---------- 3. 植物节点：用 y 定位，纵向间距均匀 ---------- */
  const PLANTS = [
    { name: '蒲公英', y: 465, side:  1 },
    { name: '含羞草', y: 406, side: -1 },
    { name: '四叶草', y: 348, side:  1 },
    { name: '爬山虎', y: 289, side: -1 },
    { name: '仙人掌', y: 231, side:  1 },
    { name: '向日葵', y: 172, side: -1 },
    { name: '苔藓',   y: 114, side:  1 },
    { name: '风信子', y:  55, side: -1 }
  ];

  const items = PLANTS.map(p => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'plant-item';
    el.textContent = p.name;
    el.setAttribute('aria-pressed', String(options.selected === p.name));
    el.tabIndex = -1;
    el.addEventListener('click', () => {
      const selected = el.getAttribute('aria-pressed') === 'true' ? null : p.name;
      items.forEach(item => item.el.setAttribute('aria-pressed', String(item.name === selected)));
      options.onSelect?.(selected);
    });
    list.appendChild(el);
    const pt = sampleAtY(p.y);
    return { ...p, el, pt, shown: false };
  });

  /* ---------- 4. 布局：文字贴着曲线，但不越界 ---------- */
  function layout() {
    const GAP = 16, PAD = 8, W = 300;
    items.forEach(it => {
      const w = it.el.offsetWidth || 60;
      const px = it.pt.x, py = it.pt.y;

      let left = it.side > 0 ? px + GAP : px - GAP - w;
      if (left + w > W - PAD) left = px - GAP - w;
      if (left < PAD)          left = px + GAP;
      left = Math.max(PAD, Math.min(W - w - PAD, left));

      // 首尾名称共用模块中轴；只移动文字，不改路径与叶片。
      if (it.name === '风信子' || it.name === '蒲公英') left = (W - w) / 2;
      it.el.style.left = left + 'px';
      it.el.style.top  = (py - 10) + 'px';
    });
  }

  /* ---------- 5. 叶片：按纵向高度散布，沿茎生长方向张开 ---------- */
  const LEAF_D = 'M0,0 C5,-7 15,-8 20,-1 C15,7 5,7 0,0 Z';
  const leaves = [];

  function addLeafAtY(targetY, flip, size) {
    const y = Math.max(22, Math.min(488, targetY));
    const s = sampleAtY(y);
    const deg = tangentAtT(s.t) * 180 / Math.PI;

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform',
      `translate(${s.x.toFixed(2)},${s.y.toFixed(2)}) rotate(${deg.toFixed(2)}) ` +
      `scale(${(flip * size).toFixed(3)},${size.toFixed(3)}) rotate(-24)`);

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'vine-leaf');
    path.setAttribute('d', LEAF_D);

    g.appendChild(path);
    leafLayer.appendChild(g);
    leaves.push({ t: s.t, el: path, shown: false });
  }

  items.forEach(it => addLeafAtY(it.y - 14, it.side, 0.85 + rnd() * 0.4));
  for (let i = 0; i < items.length - 1; i++) {
    const mid = (items[i].y + items[i + 1].y) / 2 + (rnd() - 0.5) * 10;
    addLeafAtY(mid, -items[i].side, 0.7 + rnd() * 0.35);
  }

  /* ---------- 6. 卷须：从茎上垂直方向飘出的细丝 ---------- */
  const TENDRILS = [
    { y: 430, s: -1, len: 26 },
    { y: 310, s:  1, len: 30 },
    { y: 205, s: -1, len: 22 },
    { y:  88, s:  1, len: 24 }
  ];

  const tendrilEls = TENDRILS.map(td => {
    const s = sampleAtY(td.y);
    const perp = tangentAtT(s.t) + Math.PI / 2 * td.s;

    const ex = s.x + Math.cos(perp) * td.len;
    const ey = s.y + Math.sin(perp) * td.len;
    const cx = s.x + Math.cos(perp + td.s * 0.8) * td.len * 0.55;
    const cy = s.y + Math.sin(perp + td.s * 0.8) * td.len * 0.55;

    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'vine-tendril');
    p.setAttribute('d', `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`);
    tendrilLayer.appendChild(p);
    return { t: s.t, el: p, shown: false };
  });

  /* ---------- 7. 生长节奏 ---------- */
  const DURATION = 7500;

  function growthEase(x) {
    const base  = 1 - Math.pow(1 - x, 1.9);
    const pulse = Math.sin(x * Math.PI * 4.5) * 0.012 * (1 - x);
    return Math.min(1, Math.max(0, base + pulse));
  }

  function finish() {
    sway.classList.add('run');
  }

  function showAll() {
    vine.style.strokeDashoffset = 0;
    items.forEach(i => { i.shown = true; i.el.classList.add('show'); });
    leaves.forEach(l => { l.shown = true; l.el.classList.add('show'); });
    tendrilEls.forEach(t => { t.shown = true; t.el.classList.add('show'); });
    finish();
  }

  // 名称显现后才进入键盘顺序，避免焦点落在尚不可见的位置。
  const focusObserver = new MutationObserver(() => {
    items.forEach(item => { item.el.tabIndex = item.el.classList.contains('show') ? 0 : -1; });
  });
  items.forEach(item => focusObserver.observe(item.el, { attributes: true, attributeFilter: ['class'] }));

  /* ---------- 8. 启动 ---------- */
  function start() {
    if (disposed) return;
    layout();
    if (REDUCE || options.immediate) { showAll(); return; }

    const t0 = performance.now();

    function tick(now) {
      if (disposed) return;
      const raw = Math.min(1, (now - t0) / DURATION);
      const p   = growthEase(raw);

      vine.style.strokeDashoffset = TOTAL * (1 - p);

      for (const it of items) {
        if (!it.shown && p >= it.pt.t) { it.shown = true; it.el.classList.add('show'); }
      }
      for (const lf of leaves) {
        if (!lf.shown && p >= lf.t) { lf.shown = true; lf.el.classList.add('show'); }
      }
      for (const td of tendrilEls) {
        if (!td.shown && p >= td.t) { td.shown = true; td.el.classList.add('show'); }
      }

      if (raw < 1) frameId = requestAnimationFrame(tick);
      else finish();
    }
    frameId = requestAnimationFrame(tick);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start, { once: true });
    if (document.readyState === 'complete') start();
  }
  return function destroy() {
    disposed = true;
    focusObserver.disconnect();
    cancelAnimationFrame(frameId);
    window.removeEventListener('load', start);
    sway.classList.remove('run');
    leafLayer.replaceChildren();
    tendrilLayer.replaceChildren();
    list.replaceChildren();
    vine.setAttribute('d', '');
  };
  }
};
