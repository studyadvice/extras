/**
 * rect-weave.js：裝飾用的矩形交織圖。只用水平線與垂直線，矩形大小不一、彼此重疊相連成一團，亂數生成。
 *
 *   <rect-weave width="360" height="420" count="12" color="key"></rect-weave>
 *
 * 屬性命名沿用既有元件：color、line-width、line-style、draw-speed、stagger、no-animation 同 ui-guide 與 ui-connect；
 * seed 同 mark-fx；show-grid 同 route-map；width 同 ui-teaching-guide。轉角一律直角，沒有圓角。
 *
 * 屬性
 *   width、height   整張圖的寬和高（px），預設 360、420
 *   count           矩形數量，預設 12
 *   seed            亂數種子，同一個值每次畫出同一張圖；不寫就每次不同，並在主控台印出這次的 seed
 *   grid            點陣間距（px），矩形的邊都對齊到格線，預設 18
 *   show-grid       布林：畫出背景點陣
 *   grid-color      點陣的顏色，預設 #2D2D2D
 *   min-size        矩形邊長的最小格數，預設 3
 *   max-size        矩形邊長的最大格數，預設 11
 *   shape           mix（預設，各種比例混合）、wide（多半是橫條）、tall（多半是直條）、square（接近正方形）
 *   density         0 到 1，越高越往中央擠，越低越鬆散，預設 0.5
 *   color           線的顏色，色票名稱或色碼；用逗號寫多個顏色時，每個矩形輪流使用，預設 key
 *   line-width      線的粗細（px），預設 3
 *   line-style      solid（預設）、dashed、dotted
 *   weave           布林：交叉的地方一上一下，像編織
 *   draw-speed      每個矩形畫出來的時間（ms），預設 600
 *   stagger         矩形依序出現的間隔（ms），預設 188
 *   no-animation    布林：直接顯示，不播放畫線動畫
 *
 * 圖片（屬性名稱同 ui-cards 的 image）
 *   image           圖片網址；用逗號寫多張時，分別放進不同的矩形
 *   image-pick      fit（預設）：挑形狀最接近圖片比例的矩形，裁掉最少；
 *                   any：在不太細的矩形裡依 seed 任選；
 *                   center：生成時先依圖片比例放好矩形，第一張在中央附近，其他矩形再圍著長
 *   image-tone      把圖片轉成單色調，例如 image-tone="key"：暗部是底色 #0C0D0C，亮部是指定的顏色
 *   圖片不變形，多的部分裁掉；圖片蓋在其他矩形的線上面，自己的邊框畫在圖片上；圖片沒有動畫。
 *   多張圖片時，放圖片的矩形彼此不重疊（可以貼著邊）；fit、any 找不到不重疊的矩形時才會重疊。
 *   「不太細」是指短邊至少 3 格、長邊不超過短邊的 2.5 倍（fit 與 any 都只從這些矩形裡挑）。
 *
 * 方法：regenerate(seed)（重新生成，可給新的 seed）、replay()（重播畫線動畫）
 * 事件：rect-weave:end（畫完）
 *
 * 違反下列任何一條，整張圖不顯示，並在主控台印出紅字錯誤：
 *   width、height、count、grid、min-size、max-size 不是正整數；min-size 大於 max-size；
 *   max-size 超過圖的格數；shape、line-style 的值不在清單裡；density 不在 0 到 1；line-width 不是正數；
 *   draw-speed、stagger 不是數字；矩形太多或圖太小，放不下；
 *   image-pick 的值不在清單裡；圖片比矩形多；圖片載入失敗；適合放圖片的矩形不夠。
 * 不使用 Shadow DOM。
 */
