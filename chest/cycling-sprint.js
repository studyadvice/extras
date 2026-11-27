/* cycling-sprint.js v1.0：單車選手衝刺終點動畫。
   選手起步、加速、站起來衝刺，撞斷終點彩帶，彩紙噴出，舉手歡呼，最後顯示成績。
   背景有視差捲動的遠山、近山、夕陽、看台人群與護欄；可加 0 到 2 位對手。
   語意標籤：<cycling-sprint> <sprint-result>
   單一檔案，CSS 內建，不使用 Shadow DOM，不需要任何外部資源，離線也能用。全部畫在 canvas 上，顏色一律實色，不使用透明度。 */
(() => {
  'use strict';
  /* ── 顯示與隱藏（UIWorld 元件共用同一段，各檔內容相同，修改時請一起改）──
     頁面上的區塊可用四種寫法隱藏：class="bp-hidden"、class="d-none"、hidden 屬性、style="display: none;"。
     uivShow：四種全部清掉；仍被其他樣式隱藏時，才補 display:block。
     uivHide：加上 bp-hidden；仍看得見時（例如 Bootstrap 的 d-flex、行內 display:flex，或頁面沒載入 bp-styles.css），才補行內 display:none !important。
     uivHidden：目前是否隱藏。uivSave、uivRestore：記下與還原顯示狀態，重播或退回時使用。 */
  function uivShow(el) {
    if (!el || !el.style) return;
    if (el.classList) { el.classList.remove('bp-hidden'); el.classList.remove('d-none'); }
    if (el.hasAttribute && el.hasAttribute('hidden')) el.removeAttribute('hidden');
    if (el.style.display === 'none') el.style.removeProperty('display');
    if (el.isConnected && getComputedStyle(el).display === 'none') el.style.display = 'block';
  }
  function uivHide(el) {
    if (!el || !el.style) return;
    if (el.classList) el.classList.add('bp-hidden');
    if (!el.isConnected || getComputedStyle(el).display !== 'none') el.style.setProperty('display', 'none', 'important');
  }
  function uivHidden(el) {
    if (!el || !el.style) return true;
    if (el.isConnected) return getComputedStyle(el).display === 'none';
    return el.hidden || el.style.display === 'none' ||
      !!(el.classList && (el.classList.contains('bp-hidden') || el.classList.contains('d-none')));
  }
  function uivSave(el) {
    return {
      hidden: el.hasAttribute('hidden'), display: el.style.display,
      bp: el.classList.contains('bp-hidden'), dn: el.classList.contains('d-none')
    };
  }
  function uivRestore(el, s) {
    if (!el || !s) return;
    if (s.hidden) el.setAttribute('hidden', ''); else el.removeAttribute('hidden');
    el.style.display = s.display;
    el.classList.toggle('bp-hidden', s.bp);
    el.classList.toggle('d-none', s.dn);
  }

  if (customElements.get('cycling-sprint')) return;

  const PALETTE = { base:'#0C0D0C', shell:'#C6C7BD', vanilla:'#DBEDD8', yellow:'#E3D322', pink:'#FF91D7', red:'#EF6661', green:'#71CD76', blue:'#5DBAE8', indigo:'#778CE1', violet:'#B484E8', gray:'#86877F', key:'#51DBCF', calm:'#A3C4BC', quiet:'#8EA4DE', playful:'#FFA987', urgent:'#FF2E63', energetic:'#B6FF00', dreamy:'#C394CD', salmon:'#FFC88A', 'bg-alternative':'#2D2D2D' };
  const color = v => { if (!v) return ''; const t = String(v).trim(); return PALETTE[t.toLowerCase()] || t; };
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const hex = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); };
  /* 兩個實色混合（k＝a 的比例），用來算明暗與遠近 */
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v * k + B[i] * (1 - k)).toString(16).padStart(2, '0')).join(''); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const TAU = Math.PI * 2;
  const RIVALS = ['pink', 'blue', 'green', 'violet'].map(c => PALETTE[c]);
  const CONFETTI = ['yellow', 'pink', 'key', 'green', 'blue', 'violet', 'playful', 'salmon', 'energetic'].map(c => PALETTE[c]);
  /* 時間軸（0 到 1）：起步 → 加速 → 站起來衝刺（SPRINT_FROM）→ 過線（UC）→ 舉手滑行 → 停下 */
  const UC = 0.8, SPRINT_FROM = 0.56;

  const STYLE = `
cycling-sprint{display:inline-block;position:relative;vertical-align:middle;max-width:100%;}
cycling-sprint > sprint-result{display:none;}
cycling-sprint .cs-stage{position:relative;overflow:hidden;cursor:default;max-width:100%;}
cycling-sprint .cs-stage.cs-click{cursor:pointer;}
cycling-sprint canvas{display:block;width:100%;height:100%;pointer-events:none;}
cycling-sprint .cs-prize{position:absolute;left:50%;top:15%;transform:translate(-50%,-50%) scale(0);white-space:nowrap;text-align:center;pointer-events:none;z-index:3;}
cycling-sprint .cs-prize-in{display:inline-block;padding:10px 22px;border-radius:14px;background:var(--cs-pbg);color:var(--cs-pc);border:3px solid var(--cs-accent);font-size:var(--cs-pfs);font-weight:800;line-height:1.4;}
cycling-sprint .cs-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);color:var(--cs-hc);font-size:0.9rem;letter-spacing:2px;white-space:nowrap;animation:csHint 1.6s ease-in-out infinite;pointer-events:none;z-index:2;}
@keyframes csHint{0%,100%{transform:translate(-50%,0);}50%{transform:translate(-50%,-5px);}}
cycling-sprint .cs-hint.off{display:none;}
`;
  const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);

  /* ═════════ 繪圖小工具 ═════════ */
  const line = (c, a, b, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  const disc = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const poly = (c, pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  /* 兩段式肢體：a 為起點、b 為目標，回傳中間的關節（膝、手肘）。sign 決定彎曲方向 */
  const joint = (a, b, l1, l2, sign) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), base = Math.atan2(dy, dx) + sign * A;
    return [a[0] + l1 * Math.cos(base), a[1] + l1 * Math.sin(base)];
  };

  /* ═════════ 選手（側面，面向右）。座標：後輪軸心為原點，y 向下，地面在 y＝30 ═════════ */
  function drawRider(c, R) {
    const { jersey, shorts, helmet, bike, skin } = R, dark = col => mix(col, '#000000', 0.6);
    const BB = [52, 10], CL = 17, th = R.th;
    const pn = [BB[0] + CL * Math.cos(th), BB[1] + CL * Math.sin(th)], pf = [BB[0] - CL * Math.cos(th), BB[1] - CL * Math.sin(th)];
    const hip = R.hip, ang = R.ang * Math.PI / 180, sh = [hip[0] + 52 * Math.cos(ang), hip[1] + 52 * Math.sin(ang)];
    const e = R.vic * R.vic * (3 - 2 * R.vic);
    const handN = [lerp(108, sh[0] + 22, e), lerp(-54, sh[1] - 50, e)], handF = [lerp(106, sh[0] + 4, e), lerp(-52, sh[1] - 54, e)];
    const kneeN = joint(hip, pn, 52, 52, -1), kneeF = joint(hip, pf, 52, 52, -1);
    const elbN = joint(sh, handN, 28, 28, 1), elbF = joint(sh, handF, 28, 28, 1);
    c.save(); c.translate(R.x, R.y); c.scale(R.k, R.k);
    c.translate(60, 30); c.rotate(R.rock * Math.PI / 180); c.translate(-60, -30);
    /* 遠側的腿與手臂 */
    line(c, hip, kneeF, 15, dark(shorts)); line(c, kneeF, pf, 10, dark(skin)); line(c, [pf[0] - 4, pf[1] + 3], [pf[0] + 9, pf[1] + 4], 7, dark(PALETTE.shell));
    line(c, sh, elbF, 10, dark(jersey)); line(c, elbF, handF, 9, dark(skin));
    /* 單車：後輪、前輪、車架、龍頭、坐墊 */
    [[0, 0], [118, 0]].forEach(([wx, wy], wi) => {
      disc(c, wx, wy, 30, R.tire);
      disc(c, wx, wy, 27, R.road);
      for (let j = 0; j < 12; j++) { const a = R.ph + j * TAU / 12; line(c, [wx, wy], [wx + 27 * Math.cos(a), wy + 27 * Math.sin(a)], 1, PALETTE.gray); }
      c.strokeStyle = PALETTE.shell; c.lineWidth = 2.6; c.beginPath(); c.arc(wx, wy, 27.5, 0, TAU); c.stroke();
      c.strokeStyle = R.tire; c.lineWidth = 4; c.beginPath(); c.arc(wx, wy, 31, 0, TAU); c.stroke();
      disc(c, wx, wy, 3.2, PALETTE.shell);
    });
    const ST = [41, -48], HT = [100, -48], HB = [104, -34];
    line(c, BB, [0, 0], 4.5, bike); line(c, ST, [0, 0], 3.5, bike); line(c, BB, ST, 5, bike);
    line(c, ST, HT, 5, bike); line(c, BB, HB, 5.5, bike); line(c, HT, HB, 6, bike); line(c, HB, [118, 0], 4, bike);
    line(c, ST, [37, -58], 3, PALETTE.gray); line(c, [29, -59], [47, -58], 5.5, dark(PALETTE.shell));
    line(c, HT, [108, -54], 3.5, PALETTE.gray);
    c.strokeStyle = dark(PALETTE.shell); c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(108, -54); c.lineTo(116, -53); c.quadraticCurveTo(123, -50, 119, -42); c.stroke();
    disc(c, BB[0], BB[1], 9, PALETTE.gray); disc(c, BB[0], BB[1], 6.5, R.road);
    line(c, BB, pf, 3.5, dark(PALETTE.shell)); line(c, BB, pn, 3.5, PALETTE.shell);
    /* 軀幹、臀部、近側的腿 */
    line(c, hip, sh, 22, jersey);
    line(c, [lerp(hip[0], sh[0], 0.25), lerp(hip[1], sh[1], 0.25)], [lerp(hip[0], sh[0], 0.82), lerp(hip[1], sh[1], 0.82)], 6, mix(jersey, '#FFFFFF', 0.7));
    disc(c, hip[0], hip[1], 11.5, shorts);
    line(c, hip, kneeN, 16, shorts); line(c, kneeN, pn, 10.5, skin); line(c, [pn[0] - 4, pn[1] + 3], [pn[0] + 9, pn[1] + 4], 7.5, PALETTE.shell);
    /* 頭：安全帽、護目鏡、歡呼時張嘴 */
    const hd = [sh[0] + 9 * Math.cos(ang) + 4, sh[1] + 9 * Math.sin(ang) - 8];
    line(c, [sh[0] + 3, sh[1] - 2], hd, 8, skin);
    disc(c, hd[0], hd[1], 9.5, skin);
    c.save(); c.translate(hd[0] - 2, hd[1] - 3); c.rotate((R.ang * 0.5) * Math.PI / 180);
    c.fillStyle = helmet; c.beginPath(); c.ellipse(-3, 0, 17, 9.5, 0, 0, TAU); c.fill();
    c.fillStyle = mix(helmet, '#000000', 0.7); c.fillRect(-5, -1, 3, 2.4); c.fillRect(2, -3, 3, 2.4);
    c.restore();
    line(c, [hd[0] + 3, hd[1] - 0.5], [hd[0] + 9.5, hd[1] - 0.5], 3.6, PALETTE.base);
    if (R.vic > 0.3) disc(c, hd[0] + 6.5, hd[1] + 4.5, 2.6 * R.vic, '#8A2F2B');
    /* 近側手臂 */
    line(c, sh, elbN, 11, jersey); line(c, elbN, handN, 9.5, skin); disc(c, handN[0], handN[1], 5, skin);
    c.restore();
  }

  class CyclingSprint extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      else this._build();
    }
    disconnectedCallback() { if (this._io) this._io.disconnect(); cancelAnimationFrame(this._raf); this._raf = 0; }

    _opt() {
      const a = (n, d) => this.hasAttribute(n) ? this.getAttribute(n) : d;
      return {
        size: clamp(num(a('size'), 640), 240, 1600), trigger: a('trigger', 'click'), delay: num(a('delay'), 300),
        duration: clamp(num(a('duration'), 5200), 2000, 20000), rivals: clamp(Math.round(num(a('rivals'), 2)), 0, 2),
        hint: a('hint', '點擊衝刺'), replay: this.hasAttribute('replay') && a('replay') !== 'false', radius: num(a('radius'), 14),
        jersey: color(a('jersey', 'yellow')), shorts: color(a('shorts', 'indigo')), helmet: color(a('helmet-color', 'vanilla')),
        bike: color(a('bike-color', 'red')), skin: color(a('skin-color', 'salmon')),
        skyTop: color(a('sky-top', 'base')), skyBottom: color(a('sky-bottom', 'bg-alternative')), tape: color(a('tape-color', 'pink')),
        gate: a('gate-text', 'FINISH'), crowd: a('crowd', 'true') !== 'false', confetti: Math.max(0, Math.round(num(a('confetti'), 80))),
        standing: a('standing', 'true') !== 'false', accent: color(a('accent', 'yellow')),
        prizeBg: color(a('prize-bg', 'base')), prizeColor: color(a('prize-color', 'yellow')), prizeSize: a('prize-size', '1.4rem'),
        reveal: a('reveal-targets', ''), remove: a('remove-targets', '')
      };
    }

    _build() {
      const o = this._o = this._opt();
      this.W = Math.round(o.size); this.H = Math.round(o.size * 0.55); this.k = this.W / 760;
      this.style.setProperty('--cs-pbg', o.prizeBg); this.style.setProperty('--cs-pc', o.prizeColor); this.style.setProperty('--cs-accent', o.accent);
      this.style.setProperty('--cs-pfs', /^\d*\.?\d+$/.test(o.prizeSize) ? o.prizeSize + 'rem' : o.prizeSize);
      this.style.setProperty('--cs-hc', mix(PALETTE.shell, o.skyBottom, 0.85));
      const stage = this.stage = document.createElement('div'); stage.className = 'cs-stage';
      stage.style.width = this.W + 'px'; stage.style.height = this.H + 'px'; stage.style.borderRadius = o.radius + 'px'; stage.style.background = o.skyTop;
      const cv = this.cv = document.createElement('canvas'); const d = window.devicePixelRatio || 1;
      cv.width = this.W * d; cv.height = this.H * d; this.ctx = cv.getContext('2d'); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      stage.append(cv);
      const res = this.querySelector(':scope > sprint-result');
      this.prize = document.createElement('div'); this.prize.className = 'cs-prize';
      if (res && res.innerHTML.trim()) { const pin = document.createElement('div'); pin.className = 'cs-prize-in'; pin.innerHTML = res.innerHTML; this.prize.append(pin); }
      stage.append(this.prize);
      this.hintEl = document.createElement('div'); this.hintEl.className = 'cs-hint' + (o.hint && o.trigger === 'click' ? '' : ' off'); this.hintEl.textContent = o.hint;
      stage.append(this.hintEl);
      this.append(stage);
      this.state = 'ready'; this._done = { shown: [], removed: [] };
      this._plan();
      if (o.trigger === 'click') { stage.classList.add('cs-click'); stage.addEventListener('click', () => { if (this.state === 'ready') this.play(); else if (this.state === 'finished' && o.replay) this.reset(); }); }
      if (o.trigger === 'auto') {
        this._io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && this.state === 'ready') { this._io.disconnect(); setTimeout(() => this.play(), o.delay); } }, { threshold: 0.6 });
        this._io.observe(stage);
      }
      this.seek(0);
    }

    /* ── 事先算好整段的位置、踏板、車輪角度，所以任何時刻都能直接畫出來（seek） ── */
    _plan() {
      const o = this._o, W = this.W, N = 600, du = 1 / N, iuc = Math.round(UC * N), k = this.k;
      const vraw = u => (0.05 + 0.95 * sm(0, 0.42, u)) * (1 + 0.5 * sm(0.52, 0.78, u));
      const raw = [0]; for (let i = 1; i <= iuc; i++) raw[i] = raw[i - 1] + vraw((i - 0.5) * du) * du;
      const kp = (2.4 * W) / raw[iuc];
      const P = new Float64Array(N + 1), V = new Float64Array(N + 1);
      for (let i = 0; i <= iuc; i++) { P[i] = kp * raw[i]; V[i] = kp * vraw(i * du); }
      const vc = V[iuc];
      for (let i = iuc + 1; i <= N; i++) { const w = (i * du - UC) / (1 - UC); P[i] = P[iuc] + vc * (1 - UC) * (1 - Math.pow(1 - w, 3)) / 3; V[i] = vc * Math.pow(1 - w, 2); }
      const vmax = Math.max.apply(null, V), TH = new Float64Array(N + 1), secs = o.duration / 1000;
      for (let i = 1; i <= N; i++) TH[i] = TH[i - 1] + TAU * 3.1 * Math.pow(V[i] / vmax, 0.85) * secs * du;
      this.tab = { N, P, V, TH };
      this.XT = P[iuc] + 118 * k;   /* 終點線（彩帶）的位置：前輪碰到時，後輪軸心剛好在 P[iuc] */
      const r = rng(7), pc = [];
      for (let i = 0; i < o.confetti; i++) pc.push({ dx: (r() - 0.5) * 150 * k, vx: (r() - 0.35) * 360 * k, vy: -(150 + r() * 330) * k, col: CONFETTI[(r() * CONFETTI.length) | 0], s: (3 + r() * 3) * k, ph: r() * TAU, sp: 6 + r() * 8 });
      this.parts = pc;
      this.rivalCfg = [{ d: 0.14, G: 0.07, O: -0.07, ph: 1.9 }, { d: 0.5, G: 0.16, O: 0.04, ph: 3.7 }].slice(0, o.rivals);
    }
    _at(arr, u) { const N = this.tab.N, f = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); }

    /* ── 公開方法 ── */
    play() {
      if (this.state !== 'ready') return;
      this.state = 'running'; this.t0 = performance.now(); this.hintEl.classList.add('off'); this._crossed = false;
      this.dispatchEvent(new CustomEvent('cycling-sprint:start', { bubbles: true }));
      const tick = now => {
        const u = clamp((now - this.t0) / this._o.duration, 0, 1);
        this.seek(u);
        if (!this._crossed && u >= UC) { this._crossed = true; this.dispatchEvent(new CustomEvent('cycling-sprint:finish', { bubbles: true })); }
        if (u >= 1) { this._raf = 0; this._complete(); return; }
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }
    /* link-when 的 do="play"（預設）會呼叫 play() */
    start() { this.play(); }
    reset() {
      cancelAnimationFrame(this._raf); this._raf = 0; this.state = 'ready'; this._crossed = false;
      this.prize.style.transform = 'translate(-50%,-50%) scale(0)';
      if (this._o.hint && this._o.trigger === 'click') this.hintEl.classList.remove('off');
      this._undoTargets(); this.seek(0);
      this.dispatchEvent(new CustomEvent('cycling-sprint:reset', { bubbles: true }));
    }
    get finished() { return this.state === 'finished'; }
    _complete() {
      this.state = 'finished';
      const res = this._runTargets();
      this.dispatchEvent(new CustomEvent('cycling-sprint:finished', { bubbles: true, detail: res }));
    }

    /* ── 動畫結束後：顯示、刪除指定元素（寫法與 treasure-chest 相同） ── */
    _targets(list) {
      return String(list || '').split(',').map(s => s.trim()).filter(Boolean).flatMap(s => {
        const sel = /^[#.\[]/.test(s) || /[\s>:~+]/.test(s) ? s : '#' + s;
        try {
          const found = [...document.querySelectorAll(sel)];
          if (!found.length) console.warn(`[cycling-sprint] 找不到「${s}」`);
          return found;
        } catch (e) { console.warn(`[cycling-sprint] 無效的選擇器「${s}」`); return []; }
      });
    }
    _runTargets() {
      const o = this._o, shown = [], removed = [];
      this._targets(o.reveal).forEach(el => {
        shown.push({ el, vis: uivSave(el) });
        uivShow(el);
        if (el.animate) el.animate([{ transform: 'translateY(14px) scale(.97)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      });
      this._targets(o.remove).forEach(el => { if (!el.parentNode) return; removed.push({ el, parent: el.parentNode, next: el.nextSibling }); el.remove(); });
      this._done = { shown, removed };
      return { revealed: shown.map(x => x.el), removed: removed.map(x => x.el) };
    }
    _undoTargets() {
      const d = this._done || { shown: [], removed: [] };
      d.shown.forEach(x => { uivRestore(x.el, x.vis); });
      d.removed.slice().reverse().forEach(x => { x.parent.insertBefore(x.el, x.next && x.next.parentNode === x.parent ? x.next : null); });
      this._done = { shown: [], removed: [] };
    }

    /* ── 畫出 u（0 到 1）那一刻的畫面。可以單獨呼叫，用來預覽任何一個瞬間 ── */
    seek(u) {
      u = clamp(u, 0, 1);
      const o = this._o, c = this.ctx, W = this.W, H = this.H, k = this.k, secs = o.duration / 1000;
      const y0 = H * 0.56, y1 = H * 0.92, roadH = y1 - y0, shear = -0.05 * W;
      const p = this._at(this.tab.P, u), v = this._at(this.tab.V, u), th = this._at(this.tab.TH, u);
      const sx = 0.36 * W + 0.2 * W * sm(UC, 1, u);
      const cam = p - sx;
      const X = (wx, d) => wx - cam + shear * d;            /* 世界座標 → 螢幕 x（d：路面深度，0 遠、1 近） */
      const Y = d => y0 + roadH * d;
      const sprint = sm(SPRINT_FROM, SPRINT_FROM + 0.1, u) * (1 - sm(UC - 0.02, UC + 0.04, u));
      const road = mix(PALETTE.gray, PALETTE['bg-alternative'], 0.45), tire = '#0C0D0C';
      c.save();
      c.clearRect(0, 0, W, H);
      /* 天空與夕陽 */
      const sky = c.createLinearGradient(0, 0, 0, H * 0.55); sky.addColorStop(0, o.skyTop); sky.addColorStop(1, o.skyBottom);
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      const sunX = ((0.74 * W - cam * 0.02) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
      disc(c, sunX, H * 0.36, W * 0.075, mix(PALETTE.salmon, o.skyBottom, 0.22)); disc(c, sunX, H * 0.36, W * 0.05, mix(PALETTE.salmon, o.skyBottom, 0.5));
      /* 遠山、近山（視差） */
      const hills = (par, base, amp, f1, f2, col) => {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) { const wx = x + cam * par; c.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(wx * f1) + 0.15 * Math.sin(wx * f2 + 1.3))); }
        c.lineTo(W, H); c.closePath(); c.fill();
      };
      hills(0.1, H * 0.48, H * 0.2, 0.004, 0.011, mix(PALETTE.indigo, o.skyBottom, 0.22));
      hills(0.24, H * 0.55, H * 0.13, 0.0065, 0.019, mix(PALETTE.green, '#0C0D0C', 0.26));
      /* 草地、路面、護欄 */
      c.fillStyle = mix(PALETTE.green, '#0C0D0C', 0.2); c.fillRect(0, y0 - H * 0.04, W, H * 0.04 + 1);
      c.fillStyle = road; c.fillRect(0, y0, W, roadH);
      const sw = 44 * k;
      /* 看台人群（終點附近比較密，歡呼時舉手） */
      if (o.crowd) {
        const i0 = Math.floor((cam - 60 * k) / (15 * k)), i1 = Math.ceil((cam + W + 60 * k) / (15 * k));
        for (let i = i0; i <= i1; i++) {
          const r = rng(i * 7919 + 13), wx = i * 15 * k + r() * 8 * k, near = Math.abs(wx - this.XT) < 0.9 * W;
          if (!near && r() < 0.45) continue;
          const px = X(wx, 0), hh = (22 + r() * 8) * k, cheer = near && u > UC - 0.02 ? Math.max(0, Math.sin(u * 90 + i)) : 0;
          const col = [PALETTE.pink, PALETTE.blue, PALETTE.green, PALETTE.violet, PALETTE.playful, PALETTE.salmon, PALETTE.key][(r() * 7) | 0];
          const bodyC = mix(col, '#0C0D0C', 0.55 + r() * 0.2), by = y0 - 6 * k;
          c.fillStyle = bodyC; c.beginPath(); c.roundRect ? c.roundRect(px - 5 * k, by - hh, 10 * k, hh, 4 * k) : c.rect(px - 5 * k, by - hh, 10 * k, hh); c.fill();
          disc(c, px, by - hh - 4.5 * k, 4.4 * k, mix(PALETTE.salmon, '#0C0D0C', 0.55 + r() * 0.15));
          if (cheer > 0.3) line(c, [px + 4 * k, by - hh + 4 * k], [px + 7 * k, by - hh - 9 * k - cheer * 4 * k], 2.6 * k, bodyC);
        }
      }
      const fenceTop = y0 - 8 * k;
      const j0 = Math.floor((cam - 40 * k) / sw);
      for (let j = j0; j <= j0 + Math.ceil(W / sw) + 2; j++) {
        const bx = X(j * sw, 0);
        c.fillStyle = j % 3 === 0 ? mix(PALETTE.red, '#0C0D0C', 0.7) : j % 3 === 1 ? mix(PALETTE.blue, '#0C0D0C', 0.65) : mix(PALETTE.shell, '#0C0D0C', 0.55);
        c.fillRect(bx, fenceTop, sw - 2, 10 * k);
        c.fillStyle = mix(PALETTE.gray, '#0C0D0C', 0.5); c.fillRect(bx, fenceTop + 10 * k, sw - 2, 3 * k);
      }
      /* 終點拱門（在遠側，橫幅正對鏡頭） */
      const gx = X(this.XT, 0), gw = 0.34 * W, gh = 112 * k, gy = y0 - 2 * k;
      if (gx + gw / 2 > -20 && gx - gw / 2 < W + 20) {
        const pc = mix(PALETTE.gray, '#0C0D0C', 0.35);
        c.fillStyle = pc; c.fillRect(gx - gw / 2 - 6 * k, gy - gh, 12 * k, gh); c.fillRect(gx + gw / 2 - 6 * k, gy - gh, 12 * k, gh);
        c.fillStyle = mix(PALETTE.shell, '#0C0D0C', 0.7); c.fillRect(gx - gw / 2 - 6 * k, gy - gh, 3 * k, gh); c.fillRect(gx + gw / 2 - 6 * k, gy - gh, 3 * k, gh);
        const bh = 34 * k, bx0 = gx - gw / 2 - 6 * k, bw = gw + 12 * k, by = gy - gh - 4 * k;
        c.fillStyle = mix(PALETTE['bg-alternative'], '#0C0D0C', 0.55); c.fillRect(bx0, by, bw, bh);
        const cs = bh / 4;
        for (let i = 0; i < Math.floor(bw / cs); i++) for (let j = 0; j < 4; j += 3) { c.fillStyle = (i + j) % 2 ? PALETTE.shell : '#0C0D0C'; c.fillRect(bx0 + i * cs, by + j * cs, cs, cs); }
        c.fillStyle = PALETTE.vanilla; c.font = `800 ${Math.round(17 * k)}px "Microsoft JhengHei",system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(o.gate, gx, by + bh / 2 + 1);
      }
      /* 路面標線與路邊 */
      for (const dd of [0.34, 0.67]) { const jj0 = Math.floor((cam - 20 * k) / (70 * k)); for (let j = jj0; j <= jj0 + Math.ceil(W / (70 * k)) + 2; j++) { const lx = X(j * 70 * k, dd); c.fillStyle = mix(PALETTE.shell, road, 0.6); c.fillRect(lx, Y(dd) - 1.5, 34 * k, 3); } }
      c.fillStyle = mix(PALETTE.shell, road, 0.7); c.fillRect(0, y0, W, 2); c.fillRect(0, y1 - 2, W, 2);
      /* 終點線（路面上的方格） */
      for (let col = 0; col < 2; col++) for (let row = 0; row < 8; row++) {
        const wx = this.XT + (col - 1) * 12 * k, d0 = row / 8, d1 = (row + 1) / 8;
        poly(c, [[X(wx, d0), Y(d0)], [X(wx + 12 * k, d0), Y(d0)], [X(wx + 12 * k, d1), Y(d1)], [X(wx, d1), Y(d1)]], (col + row) % 2 ? PALETTE.shell : '#0C0D0C');
      }
      /* 前景路緣與暗部 */
      const kw = 36 * k, kj0 = Math.floor(cam / kw);
      for (let j = kj0; j <= kj0 + Math.ceil(W / kw) + 2; j++) { c.fillStyle = j % 2 ? PALETTE.shell : mix(PALETTE.red, '#0C0D0C', 0.9); c.fillRect(X(j * kw, 1), y1, kw, 7 * k); }
      c.fillStyle = mix(PALETTE['bg-alternative'], '#0C0D0C', 0.55); c.fillRect(0, y1 + 7 * k, W, H - y1);
      /* 速度線 */
      if (sprint > 0.02) {
        const r = rng(99), L = W * 1.4;
        for (let i = 0; i < 16; i++) {
          const ly = H * (0.2 + 0.72 * r()), len = (60 + 120 * r()) * k * sprint, lx = ((r() * L - cam * 2.3) % L + L) % L - len;
          c.fillStyle = mix(PALETTE.shell, road, 0.5); c.fillRect(lx, ly, len, 2 * k);
        }
      }
      /* 彩帶（兩端的小柱與彩帶，被撞斷後兩半垂落） */
      const tFar = [X(this.XT, 0.06), Y(0.06)], tNear = [X(this.XT, 0.94), Y(0.94)], th0 = 46 * k;
      const tb = u >= UC ? (u - UC) * secs : -1;
      const pole = (pt, kk) => { line(c, pt, [pt[0], pt[1] - th0 * kk], 4 * k, PALETTE.shell); disc(c, pt[0], pt[1] - th0 * kk, 3.2 * k, PALETTE.shell); };
      const dR = 0.86, brk = [X(this.XT, dR), Y(dR) - th0 * (0.9 + 0.2 * dR)];
      const tp = (pt, kk) => [pt[0], pt[1] - th0 * kk];
      /* 遠側的柱先畫，近側的柱最後畫（在選手前面） */
      pole(tFar, 0.9);
      if (tb < 0) { line(c, tp(tFar, 0.9), tp(tNear, 1.1), 3 * k, o.tape); }
      else {
        const f = sm(0, 0.7, tb), wob = Math.sin(tb * 9) * 5 * k * (1 - f);
        const endF = [lerp(brk[0], tFar[0] + 4 * k, f) + wob, lerp(brk[1], tFar[1] - 6 * k, f)], endN = [lerp(brk[0], tNear[0] - 4 * k, f) - wob, lerp(brk[1], tNear[1] - 6 * k, f)];
        [[tp(tFar, 0.9), endF], [tp(tNear, 1.1), endN]].forEach(([a, b]) => { c.strokeStyle = o.tape; c.lineWidth = 3 * k; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + wob, Math.max(a[1], b[1]) + 4 * k * f, b[0], b[1]); c.stroke(); });
      }
      /* 選手（依路面深度由遠到近） */
      const riders = [{ d: 0.86, main: true }].concat(this.rivalCfg.map((r, i) => ({ d: r.d, cfg: r, i }))).sort((a, b) => a.d - b.d);
      const stand = o.standing ? sm(SPRINT_FROM, SPRINT_FROM + 0.08, u) * (1 - sm(UC - 0.01, UC + 0.03, u)) : 0;
      riders.forEach(rd => {
        const main = !!rd.main, cfg = rd.cfg;
        const wx = main ? p : p - (cfg.G * W * sm(0.05, 0.8, u) + cfg.O * W * (1 - sm(0, 0.25, u)));
        const kd = k * (0.9 + 0.2 * rd.d), gy = Y(rd.d), rx = X(wx, rd.d), vic = main ? sm(UC, UC + 0.08, u) : 0;
        const tuck = sm(0.08, 0.3, u);
        let ang = lerp(lerp(-48, -20, tuck), -34, stand); ang = lerp(ang, -80, vic);
        const phase = main ? 0 : cfg.ph, hx = lerp(36, 44, stand) + 5 * Math.sin(th + phase) * stand, hy = lerp(-62, -74, stand);
        if (rx < -170 * kd || rx > W + 40 * kd) return;
        /* 地上的影子 */
        c.fillStyle = mix(road, '#000000', 0.6); c.beginPath(); c.ellipse(rx + 60 * kd, gy + 1 * kd, 78 * kd, 6 * kd, 0, 0, TAU); c.fill();
        drawRider(c, { x: rx, y: gy - 30 * kd, k: kd, jersey: main ? o.jersey : RIVALS[rd.i % RIVALS.length], shorts: main ? o.shorts : mix(PALETTE.base, PALETTE.gray, 0.6), helmet: main ? o.helmet : PALETTE.shell, bike: main ? o.bike : mix(PALETTE.blue, '#0C0D0C', 0.6), skin: o.skin, tire, road,
          th: th + phase, ph: p / (30 * kd) + phase, ang, hip: [hx, hy], vic, rock: 4.5 * Math.sin(th + phase) * stand });
      });
      /* 近側的柱（在選手前面），彩帶近端 */
      pole(tNear, 1.1);
      /* 彩紙：從終點拱門上方噴出，依時間算位置，所以可以隨時 seek */
      if (tb >= 0) {
        const ox = this.XT, oy = gy - gh;
        this.parts.forEach(q => {
          const t = tb, wx = ox + q.dx + q.vx * t * (1 - 0.35 * Math.min(1, t / 2)), yy = oy + q.vy * t + 0.5 * 560 * k * t * t, fl = Math.sin(t * q.sp + q.ph);
          const px = X(wx, 0.3) + fl * 8 * k;
          if (yy > H + 10 || px < -10 || px > W + 10) return;
          c.save(); c.translate(px, yy); c.rotate(t * q.sp * 0.6 + q.ph); c.scale(1, Math.max(0.2, Math.abs(Math.cos(t * q.sp * 0.9 + q.ph))));
          c.fillStyle = q.col; c.fillRect(-q.s, -q.s * 0.45, q.s * 2, q.s * 0.9); c.restore();
        });
      }
      c.restore();
      /* 成績：過線後彈出 */
      const pk = sm(UC + 0.07, UC + 0.2, u), bounce = pk < 1 ? 1 + 0.12 * Math.sin(pk * Math.PI) : 1;
      this.prize.style.transform = `translate(-50%,-50%) scale(${(pk * bounce).toFixed(3)})`;
    }
  }

  customElements.define('sprint-result', class extends HTMLElement {});
  customElements.define('cycling-sprint', CyclingSprint);
  window.CyclingSprint = { colors: PALETTE };

  /* 支援 <link-when event="done">：把完成事件登記到 link-when 的對照表（link-when.js 先載入或後載入都可以） */
  const reg = () => { const L = window.LinkWhen; if (L && L.doneEvents && !L.doneEvents['cycling-sprint']) L.doneEvents['cycling-sprint'] = 'cycling-sprint:finished'; };
  reg(); customElements.whenDefined('link-when').then(reg);
})();
