/*
 * <ui-slice> 斜線分割拼貼元件
 * 用 <ui-cut> 子標籤定義分割線，用 <img> 子標籤依區域編號放入圖片。
 */
(() => {
  if (customElements.get('ui-slice')) return;

  const CSS = `
ui-slice{display:block;position:relative;width:100%;background:#2D2D2D;overflow:hidden;}
ui-slice > ui-cut, ui-slice > img{display:none;}
ui-slice .ui-slice-stage{position:absolute;inset:0;}
ui-slice .ui-slice-stage svg{display:block;width:100%;height:100%;}
ui-slice .ui-slice-alert{position:absolute;left:12px;right:12px;top:12px;margin:0;padding:12px 16px;background:#2D2D2D;color:#DBEDD8;border:1px solid #EF6661;border-left:6px solid #EF6661;border-radius:6px;font-size:0.95rem;line-height:1.6;}
ui-slice .ui-slice-alert strong{color:#EF6661;}
ui-slice .ui-slice-alert ul{margin:6px 0 0;padding:0 0 0 20px;}
ui-slice .ui-slice-alert.is-warning{top:auto;bottom:12px;border-color:#E3D322;}
ui-slice .ui-slice-alert.is-warning strong{color:#E3D322;}
ui-slice .ui-slice-debug text{font-family:system-ui,sans-serif;font-size:0.75rem;fill:#8EA4DE;}
ui-slice .ui-slice-debug text.is-cut{fill:#FF91D7;font-weight:700;}
ui-slice .ui-slice-debug text.is-region{fill:#E3D322;font-size:0.95rem;font-weight:700;}
`;

  const injectStyle = () => {
    if (document.getElementById('ui-slice-style')) return;
    const s = document.createElement('style');
    s.id = 'ui-slice-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  };

  const EPS = 1e-9;
  let uid = 0;
  const imgCache = new Map();

  const num = (v, d) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f2 = n => (Math.round(n * 100) / 100).toString();

  function parseRatio(v) {
    if (!v) return 16 / 9;
    const p = String(v).split(/[\/:]/).map(Number);
    const r = p.length === 2 ? p[0] / p[1] : p[0];
    return Number.isFinite(r) && r > 0 ? r : 16 / 9;
  }

  /* Park–Miller 亂數，固定種子產生固定結果 */
  function prng(seed) {
    const M = 2 ** 31 - 1;
    let s = Math.abs(Math.floor(seed)) % (M - 1) + 1;
    return () => {
      s = s * 16807 % M;
      return (s - 1) / (M - 1);
    };
  }

  /* 解析 "top:3"、"cut1:5" 這類端點 */
  function parseLoc(str, div, cutIndex) {
    const m = /^\s*(top|right|bottom|left|cut(\d+))\s*:\s*(\d+)\s*$/i.exec(str || '');
    if (!m) throw `「${str || ''}」格式錯誤，應寫成 top:3 或 cut1:5 這類形式`;
    const k = Number(m[3]);
    if (k < 1 || k > div - 1) throw `「${str}」的等分點必須介於 1 到 ${div - 1}`;
    let src = m[1].toLowerCase();
    if (m[2] !== undefined) {
      const n = Number(m[2]);
      if (cutIndex === 0) throw `第一條分割線只能接在外框上，不能參照「${str}」`;
      if (n < 1 || n > cutIndex) throw `「${str}」只能參照排在前面的分割線（cut1 到 cut${cutIndex}）`;
      src = n - 1;
    }
    return { src, t: k / div };
  }

  function edgePoint(src, t, W, H) {
    if (src === 'top') return [t * W, 0];
    if (src === 'right') return [W, t * H];
    if (src === 'bottom') return [t * W, H];
    return [0, t * H];
  }

  /*
   * 手繪強度：每一級的幅度比例、幅度上限（px）、波形組成 [最低頻率, 頻率範圍, 權重]、雙線最大分離（px）
   */
  const LEVELS = {
    subtle: { ratio: 0.008, cap: 5, waves: [[1, 1, 1], [3, 2, 0.2]], echo: 1 },
    normal: { ratio: 0.016, cap: 10, waves: [[1, 1.5, 1], [3, 2, 0.38], [7, 3, 0.16]], echo: 2 },
    strong: { ratio: 0.035, cap: 26, waves: [[1, 1.5, 1], [3, 2, 0.5], [8, 3, 0.25]], echo: 3 },
    wild: { ratio: 0.06, cap: 52, waves: [[1, 1, 1], [2.5, 1.5, 0.7], [6, 3, 0.38], [13, 5, 0.2]], echo: 5 }
  };

  function makeWobble(seed, amp, waves) {
    const rnd = prng(seed);
    const comps = waves.map(([f0, fr, a]) => [f0 + rnd() * fr, a, rnd() * Math.PI * 2]);
    return t => amp * Math.sin(Math.PI * t) *
      comps.reduce((s, [f, a, ph]) => s + a * Math.sin(2 * Math.PI * f * t + ph), 0);
  }

  /* 依序建立分割線的實際曲線；接在前一條線上的端點，取前一條線（含抖動）的實際位置 */
  function buildCuts(defs, W, H, sketch, seed, rough, lv) {
    const cuts = [];
    const pt = (src, t) => typeof src === 'number' ? cuts[src].at(t) : edgePoint(src, t, W, H);
    defs.forEach((d, i) => {
      const p0 = pt(d.a.src, d.a.t);
      const p1 = pt(d.b.src, d.b.t);
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const wob = sketch ? makeWobble(seed * 7919 + i * 131 + 1, rough * Math.min(len * lv.ratio, lv.cap), lv.waves) : null;
      const echo = sketch ? makeWobble(seed * 7919 + i * 131 + 977, rough * lv.echo / 1.5, lv.waves) : null;
      const at = t => {
        const w = wob ? wob(t) : 0;
        return [p0[0] + dx * t + nx * w, p0[1] + dy * t + ny * w];
      };
      const echoAt = t => {
        const p = at(t), w = echo ? echo(t) : 0;
        return [p[0] + nx * w, p[1] + ny * w];
      };
      cuts.push({ len, at, echoAt });
    });
    return { cuts, pt };
  }

  /* 拓撲分割：區域以「邊界片段」的循環串列表示，片段來源是外框四邊或某條分割線 */
  function partition(defs) {
    const clean = loop => loop.filter(p => Math.abs(p.t1 - p.t0) > EPS);
    const find = (loop, loc) => loop.findIndex(p => p.src === loc.src &&
      loc.t >= Math.min(p.t0, p.t1) - EPS && loc.t <= Math.max(p.t0, p.t1) + EPS);
    let regions = [[
      { src: 'top', t0: 0, t1: 1 },
      { src: 'right', t0: 0, t1: 1 },
      { src: 'bottom', t0: 1, t1: 0 },
      { src: 'left', t0: 1, t1: 0 }
    ]];
    defs.forEach((d, ci) => {
      for (let r = 0; r < regions.length; r++) {
        const loop = regions[r];
        const ia = find(loop, d.a), ib = find(loop, d.b);
        if (ia < 0 || ib < 0 || ia === ib) continue;
        const aFirst = ia < ib;
        const [i1, ta, i2, tb] = aFirst ? [ia, d.a.t, ib, d.b.t] : [ib, d.b.t, ia, d.a.t];
        const P = loop[i1], Q = loop[i2];
        const X = [{ ...P, t0: ta }, ...loop.slice(i1 + 1, i2), { ...Q, t1: tb }];
        const Y = [{ ...Q, t0: tb }, ...loop.slice(i2 + 1), ...loop.slice(0, i1), { ...P, t1: ta }];
        X.push(aFirst ? { src: ci, t0: 1, t1: 0 } : { src: ci, t0: 0, t1: 1 });
        Y.push(aFirst ? { src: ci, t0: 0, t1: 1 } : { src: ci, t0: 1, t1: 0 });
        regions.splice(r, 1, clean(X), clean(Y));
        return;
      }
      throw `cut${ci + 1}：兩端沒有落在同一個區域的邊界上，這條線會穿過其他分割線`;
    });
    return regions;
  }

  function loopPts(loop, G, sketch) {
    const pts = [];
    loop.forEach(p => {
      const n = (typeof p.src === 'number' && sketch)
        ? Math.max(2, Math.ceil(Math.abs(p.t1 - p.t0) * G.cuts[p.src].len / 6)) : 1;
      for (let k = 0; k < n; k++) pts.push(G.pt(p.src, p.t0 + (p.t1 - p.t0) * k / n));
    });
    return pts;
  }

  function polyStats(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const c = x0 * y1 - x1 * y0;
      a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
    }
    a /= 2;
    if (Math.abs(a) < EPS) return { area: 0, cx: 0, cy: 0 };
    return { area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) };
  }

  const pathD = (pts, close) => 'M' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L') + (close ? ' Z' : '');

  function parseFocus(v) {
    const word = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
    const parts = String(v || '50% 50%').trim().split(/\s+/);
    const one = s => s in word ? word[s] : Math.min(1, Math.max(0, num(s, 50) / 100));
    const fx = one(parts[0] || '50%');
    const fy = one(parts[1] || parts[0] || '50%');
    return [fx, fy];
  }

  class UiSlice extends HTMLElement {
    static get observedAttributes() {
      return ['ratio', 'line', 'gap', 'gap-color', 'stroke', 'stroke-width', 'seed', 'roughness', 'sketch-level', 'divisions', 'frame', 'debug'];
    }

    constructor() {
      super();
      this._id = 'ui-slice-' + (++uid);
      this._raf = 0;
      this._schedule = () => {
        if (!this._raf && this.isConnected) this._raf = requestAnimationFrame(() => this.render());
      };
    }

    connectedCallback() {
      injectStyle();
      if (!this._stage) {
        this._stage = document.createElement('div');
        this._stage.className = 'ui-slice-stage';
      }
      this.appendChild(this._stage);
      this._applyRatio();
      this._ro = new ResizeObserver(this._schedule);
      this._ro.observe(this);
      this._mo = new MutationObserver(ms => {
        const outside = ms.some(m => !this._stage.contains(m.target) &&
          !(m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(n => n === this._stage)));
        if (outside) this._schedule();
      });
      this._mo.observe(this, { childList: true, subtree: true, attributes: true });
      this._schedule();
    }

    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._mo) this._mo.disconnect();
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
    }

    attributeChangedCallback(name) {
      if (name === 'ratio') this._applyRatio();
      this._schedule();
    }

    _applyRatio() {
      this.style.aspectRatio = String(parseRatio(this.getAttribute('ratio')));
    }

    _opts() {
      const g = (n, d) => this.hasAttribute(n) ? this.getAttribute(n) : d;
      const dbg = this.getAttribute('debug');
      return {
        sketch: String(g('line', 'straight')).trim().toLowerCase() === 'sketch',
        gap: Math.max(0, num(g('gap'), 6)),
        gapColor: g('gap-color', '#0C0D0C'),
        stroke: g('stroke', '#C6C7BD'),
        sw: Math.max(0, num(g('stroke-width'), 2)),
        seed: Math.floor(num(g('seed'), 7)),
        rough: Math.max(0, num(g('roughness'), 1)),
        level: LEVELS[String(g('sketch-level', 'normal')).trim().toLowerCase()] || LEVELS.normal,
        div: Math.max(2, Math.floor(num(g('divisions'), 10))),
        frame: Math.max(0, num(g('frame'), 0)),
        debug: this.hasAttribute('debug') && dbg !== 'false'
      };
    }

    _meta(src) {
      let m = imgCache.get(src);
      if (!m) {
        m = { w: 0, h: 0, state: 'loading', subs: new Set() };
        imgCache.set(src, m);
        const im = new Image();
        im.onload = () => {
          m.w = im.naturalWidth; m.h = im.naturalHeight; m.state = 'ok';
          m.subs.forEach(f => f()); m.subs.clear();
        };
        im.onerror = () => { m.state = 'fail'; m.subs.forEach(f => f()); m.subs.clear(); };
        im.src = src;
      }
      if (m.state === 'loading') m.subs.add(this._schedule);
      return m;
    }

    _alert(list, warning) {
      const title = warning ? 'ui-slice 提醒' : 'ui-slice 設定錯誤';
      return `<div class="ui-slice-alert alert ${warning ? 'alert-warning is-warning' : 'alert-danger'}"><strong>${title}</strong><ul>${list.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
    }

    render() {
      this._raf = 0;
      if (!this._stage || !this.isConnected) return;
      const W = this.clientWidth;
      const H = this.clientHeight || W / parseRatio(this.getAttribute('ratio'));
      if (W < 2 || H < 2) return;
      const o = this._opts();
      const kids = [...this.children];
      const errors = [];

      const defs = kids.filter(e => e.tagName === 'UI-CUT').map((el, i) => {
        try {
          const a = parseLoc(el.getAttribute('from'), o.div, i);
          const b = parseLoc(el.getAttribute('to'), o.div, i);
          if (a.src === b.src) throw '兩端落在同一條邊或同一條分割線上，無法分割';
          return { a, b };
        } catch (e) {
          errors.push(`cut${i + 1}：${e}`);
          return null;
        }
      });
      if (errors.length) { this._stage.innerHTML = this._alert(errors); return; }

      let regions;
      try { regions = partition(defs); } catch (e) { this._stage.innerHTML = this._alert([String(e)]); return; }

      const S = buildCuts(defs, W, H, false, 0, 0);
      const R = o.sketch ? buildCuts(defs, W, H, true, o.seed, o.rough, o.level) : S;

      const info = regions.map(loop => {
        const st = polyStats(loopPts(loop, S, false));
        return { ...st, pts: loopPts(loop, R, o.sketch) };
      });
      if (info.some(r => r.area < 1)) {
        this._stage.innerHTML = this._alert(['有分割線切出面積為零的區域，請調整等分點']);
        return;
      }

      /* 編號：重心由上往下，同高再由左往右（以直線幾何計算，不受手繪抖動影響） */
      const order = info.map((_, i) => i).sort((i, j) =>
        Math.round(info[i].cy) - Math.round(info[j].cy) || info[i].cx - info[j].cx);

      /* 圖片分配：先處理指定 region 的圖，其餘依序補位 */
      const n = info.length;
      const slot = new Array(n).fill(null);
      const rest = [];
      kids.filter(e => e.tagName === 'IMG').forEach(img => {
        const r = parseInt(img.getAttribute('region'), 10);
        if (r >= 1 && r <= n && !slot[r - 1]) slot[r - 1] = img; else rest.push(img);
      });
      let extra = 0;
      rest.forEach(img => {
        const k = slot.indexOf(null);
        if (k >= 0) slot[k] = img; else extra++;
      });

      const warnings = [];
      let defsS = '', body = '';
      order.forEach((ri, k) => {
        const r = info[ri];
        const cid = `${this._id}-r${k + 1}`;
        defsS += `<clipPath id="${cid}"><path d="${pathD(r.pts, true)}"/></clipPath>`;
        let inner = '';
        const img = slot[k];
        const src = img ? (img.getAttribute('src') ? img.src : '') : '';
        if (src) {
          const m = this._meta(src);
          if (m.state === 'ok' && m.w && m.h) {
            const xs = r.pts.map(p => p[0]), ys = r.pts.map(p => p[1]);
            const bx = Math.min(...xs), by = Math.min(...ys);
            const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
            const zoom = Math.max(1, num(img.getAttribute('zoom'), 1));
            const [fx, fy] = parseFocus(img.getAttribute('focus'));
            const s = Math.max(bw / m.w, bh / m.h) * zoom;
            const dw = m.w * s, dh = m.h * s;
            inner = `<image href="${esc(src)}" x="${f2(bx + (bw - dw) * fx)}" y="${f2(by + (bh - dh) * fy)}" width="${f2(dw)}" height="${f2(dh)}" preserveAspectRatio="none"/>`;
          } else if (m.state === 'fail') {
            warnings.push(`區域 ${k + 1} 的圖片載入失敗：${img.getAttribute('src')}`);
          }
        }
        body += `<g clip-path="url(#${cid})"><rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#2D2D2D"/>${inner}</g>`;
      });

      const missing = slot.filter(s => !s).length;
      if (missing && !o.debug) warnings.push(`分割出 ${n} 個區域，缺少 ${missing} 張圖片`);
      if (extra) warnings.push(`多出 ${extra} 張圖片沒有區域可放`);

      const curve = (c, fn) => {
        const steps = o.sketch ? Math.max(2, Math.ceil(c.len / 6)) : 1;
        const pts = [];
        for (let k = 0; k <= steps; k++) pts.push(fn(k / steps));
        return pathD(pts, false);
      };

      let lines = '';
      if (o.gap > 0) {
        R.cuts.forEach(c => {
          lines += `<path d="${curve(c, c.at)}" fill="none" stroke="${esc(o.gapColor)}" stroke-width="${f2(o.gap)}" stroke-linecap="round" stroke-linejoin="round"/>`;
        });
      }
      if (o.sw > 0) {
        R.cuts.forEach(c => {
          lines += `<path d="${curve(c, c.at)}" fill="none" stroke="${esc(o.stroke)}" stroke-width="${f2(o.sw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
          if (o.sketch) {
            lines += `<path d="${curve(c, c.echoAt)}" fill="none" stroke="${esc(o.stroke)}" stroke-width="${f2(Math.max(0.6, o.sw * 0.6))}" stroke-linecap="round" stroke-linejoin="round"/>`;
          }
        });
      }
      /* 外框最後畫，蓋住線條末端 */
      if (o.frame > 0) {
        lines += `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="none" stroke="${esc(o.gapColor)}" stroke-width="${f2(o.frame * 2)}"/>`;
      }

      let dbg = '';
      if (o.debug) {
        dbg = '<g class="ui-slice-debug">';
        for (let k = 1; k < o.div; k++) {
          const t = k / o.div;
          [['top', 0, 16, 'middle'], ['bottom', 0, -12, 'middle'], ['left', 12, 0, 'start'], ['right', -12, 0, 'end']]
            .forEach(([e, ox, oy, anchor]) => {
              const [x, y] = edgePoint(e, t, W, H);
              dbg += `<circle cx="${f2(x)}" cy="${f2(y)}" r="3" fill="#51DBCF"/>`;
              dbg += `<text x="${f2(x + ox)}" y="${f2(y + oy)}" text-anchor="${anchor}" dominant-baseline="middle">${k}</text>`;
            });
          R.cuts.forEach(c => {
            const [x, y] = c.at(t);
            dbg += `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.5" fill="#FF91D7"/>`;
          });
        }
        R.cuts.forEach((c, i) => {
          const a = c.at(0.5), b = c.at(0.52);
          const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          dbg += `<text class="is-cut" x="${f2(a[0] - dy / l * 16)}" y="${f2(a[1] + dx / l * 16)}" text-anchor="middle" dominant-baseline="middle">cut${i + 1}</text>`;
        });
        order.forEach((ri, k) => {
          const r = info[ri];
          dbg += `<circle cx="${f2(r.cx)}" cy="${f2(r.cy)}" r="16" fill="#0C0D0C" stroke="#E3D322" stroke-width="1.5"/>`;
          dbg += `<text class="is-region" x="${f2(r.cx)}" y="${f2(r.cy)}" text-anchor="middle" dominant-baseline="central">${k + 1}</text>`;
        });
        dbg += '</g>';
      }

      this._stage.innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${f2(W)}" height="${f2(H)}"><defs>${defsS}</defs>${body}${lines}${dbg}</svg>` +
        (warnings.length ? this._alert(warnings, true) : '');
    }
  }

  customElements.define('ui-slice', UiSlice);
})();