(() => {
  'use strict';
  if (customElements.get('rect-weave')) return;

  const PALETTE = { background:'#0C0D0C', base:'#0C0D0C', shell:'#C6C7BD', vanilla:'#DBEDD8', yellow:'#E3D322', pink:'#FF91D7', red:'#EF6661', green:'#71CD76', blue:'#5DBAE8', indigo:'#778CE1', violet:'#B484E8', gray:'#86877F', key:'#51DBCF', calm:'#A3C4BC', quiet:'#8EA4DE', playful:'#FFA987', urgent:'#FF2E63', energetic:'#B6FF00', dreamy:'#C394CD', salmon:'#FFC88A', 'bg-alternative':'#2D2D2D' };
  const color = v => { const t = String(v || '').trim(); return PALETTE[t.toLowerCase()] || t; };
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const SHAPES = ['mix', 'wide', 'tall', 'square'];
  const STYLES = ['solid', 'dashed', 'dotted'];
  const PICKS = ['fit', 'any', 'center'];

  /* 亂數：同一個 seed 得到同一串數字 */
  const hashSeed = s => { let h = 2166136261 >>> 0; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
  const rng = seed => { let a = hashSeed(seed); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  const STYLE = `
rect-weave{display:inline-block;vertical-align:top;line-height:0;}
rect-weave[data-error]{visibility:hidden;}
rect-weave svg{display:block;overflow:visible;}
`;
  const injectStyle = () => {
    if (document.querySelector('style[data-rect-weave]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-rect-weave', '');
    s.textContent = STYLE;
    document.head.appendChild(s);
  };

  let seq = 0;

  class RectWeave extends HTMLElement {
    connectedCallback() {
      if (this._started) return;
      this._started = true;
      injectStyle();
      this._uid = 'rw' + (++seq);
      this._build();
    }

    _opts() {
      const a = n => this.getAttribute(n), has = n => this.hasAttribute(n);
      const errs = [];
      const int = (n, d) => {
        if (!has(n)) return d;
        const v = String(a(n)).trim();
        if (!/^[1-9]\d*$/.test(v)) { errs.push(n + '="' + a(n) + '" 不是正整數'); return d; }
        return +v;
      };
      const numv = (n, d) => {
        if (!has(n)) return d;
        const v = String(a(n)).trim();
        if (!/^\d*\.?\d+$/.test(v)) { errs.push(n + '="' + a(n) + '" 不是數字'); return d; }
        return +v;
      };
      const o = {
        w: int('width', 360), h: int('height', 420), count: int('count', 12), grid: int('grid', 18),
        min: int('min-size', 3), max: int('max-size', 11),
        density: numv('density', 0.5), lw: numv('line-width', 3),
        speed: numv('draw-speed', 600), stagger: numv('stagger', 188),
        shape: (a('shape') || 'mix').trim().toLowerCase(),
        style: (a('line-style') || 'solid').trim().toLowerCase(),
        colors: (a('color') || 'key').split(',').map(color).filter(Boolean),
        weave: has('weave'), showGrid: has('show-grid'), gridColor: color(a('grid-color') || '#2D2D2D'),
        anim: !has('no-animation'),
        images: (a('image') || '').split(',').map(x => x.trim()).filter(Boolean),
        pick: (a('image-pick') || 'fit').trim().toLowerCase(),
        tone: has('image-tone') ? color(a('image-tone')) : ''
      };
      if (!PICKS.includes(o.pick)) errs.push('image-pick="' + a('image-pick') + '" 不是可用的值（' + PICKS.join('、') + '）');
      if (has('image') && !o.images.length) errs.push('image 沒有寫網址');
      if (o.images.length > o.count) errs.push('圖片有 ' + o.images.length + ' 張，比矩形數量 count（' + o.count + '）多');
      if (has('image-tone') && !o.tone) errs.push('image-tone 沒有寫顏色');
      if (!SHAPES.includes(o.shape)) errs.push('shape="' + a('shape') + '" 不是可用的值（' + SHAPES.join('、') + '）');
      if (!STYLES.includes(o.style)) errs.push('line-style="' + a('line-style') + '" 不是可用的值（' + STYLES.join('、') + '）');
      if (o.density > 1) errs.push('density="' + a('density') + '" 要在 0 到 1 之間');
      if (!(o.lw > 0)) errs.push('line-width 要大於 0');
      if (o.min > o.max) errs.push('min-size（' + o.min + '）大於 max-size（' + o.max + '）');
      o.cols = Math.floor((o.w - o.grid) / o.grid);
      o.rows = Math.floor((o.h - o.grid) / o.grid);
      if (o.cols < 1 || o.rows < 1) errs.push('width、height 比 grid 小，畫不出點陣');
      else if (o.max > Math.max(o.cols, o.rows)) errs.push('max-size（' + o.max + '）超過圖的格數（橫 ' + o.cols + ' 格、直 ' + o.rows + ' 格）');
      else if (o.min > Math.min(o.cols, o.rows)) errs.push('min-size（' + o.min + '）超過圖較短邊的格數（' + Math.min(o.cols, o.rows) + ' 格）');
      return { o, errs };
    }

    _fail(errs) {
      errs.forEach(m => console.error('[rect-weave] 錯誤：' + m + '。整張圖不顯示。', this));
      this.setAttribute('data-error', '');
      this.replaceChildren();
    }

    /* ---------- 生成 ---------- */
    _size(o, R) {
      const span = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
      const lo = o.min, hi = o.max, third = Math.max(lo, Math.ceil(hi / 3)), half = Math.max(lo, Math.ceil(hi / 2));
      /* wide、tall、square 是「多半」：七成照指定比例，三成混合，才會交織 */
      let kind = o.shape;
      if (kind !== 'mix' && R() < 0.3) kind = 'mix';
      if (kind === 'mix') { const r = R(); kind = r < 0.38 ? 'wide' : r < 0.76 ? 'tall' : 'square'; }
      let w, h;
      if (kind === 'wide') { w = span(half, hi); h = span(lo, third); }
      else if (kind === 'tall') { h = span(half, hi); w = span(lo, third); }
      else { w = span(lo, hi); h = Math.max(lo, Math.min(hi, w + span(-1, 1))); }
      return { w: Math.min(w, o.cols), h: Math.min(h, o.rows) };
    }

    _fits(c, list) {
      const touch = (a, b) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
      const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
      let linked = !list.length;
      for (const r of list) {
        if (r.w === c.w && r.h === c.h) return false;          /* 大小不一：不要和既有矩形同尺寸 */
        if (inside(c, r) || inside(r, c)) return false;        /* 不要整個包住或被包住，才會交織 */
        if (touch(c, r)) linked = true;
      }
      return linked;
    }

    /* 評分用：near 是平行的邊只差 1 格（像畫錯）、same 是邊重合（像平面圖）、cross 是穿過別的矩形的邊（交織感） */
    _score(c, list) {
      const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
      let near = 0, same = 0, cross = 0;
      for (const r of list) {
        const xs = [c.x, c.x + c.w], rxs = [r.x, r.x + r.w], ys = [c.y, c.y + c.h], rys = [r.y, r.y + r.h];
        if (overlap(c.y, c.y + c.h, r.y, r.y + r.h)) xs.forEach(p => rxs.forEach(q => { if (p === q) same++; else if (Math.abs(p - q) < 2) near++; }));
        if (overlap(c.x, c.x + c.w, r.x, r.x + r.w)) ys.forEach(p => rys.forEach(q => { if (p === q) same++; else if (Math.abs(p - q) < 2) near++; }));
        /* c 的水平邊穿過 r 的垂直邊，以及反過來 */
        ys.forEach(y => rxs.forEach(x => { if (x > c.x && x < c.x + c.w && y > r.y && y < r.y + r.h) cross++; }));
        rys.forEach(y => xs.forEach(x => { if (x > r.x && x < r.x + r.w && y > c.y && y < c.y + c.h) cross++; }));
      }
      return { near, same, cross };
    }

    /* image-pick="center"：依圖片比例決定矩形大小，盡量大，但不超過 max-size 與圖的格數 */
    _sizeFor(o, R, ratio, shrink) {
      /* 放不下時，每重試幾次就把上限縮小一格 */
      const maxW = Math.max(o.min, Math.min(o.max, o.cols) - shrink), maxH = Math.max(o.min, Math.min(o.max, o.rows) - shrink);
      let best = null, bs = Infinity;
      for (let w = o.min; w <= maxW; w++) for (let h = o.min; h <= maxH; h++) {
        const sc = Math.abs(Math.log((w / h) / ratio)) * 3 - (w * h) / (maxW * maxH) + R() * 0.18;
        if (sc < bs) { bs = sc; best = { w, h }; }
      }
      return best || { w: o.min, h: o.min };
    }

    _generate(o, R, ratios) {
      const list = [];
      const cx = o.cols / 2, cy = o.rows / 2, far = Math.hypot(cx, cy) || 1;
      for (let i = 0; i < o.count; i++) {
        let placed = null;
        for (let t = 0; t < 38 && !placed; t++) {
          const s = ratios && i < ratios.length ? this._sizeFor(o, R, ratios[i], Math.floor(t / 3)) : this._size(o, R);
          const cands = [];
          if (!list.length) {
            const c = { x: Math.round(cx - s.w / 2 + (R() - 0.5) * 2), y: Math.round(cy - s.h / 2 + (R() - 0.5) * 2), w: s.w, h: s.h };
            c.x = Math.max(0, Math.min(o.cols - s.w, c.x)); c.y = Math.max(0, Math.min(o.rows - s.h, c.y));
            cands.push(c);
          } else {
            /* 檢查所有可放的位置 */
            const imgRect = ratios && i < ratios.length;
            for (let x = 0; x <= o.cols - s.w; x++) for (let y = 0; y <= o.rows - s.h; y++) {
              const c = { x, y, w: s.w, h: s.h };
              /* center：放圖片的矩形彼此不重疊，可以貼著邊 */
              if (imgRect && list.some(r => this._cover(c, r))) continue;
              if (this._fits(c, list)) cands.push(c);
            }
          }
          if (!cands.length) continue;
          /* density 越高越靠近中央 */
          let best = null, bs = Infinity;
          cands.forEach(c => {
            const d = Math.hypot(c.x + c.w / 2 - cx, c.y + c.h / 2 - cy) / far;
            const k = this._score(c, list);
            const sc = o.density * d + (1 - o.density) * R() + k.near * 0.6 + k.same * 0.38 - Math.min(k.cross, 3) * 0.18;
            if (sc < bs) { bs = sc; best = c; }
          });
          placed = best;
        }
        if (!placed) return { list, fail: '第 ' + (i + 1) + ' 個矩形放不下（矩形太多、圖太小，或 min-size、max-size 太大）' };
        list.push(placed);
      }
      return { list };
    }

    _build(seedOverride) {
      this.removeAttribute('data-error');
      const token = this._token = (this._token || 0) + 1;
      const { o, errs } = this._opts();
      if (errs.length) { this._fail(errs); return; }
      if (!o.images.length) { this._make(o, seedOverride, []); return; }
      /* 先讀出每張圖片的大小，才知道比例 */
      Promise.all(o.images.map(src => new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res({ src, ratio: (im.naturalWidth || 1) / (im.naturalHeight || 1) });
        im.onerror = () => rej(src);
        im.src = src;
      }))).then(imgs => { if (token === this._token) this._make(o, seedOverride, imgs); },
        src => { if (token === this._token) this._fail(['圖片載入失敗：' + src]); });
    }

    /* 「不太細」的矩形才適合放圖片 */
    _okForImage(r) { const s = Math.min(r.w, r.h), l = Math.max(r.w, r.h); return s >= 3 && l <= s * 2.5; }

    _assign(o, list, imgs, R) {
      if (!imgs.length) return { map: [] };
      if (o.pick === 'center') return { map: imgs.map((im, i) => ({ rect: i, src: im.src })) };
      const free = list.map((r, i) => i).filter(i => this._okForImage(list[i]));
      if (free.length < imgs.length) return { fail: '適合放圖片的矩形只有 ' + free.length + ' 個（短邊至少 3 格、長邊不超過短邊的 2.5 倍），圖片有 ' + imgs.length + ' 張' };
      const map = [];
      imgs.forEach(im => {
        /* 盡量不和已經放了圖片的矩形重疊，避免圖片互相蓋住 */
        const clear = free.filter(ri => map.every(m => !this._cover(list[ri], list[m.rect])));
        const pool = clear.length ? clear : free;
        let pickRi;
        if (o.pick === 'any') pickRi = pool[Math.floor(R() * pool.length)];
        else {
          let bs = Infinity;
          const big = Math.max(...pool.map(ri => list[ri].w * list[ri].h));
          pool.forEach(ri => {
            const r = list[ri];
            /* 比例越接近越好，比例差不多時挑大的 */
            const sc = Math.abs(Math.log((r.w / r.h) / im.ratio)) - (r.w * r.h) / big * 0.6;
            if (sc < bs) { bs = sc; pickRi = ri; }
          });
        }
        map.push({ rect: pickRi, src: im.src });
        free.splice(free.indexOf(pickRi), 1);
      });
      return { map };
    }

    /* 兩個矩形的內部有沒有重疊（只貼著邊不算） */
    _cover(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }

    _make(o, seedOverride, imgs) {
      let seed = seedOverride != null ? String(seedOverride) : this.getAttribute('seed');
      if (seed == null || seed === '') {
        seed = String(Math.floor(Math.random() * 900000) + 100000);
        console.info('[rect-weave] 這張圖的 seed 是 ' + seed + '，寫上 seed="' + seed + '" 就能固定這張圖。', this);
      }
      this.setAttribute('data-seed', seed);
      /* 同一個 seed 放不下時，用同一串亂數整張重來，結果仍然固定 */
      const R = rng(seed);
      let g = null;
      const ratios = o.pick === 'center' ? imgs.map(im => im.ratio) : null;
      for (let t = 0; t < 12; t++) { g = this._generate(o, R, ratios); if (!g.fail) break; }
      if (g.fail) { this._fail([g.fail]); return; }
      const asg = this._assign(o, g.list, imgs, R);
      if (asg.fail) { this._fail([asg.fail]); return; }
      this._o = o;
      this._render(o, g.list, asg.map);
    }

    _render(o, list, pics) {
      const G = o.grid, off = G / 2;
      const P = v => off + v * G;
      const root = svg('svg', { width: String(o.w), height: String(o.h), viewBox: '0 0 ' + o.w + ' ' + o.h, 'aria-hidden': 'true' });
      const defs = svg('defs', {}, root);
      if (o.showGrid) {
        const dots = svg('g', { fill: o.gridColor }, root);
        for (let i = 0; i <= o.cols; i++) for (let j = 0; j <= o.rows; j++) svg('circle', { cx: String(P(i)), cy: String(P(j)), r: '1.5' }, dots);
      }
      const dash = o.style === 'dashed' ? (o.lw * 3) + ' ' + (o.lw * 2.5) : o.style === 'dotted' ? '0.1 ' + (o.lw * 2.2) : '';

      /* 交織：交叉點上，水平線與垂直線依格點位置輪流在上；在下的那一條斷開一小段 */
      const cuts = list.map(() => []);
      if (o.weave) {
        list.forEach((a, ia) => list.forEach((b, ib) => {
          if (ia === ib) return;
          [a.y, a.y + a.h].forEach(hy => [b.x, b.x + b.w].forEach(vx => {
            if (!(vx > a.x && vx < a.x + a.w && hy > b.y && hy < b.y + b.h)) return;
            const horizOnTop = (vx + hy) % 2 === 0;
            /* a 提供水平線、b 提供垂直線；在下的那一個斷開 */
            if (horizOnTop) cuts[ib].push([vx, hy, 'v']); else cuts[ia].push([vx, hy, 'h']);
          }));
        }));
      }

      this._items = list.map((r, i) => {
        const col = o.colors[i % o.colors.length];
        const d = 'M' + P(r.x) + ' ' + P(r.y) + ' H' + P(r.x + r.w) + ' V' + P(r.y + r.h) + ' H' + P(r.x) + ' Z';
        let parent = root;
        if (cuts[i].length) {
          const mid = this._uid + 'w' + i;
          const m = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: String(o.w), height: String(o.h) }, defs);
          svg('rect', { x: '0', y: '0', width: String(o.w), height: String(o.h), fill: '#FFFFFF' }, m);
          const gap = o.lw + 2, half = o.lw / 2 + 1;
          cuts[i].forEach(([gx, gy, dir]) => {
            const x = P(gx), y = P(gy);
            if (dir === 'h') svg('rect', { x: String(x - gap), y: String(y - half), width: String(gap * 2), height: String(half * 2), fill: '#000000' }, m);
            else svg('rect', { x: String(x - half), y: String(y - gap), width: String(half * 2), height: String(gap * 2), fill: '#000000' }, m);
          });
          parent = svg('g', { mask: 'url(#' + mid + ')' }, root);
        }
        /* 畫線動畫用的遮罩 */
        const did = this._uid + 'd' + i;
        const dm = svg('mask', { id: did, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: String(o.w), height: String(o.h) }, defs);
        const mp = svg('path', { d, fill: 'none', stroke: '#FFFFFF', 'stroke-width': String(o.lw + 6), 'stroke-linecap': 'square', pathLength: '1', 'stroke-dasharray': '1 1', 'stroke-dashoffset': o.anim ? '1' : '0' }, dm);
        const g = svg('g', o.anim ? { mask: 'url(#' + did + ')' } : {}, parent);
        const p = svg('path', { d, fill: 'none', stroke: col, 'stroke-width': String(o.lw), 'stroke-linejoin': 'miter', 'stroke-linecap': o.style === 'dotted' ? 'round' : 'square' }, g);
        if (dash) p.setAttribute('stroke-dasharray', dash);
        return { g, mp, did, d, col, dash };
      });

      /* 圖片：蓋在所有線上面，填滿矩形內側並裁掉多的部分；自己的邊框再畫在圖片上 */
      if (pics && pics.length) {
        let filter = '';
        if (o.tone) {
          const fid = this._uid + 'tone';
          const f = svg('filter', { id: fid, 'color-interpolation-filters': 'sRGB' }, defs);
          svg('feColorMatrix', { type: 'saturate', values: '0' }, f);
          const ct = svg('feComponentTransfer', {}, f);
          const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
          const lo = hex('#0C0D0C'), hi = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(o.tone) ? hex(o.tone) : [1, 1, 1];
          ['R', 'G', 'B'].forEach((ch, i) => svg('feFunc' + ch, { type: 'table', tableValues: lo[i].toFixed(3) + ' ' + hi[i].toFixed(3) }, ct));
          filter = 'url(#' + fid + ')';
        }
        const top = svg('g', {}, root);
        pics.forEach(pc => {
          const r = list[pc.rect], it = this._items[pc.rect], inset = o.lw / 2;
          const im = svg('image', {
            href: pc.src, x: String(P(r.x) + inset), y: String(P(r.y) + inset),
            width: String(r.w * G - o.lw), height: String(r.h * G - o.lw), preserveAspectRatio: 'xMidYMid slice'
          }, top);
          if (filter) im.setAttribute('filter', filter);
          const fg = svg('g', o.anim ? { mask: 'url(#' + it.did + ')' } : {}, top);
          const fp = svg('path', { d: it.d, fill: 'none', stroke: it.col, 'stroke-width': String(o.lw), 'stroke-linejoin': 'miter', 'stroke-linecap': o.style === 'dotted' ? 'round' : 'square' }, fg);
          if (it.dash) fp.setAttribute('stroke-dasharray', it.dash);
          it.fg = fg;
        });
      }
      this.replaceChildren(root);
      this.style.width = o.w + 'px';
      this.style.height = o.h + 'px';
      this.replay();
    }

    replay() {
      const o = this._o;
      if (!o || !this._items) return;
      if (this._timer) clearTimeout(this._timer);
      if (!o.anim) { this._end(0); return; }
      this._items.forEach((it, i) => {
        if (it.anim) it.anim.cancel();
        it.g.setAttribute('mask', 'url(#' + it.did + ')');
        if (it.fg) it.fg.setAttribute('mask', 'url(#' + it.did + ')');
        it.mp.setAttribute('stroke-dashoffset', '1');
        it.anim = it.mp.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: o.speed, delay: i * o.stagger, easing: 'ease-in-out', fill: 'forwards' });
        it.anim.onfinish = () => { it.mp.setAttribute('stroke-dashoffset', '0'); };
      });
      this._end(o.speed + (this._items.length - 1) * o.stagger);
    }

    _end(ms) {
      this._timer = setTimeout(() => this.dispatchEvent(new CustomEvent('rect-weave:end', { bubbles: true, detail: { seed: this.getAttribute('data-seed') } })), ms);
    }

    regenerate(seed) {
      this._build(seed == null ? '' : seed);
    }
  }

  customElements.define('rect-weave', RectWeave);
  window.RectWeave = RectWeave;

  /* 支援 <link-when event="done">：把完成事件登記到 link-when 的對照表。link-when.js 先載入或後載入都可以 */
  const reg = () => { const L = window.LinkWhen; if (L && L.doneEvents && !L.doneEvents['rect-weave']) L.doneEvents['rect-weave'] = 'rect-weave:end'; };
  reg(); customElements.whenDefined('link-when').then(reg);
})();
