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

  if (customElements.get('treasure-chest')) return;

  const PALETTE = { base:'#0C0D0C', shell:'#C6C7BD', vanilla:'#DBEDD8', yellow:'#E3D322', pink:'#FF91D7', red:'#EF6661', green:'#71CD76', blue:'#5DBAE8', indigo:'#778CE1', violet:'#B484E8', gray:'#86877F', key:'#51DBCF', calm:'#A3C4BC', quiet:'#8EA4DE', playful:'#FFA987', urgent:'#FF2E63', energetic:'#B6FF00', dreamy:'#C394CD', salmon:'#FFC88A', 'bg-alternative':'#2D2D2D' };
  const color = v => { if (!v) return ''; const t = String(v).trim(); return PALETTE[t.toLowerCase()] || t; };
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const hex = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); };
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v * k + B[i] * (1 - k)).toString(16).padStart(2, '0')).join(''); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = { out: t => 1 - Math.pow(1 - t, 3), back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, inout: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
  const NS = 'http://www.w3.org/2000/svg';
  const esc = v => String(v).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  /* 估算文字寬度：全形字算 1 個字級，半形字算 0.6 */
  const estW = (str, fs) => [...String(str)].reduce((a, ch) => a + (ch.charCodeAt(0) > 255 ? 1 : 0.6) * fs, 0);
  const SANS = "'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif", SERIF = "'Noto Serif TC','Source Han Serif TC','PMingLiU',serif";
  /* 書頁上的文字線條：從 y0 開始，每 10 往下一行，共 n 行 */
  const textLines = (y0, n, col) => `<path d="${Array.from({ length: n }, (_, i) => `M60,${y0 + i * 10} H${[142, 134, 142, 124, 138][i % 5]}`).join(' ')}" stroke="${col}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
  /* 元寶：兩頭翹起、中間隆起的船形 */
  const ingotPath = (x, y, r) => `M${x - 1.3 * r},${y - 0.2 * r} Q${x - 1.3 * r},${y - 0.95 * r} ${x - 0.8 * r},${y - 0.75 * r} Q${x},${y - 0.1 * r} ${x + 0.8 * r},${y - 0.75 * r} Q${x + 1.3 * r},${y - 0.95 * r} ${x + 1.3 * r},${y - 0.2 * r} Q${x + 1.1 * r},${y + 0.9 * r} ${x},${y + 0.9 * r} Q${x - 1.1 * r},${y + 0.9 * r} ${x - 1.3 * r},${y - 0.2 * r} Z`;
  const CONFETTI = ['yellow', 'pink', 'key', 'green', 'blue', 'violet', 'playful', 'salmon', 'energetic'].map(c => PALETTE[c]);
  /* 文字粒子專用的 11 色：色相盡量分散。word-colors="auto" 時使用 */
  const WORD_COLORS = ['red', 'playful', 'yellow', 'energetic', 'green', 'key', 'blue', 'indigo', 'violet', 'pink', 'urgent'].map(c => PALETTE[c]);
  /* word-colors 屬性：沒寫 = 維持原本隨機；auto = 內建 11 色；也可自訂，例如 "red, key, #FFA987"。第 n 個詞固定用第 n 個顏色，詞比顏色多時輪流重複 */
  const parseWordColors = v => {
    const s = String(v || '').trim();
    if (!s) return null;
    if (s.toLowerCase() === 'auto') return WORD_COLORS;
    const list = s.split(/[,，、\s]+/).filter(Boolean).map(color).filter(Boolean);
    return list.length ? list : null;
  };

  const STYLE = `
treasure-chest{display:inline-block;position:relative;vertical-align:middle;}
treasure-chest > chest-prize{display:none;}
treasure-chest .tc-stage{position:relative;overflow:hidden;cursor:default;}
treasure-chest .tc-stage.tc-click{cursor:pointer;}
treasure-chest canvas{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;}
treasure-chest svg.tc-svg{position:absolute;left:50%;transform:translateX(-50%);overflow:visible;}
treasure-chest .tc-prize{position:absolute;left:50%;top:0;transform:translate(-50%,-50%) scale(0);white-space:nowrap;text-align:center;pointer-events:none;z-index:3;}
treasure-chest .tc-prize-in{display:inline-block;padding:10px 22px;border-radius:14px;background:var(--tc-pbg);color:var(--tc-pc);border:3px solid var(--tc-gold);font-size:var(--tc-pfs);font-weight:800;line-height:1.3;}
treasure-chest .tc-hint{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);color:var(--tc-hc);font-size:0.9rem;letter-spacing:2px;white-space:nowrap;animation:tcHint 1.6s ease-in-out infinite;pointer-events:none;}
@keyframes tcHint{0%,100%{transform:translate(-50%,0);}50%{transform:translate(-50%,-5px);}}
treasure-chest .tc-hint.off{display:none;}
`;
  const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);

  /* ═════════ 翻書類：魔法書與農民曆共用的結構 ═════════
     封面繞書脊（x=45）翻到左邊，四張書頁依序翻過去，最後停在右頁。
     書打開後整本往右移 55，書脊剛好落在舞台中線（x=100）。
     cfg.art：翻動書頁的內容　cfg.last：最後的右頁　cfg.front：封面　cfg.burst：書頁翻完、光芒噴出的時刻 */
  const bookType = cfg => ({
    main: cfg.main, trim: cfg.trim, items: 'word', count: 14, hint: cfg.hint, burst: cfg.burst, words: cfg.words, stamp: cfg.stamp || '', cover: cfg.cover || '',
    svg(o, c, id) {
      const ink = c.ink, page = `<rect x="49" y="19" width="104" height="142" rx="3" fill="${cfg.page}" stroke="${ink}" stroke-width="2.4"/>`;
      /* DOM 順序：最先翻的在最上面（最後放進 DOM） */
      const sheets = [3, 2, 1, 0].map(i => `<g class="tc-sheet">${page}${cfg.art(i, o, c)}</g>`).join('');
      return `
<g class="tc-book">
  <rect x="45" y="14" width="110" height="152" rx="6" fill="${c.mainD}" stroke="${ink}" stroke-width="3.5"/>
  ${page}${cfg.last(o, c, id)}
  <g class="tc-cin" style="display:none">
    <rect x="45" y="14" width="110" height="152" rx="6" fill="${c.mainD}" stroke="${ink}" stroke-width="3.5"/>
    <rect x="50" y="20" width="100" height="140" rx="3" fill="${mix(o.main, '#000000', 0.45)}"/>
    <rect x="57" y="27" width="86" height="126" rx="2" fill="none" stroke="${o.trim}" stroke-width="2" stroke-dasharray="3 4"/>
  </g>
  ${sheets}
  <g class="tc-cout">
    <rect x="45" y="14" width="110" height="152" rx="6" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3.5"/>
    <rect x="45" y="14" width="15" height="152" rx="5" fill="${c.mainD}" stroke="${ink}" stroke-width="2.6"/>
    <path d="M45,44 H60 M45,72 H60 M45,100 H60 M45,128 H60" stroke="url(#${id}-t)" stroke-width="3"/>
    <rect x="66" y="24" width="82" height="132" rx="4" fill="none" stroke="url(#${id}-t)" stroke-width="3"/>
    ${[[72, 30], [142, 30], [72, 150], [142, 150]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="${c.trimD}"/>`).join('')}
    ${cfg.front(o, c, id)}
    <g class="tc-clasp">
      <rect x="112" y="79" width="46" height="14" rx="3" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.6"/>
      <circle cx="119" cy="86" r="4" fill="${ink}"/>
    </g>
  </g>
</g>`;
    },
    refs(s) {
      const g = q => s.querySelector(q);
      return { book: g('.tc-book'), cin: g('.tc-cin'), cout: g('.tc-cout'), clasp: g('.tc-clasp'), sheets: [...s.querySelectorAll('.tc-sheet')].reverse(), rune: g('.tc-rune'), stamp: g('.tc-stamp'), moved: [] };
    },
    mouth() { return [100, 64]; },
    pose(r, u, rattle, o) {
      /* 封面：0.42 秒翻完。k 是封面的橫向縮放，過了 0 就換成封面內側 */
      const e = u < 0 ? 0 : ease.inout(clamp(u / 0.42, 0, 1)), k = Math.cos(u < 0 ? 0.3 * rattle : Math.PI * e);
      const tf = `translate(45 0) scale(${k} 1) translate(-45 0)`;
      r.cin.setAttribute('transform', tf); r.cout.setAttribute('transform', tf);
      r.cout.style.display = k < 0 ? 'none' : ''; r.cin.style.display = k < 0 ? '' : 'none';
      r.book.setAttribute('transform', `translate(${55 * e} 0)`);
      /* 扣帶：鬆開後垂在右側 */
      r.clasp.setAttribute('transform', `rotate(${u < 0 ? -10 * rattle : -80 * ease.out(clamp(u / 0.14, 0, 1))} 156 86)`);
      /* 書頁：依序翻過去，翻到左邊的那一張要疊在最上面 */
      const st = [0.3, 0.42, 0.54, 0.66], par = r.cout.parentNode;
      r.sheets.forEach((sh, i) => {
        const p = u < 0 ? 0 : clamp((u - st[i]) / 0.36, 0, 1), e2 = ease.inout(p), k2 = Math.cos(Math.PI * e2);
        sh.setAttribute('transform', `translate(47 ${(-7 * Math.sin(Math.PI * e2)).toFixed(2)}) scale(${k2} 1) translate(-47 0)`);
        if (k2 < 0 && !r.moved[i]) { r.moved[i] = true; par.insertBefore(sh, r.cout); }
      });
      if (u < 0 && r.moved.some(Boolean)) { for (let i = r.sheets.length - 1; i >= 0; i--) par.insertBefore(r.sheets[i], r.cout); r.moved = []; }
      if (r.rune) r.rune.style.color = u >= this.burst ? o.light : o.trim;
      let squash = u < 0 ? 0 : u < 0.1 ? 0.03 : 0;
      if (r.stamp) {
        /* 印章：從大蓋下來，剛好在光芒噴出的瞬間落地 */
        const w = u - (this.burst - 0.2);
        if (w < 0) r.stamp.style.display = 'none';
        else { r.stamp.style.display = ''; r.stamp.setAttribute('transform', `translate(101 92) rotate(-8) scale(${(1 + 1.5 * (1 - ease.out(clamp(w / 0.2, 0, 1)))).toFixed(3)})`); }
        const v2 = u - this.burst;
        if (v2 > -0.02 && v2 < 0.1) squash = 0.045 * (1 - (v2 + 0.02) / 0.12);
      }
      return { squash };
    }
  });

  const BOOK = {
    main: '#B484E8', trim: '#E3D322', page: '#F4F3EC', hint: '點擊翻開', burst: 1.0, words: ['Aa', 'Bb', '學', '習', '7.0', 'Good'],
    art: i => textLines(34 + (i % 2) * 6, 11, '#C6C7BD'),
    last: o => `${textLines(32, 3, '#C6C7BD')}<g class="tc-rune" style="color:${o.trim}" stroke="currentColor" fill="none"><circle cx="101" cy="88" r="30" stroke-width="3"/><circle cx="101" cy="88" r="22" stroke-width="2" stroke-dasharray="4 5"/><path d="M101,64 L106,83 L125,88 L106,93 L101,112 L96,93 L77,88 L96,83 Z" fill="currentColor" stroke="none"/></g>${textLines(128, 3, '#C6C7BD')}`,
    front: (o, c, id) => `<circle cx="107" cy="78" r="24" fill="none" stroke="url(#${id}-t)" stroke-width="3"/><circle cx="107" cy="78" r="17" fill="none" stroke="${o.trim}" stroke-width="1.8" stroke-dasharray="3 4"/><path d="M107,56 L112,73 L129,78 L112,83 L107,100 L102,83 L85,78 L102,73 Z" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2"/>${o.cover ? `<text x="107" y="132" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="800" fill="${c.trimL}" font-family="${SANS}">${esc(o.cover)}</text>` : `<path d="M84,126 H130 M92,136 H122" stroke="${c.trimL}" stroke-width="3" stroke-linecap="round"/>`}`
  };

  const calendar = (i, last) => `<rect x="55" y="26" width="92" height="14" rx="2" fill="${PALETTE.red}" stroke="#0C0D0C" stroke-width="1.6"/><path d="M55,52 H147 M55,72 H147 M55,92 H147 M55,112 H147 M55,132 H147 M55,152 H147 M78,44 V152 M101,44 V152 M124,44 V152" stroke="#C9B77A" stroke-width="1.6"/>${last ? '' : `<rect x="${60 + (i * 2 % 4) * 23}" y="${56 + (i * 3 % 4) * 20}" width="12" height="12" rx="2" fill="${PALETTE.red}"/>`}`;
  const ALMANAC = {
    main: '#EF6661', trim: '#E3D322', page: '#F3E6B5', hint: '點擊翻開今日', burst: 1.05, stamp: '宜', cover: '農民曆', words: ['宜', '福', '吉', '喜', '運', '祿', '壽'],
    art: i => calendar(i, false),
    last: o => {
      const t = [...String(o.stamp || '宜')], n = t.length, fs = n <= 1 ? 52 : n === 2 ? 30 : 20;
      return `${calendar(0, true)}<g class="tc-stamp" style="display:none"><rect x="-34" y="-34" width="68" height="68" rx="5" fill="#F3E6B5" stroke="${PALETTE.red}" stroke-width="5"/><rect x="-27" y="-27" width="54" height="54" rx="2" fill="none" stroke="${PALETTE.red}" stroke-width="1.8"/><text x="0" y="2" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="900" fill="${PALETTE.red}" font-family="${SERIF}">${esc(o.stamp || '宜')}</text></g>`;
    },
    front: (o, c, id) => {
      const ch = [...String(o.cover || '農民曆')].slice(0, 5), n = Math.max(1, ch.length), step = Math.min(28, 92 / n), fs = Math.min(26, step - 2), y0 = 102 - step * (n - 1) / 2;
      return `<circle cx="107" cy="40" r="11" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.4"/><text x="107" y="41" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="900" fill="${c.mainD}" font-family="${SERIF}">福</text>${ch.map((t, i) => `<text x="107" y="${(y0 + i * step).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="900" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="0.8" font-family="${SERIF}">${esc(t)}</text>`).join('')}<path d="M80,146 H134" stroke="url(#${id}-t)" stroke-width="2.4" stroke-linecap="round"/>`;
    }
  };

  /* ═════════ 場景類共用：有框的小視窗，沒有光芒與星光 ═════════ */
  const sceneFrame = (c, id) => `
<rect x="10" y="14" width="180" height="152" rx="14" fill="none" stroke="${c.ink}" stroke-width="8"/>
<rect x="10" y="14" width="180" height="152" rx="14" fill="none" stroke="url(#${id}-t)" stroke-width="4.4"/>
${[[20, 24], [180, 24], [20, 156], [180, 156]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.4" fill="${c.trimD}"/>`).join('')}
<path d="M24,32 Q26,26 36,25" stroke="${c.trimL}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

  /* 輕軌路線（地面座標 X 左右、Z 往遠處）：先直行，再轉 70 度的彎，最後朝鏡頭直直駛來。
     s 是沿路線走的距離；s 小於 0 往遠處延伸，大於總長往鏡頭延伸 */
  const TRAM = (() => {
    const A0 = 200 * Math.PI / 180, L1 = 20, R = 22, L2 = R * 70 * Math.PI / 180, LT = L1 + L2;
    const raw = s => {
      if (s <= L1) return [Math.cos(A0) * s, Math.sin(A0) * s, A0];
      const a = Math.min(s, LT) - L1, al = A0 + a / R;
      let X = Math.cos(A0) * L1 + R * (Math.sin(al) - Math.sin(A0)), Z = Math.sin(A0) * L1 - R * (Math.cos(al) - Math.cos(A0));
      if (s > LT) { X += Math.cos(al) * (s - LT); Z += Math.sin(al) * (s - LT); }
      return [X, Z, al];
    };
    const E = raw(LT), ox = -E[0], oz = 7.6 - E[1];
    /* 投影：鏡頭在原點、高度 6、朝 +Z；F 是焦距，HY 是地平線在畫面上的高度 */
    const F = 70, HY = 60, HC = 4.3;
    return {
      LT, F, HY, HC, A: 4.2, B: 1.25, Y0: 0.3, Y1: 3.3,
      at: s => { const r = raw(s); return [r[0] + ox, r[1] + oz, r[2]]; },
      pr: (X, Y, Z) => { const z = Math.max(Z, 1.5); return [100 + F * X / z, HY + F * (HC - Y) / z]; }
    };
  })();
  const poly = pts => 'M' + pts.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' L') + ' Z';

  /* ═════════ 街道場景用：2:1 等角投影（約 45 度俯視）與角色圖 ═════════
     世界座標 x 往右下、y 往左下、z 往上；x + y 越大離鏡頭越近 */
  const iso = (x, y, z = 0) => [100 + (x - y), 98 + (x + y) / 2 - z];
  const isoL = (x, y, z) => [x - y, (x + y) / 2 - z];
  /* 汽車：一個車身方塊加一個車窗方塊。ax 是行進軸（x 或 y），dir 是方向，看得見的那一端：往前開是車頭燈，往後開是車尾燈 */
  const carSVG = (ax, dir, col, ink) => {
    const L = 10, W = 5, lx = ax === 'x' ? L : W, ly = ax === 'x' ? W : L, H = 3.4, win = mix(PALETTE.indigo, '#000000', 0.5);
    const box = (x0, y0, x1, y1, z0, z1, cT, cR, cL) => `<path d="${poly([isoL(x1, y0, z0), isoL(x1, y1, z0), isoL(x1, y1, z1), isoL(x1, y0, z1)])}" fill="${cR}"/><path d="${poly([isoL(x0, y1, z0), isoL(x1, y1, z0), isoL(x1, y1, z1), isoL(x0, y1, z1)])}" fill="${cL}"/><path d="${poly([isoL(x0, y0, z1), isoL(x1, y0, z1), isoL(x1, y1, z1), isoL(x0, y1, z1)])}" fill="${cT}"/>`;
    const off = -dir * 0.8, cx0 = ax === 'x' ? off - 2.5 : -lx / 2 + 0.7, cx1 = ax === 'x' ? off + 2.5 : lx / 2 - 0.7, cy0 = ax === 'x' ? -ly / 2 + 0.7 : off - 2.5, cy1 = ax === 'x' ? ly / 2 - 0.7 : off + 2.5;
    const lc = dir > 0 ? PALETTE.yellow : PALETTE.red, lamp = yc => ax === 'x'
      ? `<path d="${poly([isoL(lx / 2, yc - 0.6, 1.3), isoL(lx / 2, yc + 0.6, 1.3), isoL(lx / 2, yc + 0.6, 2.4), isoL(lx / 2, yc - 0.6, 2.4)])}" fill="${lc}" stroke="none"/>`
      : `<path d="${poly([isoL(yc - 0.6, ly / 2, 1.3), isoL(yc + 0.6, ly / 2, 1.3), isoL(yc + 0.6, ly / 2, 2.4), isoL(yc - 0.6, ly / 2, 2.4)])}" fill="${lc}" stroke="none"/>`;
    const sh = [[-lx / 2 + 0.8, -ly / 2 + 0.8], [lx / 2 + 0.8, -ly / 2 + 0.8], [lx / 2 + 0.8, ly / 2 + 0.8], [-lx / 2 + 0.8, ly / 2 + 0.8]].map(q => isoL(q[0], q[1], 0));
    return `<g stroke="${ink}" stroke-width="0.5" stroke-linejoin="round"><path d="${poly(sh)}" fill="${mix(PALETTE.gray, '#000000', 0.28)}" stroke="none"/>`
      + box(-lx / 2, -ly / 2, lx / 2, ly / 2, 0.6, H, col, mix(col, '#000000', 0.7), mix(col, '#000000', 0.55))
      + lamp(-(ax === 'x' ? ly : lx) * 0.28) + lamp((ax === 'x' ? ly : lx) * 0.28)
      + box(cx0, cy0, cx1, cy1, H, H + 2.6, mix(col, '#FFFFFF', 0.85), win, mix(win, '#000000', 0.7)) + '</g>';
  };
  /* 行人：腳下是原點。離開的人手上拎著商品袋 */
  const pedSVG = (shirt, skin, bag, ink, bagCol) => `<g stroke="${ink}" stroke-width="0.4" stroke-linejoin="round"><ellipse cx="0" cy="0" rx="2.6" ry="1.1" fill="${mix(PALETTE.gray, '#000000', 0.28)}" stroke="none"/>
<rect x="-1.5" y="-2.4" width="1.3" height="2.4" fill="#0C0D0C"/><rect x="0.2" y="-2.4" width="1.3" height="2.4" fill="#0C0D0C"/>
<rect x="-1.9" y="-6.6" width="3.8" height="4.6" rx="1.2" fill="${shirt}"/>
<circle cx="0" cy="-8.4" r="2" fill="${skin}"/>${bag ? `<rect x="1.9" y="-4.8" width="2.2" height="2.8" rx="0.4" fill="${bagCol}"/>` : ''}</g>`;

  /* ═════════ 八種圖形：預設色、SVG、開啟動作、光芒出口 ═════════
     座標：viewBox 0 -60 200 230，寬 200，底部在 y=166。
     u：搖晃結束後經過的秒數（搖晃期間與待機為負數）；burst：光芒在 u 的哪一刻噴出；rattle：搖晃時的震動量（0 到 1） */
  const TYPES = {
    /* ── 寶箱 ── */
    chest: {
      main: '#8A5530', trim: '#E8B931', items: 'coin', count: 10, hint: '點擊打開', burst: 0.06,
      svg(o, c, id) {
        const lid = 'M10,72 L10,46 Q10,20 36,20 L164,20 Q190,20 190,46 L190,72 Z';
        return `
<defs>
  <linearGradient id="${id}-in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.mainD}"/><stop offset=".55" stop-color="${mix(o.gold, c.mainD, 0.75)}"/><stop offset="1" stop-color="${o.light}"/></linearGradient>
  <clipPath id="${id}-lc"><path d="${lid}"/></clipPath>
</defs>
<path d="M14,72 L14,48 Q14,26 38,26 L162,26 Q186,26 186,48 L186,72 Z" fill="url(#${id}-in)" stroke="${c.ink}" stroke-width="3"/>
<rect x="10" y="70" width="180" height="92" rx="6" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
<path d="M12,101 H188 M12,131 H188" stroke="${c.mainD}" stroke-width="2.5"/>
<path d="M40,104 l6,-3 M120,96 l8,2 M70,135 l-6,3 M150,128 l7,3 M30,150 l6,2" stroke="${c.mainD}" stroke-width="1.6" stroke-linecap="round"/>
<rect x="38" y="70" width="16" height="92" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.5"/>
<rect x="146" y="70" width="16" height="92" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.5"/>
<rect x="6" y="66" width="188" height="12" rx="4" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
<rect x="6" y="154" width="188" height="12" rx="4" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
<circle cx="46" cy="90" r="2.6" fill="${c.trimD}"/><circle cx="46" cy="144" r="2.6" fill="${c.trimD}"/><circle cx="154" cy="90" r="2.6" fill="${c.trimD}"/><circle cx="154" cy="144" r="2.6" fill="${c.trimD}"/>
<rect x="86" y="74" width="28" height="34" rx="6" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
<circle cx="100" cy="87" r="5" fill="${c.ink}"/><path d="M97.5,90 L102.5,90 L101.5,99 L98.5,99 Z" fill="${c.ink}"/>
<path d="M90,78 L96,78" stroke="${c.trimL}" stroke-width="2.4" stroke-linecap="round"/>
<g class="tc-lid">
  <g class="tc-lid-out">
    <path d="${lid}" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
    <g clip-path="url(#${id}-lc)">
      <path d="M10,44 H190" stroke="${c.mainD}" stroke-width="2.5"/>
      <rect x="38" y="10" width="16" height="70" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.5"/>
      <rect x="146" y="10" width="16" height="70" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.5"/>
      <path d="M24,34 Q60,24 96,26" stroke="${c.mainL}" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <path d="${lid}" fill="none" stroke="${c.ink}" stroke-width="3.5"/>
    <rect x="6" y="62" width="188" height="11" rx="4" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
    <path d="M92,62 L108,62 L106,78 Q100,84 94,78 Z" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.6"/>
  </g>
  <g class="tc-lid-in" style="display:none">
    <path d="${lid}" fill="${c.mainD}" stroke="${c.ink}" stroke-width="3.5"/>
    <path d="M22,66 L22,48 Q22,32 40,32 L160,32 Q178,32 178,48 L178,66 Z" fill="${mix(o.main, '#000000', 0.45)}"/>
    <path d="M22,66 L22,56 L178,56 L178,66 Z" fill="${mix(o.gold, c.mainD, 0.55)}"/>
    <rect x="6" y="62" width="188" height="11" rx="4" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
  </g>
</g>`;
      },
      refs(s) { return { lid: s.querySelector('.tc-lid'), out: s.querySelector('.tc-lid-out'), inn: s.querySelector('.tc-lid-in') }; },
      mouth() { return [100, 70]; },
      pose(r, u, rattle) {
        const k = u < 0 ? 1 - 0.12 * rattle : u < 0.42 ? 1 - 1.62 * ease.back(u / 0.42) : -0.62;
        r.lid.setAttribute('transform', `translate(0 20) scale(1 ${k}) translate(0 -20)`);
        r.out.style.display = k < 0 ? 'none' : ''; r.inn.style.display = k < 0 ? '' : 'none';
        return { squash: u < 0 ? 0 : u < 0.12 ? 0.04 - 0.1 * (u / 0.12) : u < 0.4 ? -0.06 + 0.06 * ease.out((u - 0.12) / 0.28) : 0 };
      }
    },

    /* ── 獎盃：杯子從底座往上一頂，杯口亮起，反光掃過 ── */
    trophy: {
      main: '#3B2A20', trim: '#E8B931', items: 'coin', count: 8, hint: '點擊領獎', burst: 0.3,
      svg(o, c, id) {
        const bowl = 'M38,28 H162 C162,82 132,104 100,106 C68,104 38,82 38,28 Z', arm = 'M46,38 C12,36 12,92 56,92 M154,38 C188,36 188,92 144,92';
        return `
<defs><clipPath id="${id}-bc"><path d="${bowl}"/></clipPath></defs>
<g class="tc-cup">
  <path d="${arm}" fill="none" stroke="${c.trimInk}" stroke-width="15" stroke-linecap="round"/>
  <path d="${arm}" fill="none" stroke="url(#${id}-t)" stroke-width="8" stroke-linecap="round"/>
  <path d="M88,104 L112,104 L107,128 L93,128 Z" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3"/>
  <rect x="82" y="124" width="36" height="12" rx="4" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3"/>
  <path d="${bowl}" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3.5"/>
  <g clip-path="url(#${id}-bc)"><rect class="tc-shine" x="-60" y="0" width="22" height="120" fill="${mix(o.trim, '#FFFFFF', 0.3)}" transform="skewX(-22)"/></g>
  <path d="M100,46 L105.3,57 L117,58.6 L108.4,66.6 L110.6,78.4 L100,72.6 L89.4,78.4 L91.6,66.6 L83,58.6 L94.7,57 Z" fill="${c.trimL}" stroke="${c.trimD}" stroke-width="2.4" stroke-linejoin="round"/>
  <ellipse cx="100" cy="28" rx="62" ry="9" fill="${c.trimL}" stroke="${c.trimInk}" stroke-width="3"/>
  <ellipse class="tc-mouth" cx="100" cy="29" rx="52" ry="5.5" fill="${c.trimD}"/>
  <path d="M52,40 Q54,66 70,84" stroke="${c.trimL}" stroke-width="4" fill="none" stroke-linecap="round"/>
</g>
<rect x="52" y="132" width="96" height="10" rx="3" fill="${c.mainL}" stroke="${c.ink}" stroke-width="3"/>
<rect x="58" y="140" width="84" height="26" rx="3" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
<rect x="78" y="146" width="44" height="13" rx="2" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.4"/>
<path d="M86,152.5 H114" stroke="${c.trimD}" stroke-width="2" stroke-linecap="round"/>`;
      },
      refs(s) { return { cup: s.querySelector('.tc-cup'), shine: s.querySelector('.tc-shine'), mouth: s.querySelector('.tc-mouth') }; },
      /* 杯子的垂直位移：待機略低，往上一頂，再落回底座 */
      ty(u) { return u < 0 ? 10 : u < 0.3 ? 10 - 26 * ease.out(u / 0.3) : u < 0.85 ? -16 + 16 * ease.inout((u - 0.3) / 0.55) : 0; },
      mouth(u) { return [100, 28 + this.ty(u)]; },
      pose(r, u, rattle, o, c) {
        const ty = this.ty(u), sc = u < 0 ? 1 : u < 0.3 ? 1 + 0.08 * u / 0.3 : u < 0.85 ? 1.08 - 0.08 * ease.inout((u - 0.3) / 0.55) : 1;
        const jy = u < 0 ? -3 * rattle : 0;
        r.cup.setAttribute('transform', `translate(100 ${106 + ty + jy}) scale(${sc}) translate(-100 -106)`);
        /* 反光：開啟時掃過一次，之後每 2.8 秒一次 */
        const g = u < 0.45 ? -1 : ((u - 0.45) % 2.8) / 0.9;
        r.shine.setAttribute('x', g < 0 || g > 1 ? -60 : -40 + 240 * ease.inout(g));
        r.mouth.setAttribute('fill', u >= this.burst ? o.light : c.trimD);
        return { squash: u < 0 ? 0 : u < 0.08 ? 0.05 * (1 - u / 0.08) : 0 };
      }
    },

    /* ── 禮物盒：盒蓋連同蝴蝶結彈飛，彩紙噴出 ── */
    gift: {
      main: '#EF6661', trim: '#E3D322', items: 'confetti', count: 40, hint: '點擊拆開', burst: 0.14,
      svg(o, c, id) {
        return `
<rect class="tc-inside" x="36" y="80" width="128" height="10" fill="${c.mainD}"/>
<rect x="32" y="84" width="136" height="82" rx="6" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
<rect x="90" y="84" width="20" height="82" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.6"/>
<path d="M42,96 V156" stroke="${c.mainL}" stroke-width="4" stroke-linecap="round"/>
<path d="M60,120 l6,-6 M136,140 l6,-6 M128,104 l5,-5 M56,148 l5,-5" stroke="${c.mainD}" stroke-width="2.4" stroke-linecap="round"/>
<g class="tc-glid">
  <path d="M86,62 C58,22 36,40 52,58 C60,68 78,66 86,62 Z" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
  <path d="M114,62 C142,22 164,40 148,58 C140,68 122,66 114,62 Z" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
  <path d="M70,48 C64,50 62,54 64,57 M130,48 C136,50 138,54 136,57" stroke="${c.trimD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <rect x="24" y="62" width="152" height="26" rx="6" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
  <path d="M30,70 H82" stroke="${c.mainL}" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="88" y="62" width="24" height="26" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="2.6"/>
  <rect x="89" y="50" width="22" height="16" rx="5" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
</g>`;
      },
      refs(s) { return { lid: s.querySelector('.tc-glid'), inside: s.querySelector('.tc-inside') }; },
      mouth() { return [100, 82]; },
      pose(r, u, rattle, o, c) {
        if (u < 0) r.lid.setAttribute('transform', `translate(0 ${-4 * rattle})`);
        else { const x = -170 * u, y = -230 * u + 270 * u * u, a = -80 * u; r.lid.setAttribute('transform', `translate(${x} ${y}) rotate(${a} 100 70)`); }
        r.lid.style.display = u > 1.6 ? 'none' : '';
        r.inside.setAttribute('fill', u >= this.burst ? o.light : c.mainD);
        return { squash: u < 0 ? 0 : u < 0.1 ? 0.05 : u < 0.35 ? -0.04 + 0.04 * ease.out((u - 0.1) / 0.25) : 0 };
      }
    },

    /* ── 轉蛋機：旋鈕轉兩圈，扭蛋滾出、飛到正前方放大，然後裂開 ── */
    gacha: {
      main: '#EF6661', trim: '#C6C7BD', items: 'coin', count: 0, hint: '點擊轉一次', burst: 1.5,
      svg(o, c, id) {
        const glass = mix('#5DBAE8', '#FFFFFF', 0.3), caps = [[72, 64], [100, 72], [128, 64], [56, 44], [86, 48], [114, 46], [144, 44], [76, 26], [104, 24], [128, 28]];
        const capsule = (cx, cy, col, cls) => `<g class="${cls || ''}" transform="translate(${cx} ${cy})"><g class="tc-ct"><path d="M-12,0 A12,12 0 0 1 12,0 Z" fill="${col}" stroke="${c.ink}" stroke-width="2.4"/></g><g class="tc-cb"><path d="M-12,0 A12,12 0 0 0 12,0 Z" fill="#F4F3EC" stroke="${c.ink}" stroke-width="2.4"/></g><path d="M-12,0 H12" stroke="${c.ink}" stroke-width="2"/><path d="M-6,-6 Q-2,-9 3,-8" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
        return `
<defs><clipPath id="${id}-dc"><circle cx="100" cy="36" r="52"/></clipPath></defs>
<rect x="92" y="-26" width="16" height="12" rx="3" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
<circle cx="100" cy="36" r="52" fill="${glass}" stroke="${c.ink}" stroke-width="3.5"/>
<g clip-path="url(#${id}-dc)">${caps.map((p, i) => `<g class="tc-jig">${capsule(p[0], p[1], CONFETTI[i % CONFETTI.length])}</g>`).join('')}</g>
<path d="M66,10 Q78,-6 100,-8" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="100" cy="36" r="52" fill="none" stroke="${c.ink}" stroke-width="3.5"/>
<rect x="40" y="80" width="120" height="14" rx="6" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
<rect x="46" y="92" width="108" height="74" rx="10" fill="url(#${id}-m)" stroke="${c.ink}" stroke-width="3.5"/>
<path d="M54,102 V156" stroke="${c.mainL}" stroke-width="4" stroke-linecap="round"/>
<rect x="64" y="104" width="10" height="22" rx="3" fill="${c.ink}"/>
<rect x="118" y="138" width="30" height="22" rx="5" fill="${mix(o.main, '#000000', 0.32)}" stroke="${c.ink}" stroke-width="3"/>
<g class="tc-knob">
  <circle cx="100" cy="124" r="17" fill="url(#${id}-t)" stroke="${c.ink}" stroke-width="3"/>
  <rect x="96" y="104" width="8" height="40" rx="4" fill="${c.trimL}" stroke="${c.ink}" stroke-width="2.6"/>
  <circle cx="100" cy="124" r="4" fill="${c.ink}"/>
</g>
${capsule(133, 149, o.capsule, 'tc-cap')}`;
      },
      refs(s) {
        const cap = s.querySelector('.tc-cap');
        return { knob: s.querySelector('.tc-knob'), jig: [...s.querySelectorAll('.tc-jig')], cap, ct: cap.querySelector('.tc-ct'), cb: cap.querySelector('.tc-cb'), seam: [...cap.querySelectorAll(':scope > path')] };
      },
      /* 扭蛋位置：0.8 秒從出口探出，0.9 秒起沿曲線飛到正前方，放大並轉兩圈 */
      capPos(u) {
        if (u < 0.8) return [133, 149, 1, 0, u >= 0.6];
        if (u < 0.9) return [133, 149 - 4 * Math.sin((u - 0.8) / 0.1 * Math.PI), 1, 0, true];
        const e = ease.inout(clamp((u - 0.9) / 0.55, 0, 1)), q = 1 - e;
        const x = q * q * 133 + 2 * q * e * 160 + e * e * 100, y = q * q * 149 + 2 * q * e * 56 + e * e * 108;
        const bob = u > 1.45 ? Math.sin((u - 1.45) * 5) * 2 : 0;
        return [x, y + bob, 1 + 0.75 * e, 720 * e, true];
      },
      mouth(u) { const p = this.capPos(u); return [p[0], p[1]]; },
      pose(r, u, rattle) {
        const turn = u < 0 ? 0 : 720 * ease.inout(clamp(u / 0.9, 0, 1));
        r.knob.setAttribute('transform', `rotate(${turn} 100 124)`);
        const amp = u < 0 ? 3 * rattle : u < 0.9 ? 2.5 : u < 1.2 ? 2.5 * (1 - (u - 0.9) / 0.3) : 0;
        r.jig.forEach((g, i) => g.setAttribute('transform', amp ? `translate(${(Math.sin(u * 37 + i * 1.7) * amp).toFixed(2)} ${(Math.cos(u * 31 + i * 2.3) * amp).toFixed(2)})` : ''));
        const [x, y, s, a, show] = this.capPos(u);
        r.cap.style.display = show ? '' : 'none';
        r.cap.setAttribute('transform', `translate(${x} ${y}) rotate(${a}) scale(${s})`);
        const v = u - this.burst;
        if (v >= 0) {
          /* 裂開：上半往上掀開，下半微微下沉，停在打開的樣子，光從中間透出 */
          const e = ease.back(clamp(v / 0.35, 0, 1));
          r.ct.setAttribute('transform', `translate(${-7 * e} ${-15 * e}) rotate(${-38 * e} -12 0)`);
          r.cb.setAttribute('transform', `translate(${3 * e} ${5 * e}) rotate(${10 * e} 12 0)`);
          r.seam.forEach(p => { p.style.display = 'none'; });
        } else { r.ct.removeAttribute('transform'); r.cb.removeAttribute('transform'); r.seam.forEach(p => { p.style.display = ''; }); }
        return { squash: u >= 0 && u < 0.9 ? 0.015 * Math.abs(Math.sin(u * 14)) : 0 };
      }
    },

    /* ── 魔法書：封面翻開，書頁嘩啦翻過去，文字從書頁中央飄起 ── */
    book: bookType(BOOK),

    /* ── 農民曆：紅皮農民曆翻開，停在今天那頁，「宜」字章蓋下來 ── */
    almanac: bookType(ALMANAC),

    /* ── 對發票機：號碼滾動，發票一格一格吐出來，「中獎」章蓋下 ── */
    receipt: {
      main: '#71CD76', trim: '#C6C7BD', items: 'slip', count: 26, hint: '點擊對獎', burst: 1.25, stamp: '中獎', cover: '',
      svg(o, c, id) {
        const paper = '#F4F3EC', ink = c.ink, red = PALETTE.red, stamp = String(o.stamp || '中獎'), n = [...stamp].length;
        const sw = Math.min(66, 14 + 22 * n), sfs = Math.min(24, (sw - 10) / n);
        const zig = Array.from({ length: 13 }, (_, i) => `L${64 + i * 6},${i % 2 ? -54 : -59}`).join(' ');
        const qr = x => `<rect x="${x}" y="2" width="22" height="22" fill="${ink}"/><rect x="${x + 3}" y="5" width="16" height="16" fill="${paper}"/><rect x="${x + 6}" y="8" width="10" height="10" fill="${ink}"/><rect x="${x + 9}" y="11" width="4" height="4" fill="${paper}"/>`;
        const digits = Array.from({ length: 8 }, (_, i) => `<text class="tc-dg" x="${(50 + i * 14.1).toFixed(1)}" y="100" text-anchor="middle" dominant-baseline="central" font-size="19" font-weight="800" fill="${o.gold}" font-family="ui-monospace,'Courier New',monospace">0</text>`).join('');
        return `
<defs><clipPath id="${id}-sc"><rect x="20" y="-60" width="160" height="120"/></clipPath></defs>
<g clip-path="url(#${id}-sc)">
  <g class="tc-slip">
    <path d="M64,100 V-54 ${zig} V100 Z" fill="${paper}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="65" y="-46" width="70" height="16" fill="${o.main}"/>
    <text x="100" y="-38" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="800" fill="${c.mainD}" font-family="${SANS}">統一發票</text>
    <path d="M72,-22 H128 M72,-15 H116 M72,-8 H124" stroke="#C6C7BD" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M68,-2 H132" stroke="#86877F" stroke-width="1.6" stroke-dasharray="4 3"/>
    ${qr(72)}${qr(106)}
    <g class="tc-rstamp" style="display:none">
      <rect x="${-sw / 2}" y="-15" width="${sw}" height="30" rx="4" fill="${paper}" stroke="${red}" stroke-width="3.4"/>
      <text x="0" y="1" text-anchor="middle" dominant-baseline="central" font-size="${sfs}" font-weight="900" fill="${red}" font-family="${SERIF}">${esc(stamp)}</text>
    </g>
  </g>
</g>
<rect x="28" y="62" width="144" height="104" rx="10" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3.5"/>
<path d="M37,80 V156" stroke="${c.mainL}" stroke-width="4" stroke-linecap="round"/>
<rect x="22" y="58" width="156" height="16" rx="6" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3"/>
<ellipse cx="100" cy="59" rx="44" ry="3.4" fill="${ink}"/>
<rect x="42" y="84" width="116" height="30" rx="5" fill="${ink}" stroke="${c.trimInk}" stroke-width="2.4"/>
${digits}
<circle cx="58" cy="136" r="8" fill="${PALETTE.red}" stroke="${ink}" stroke-width="2.6"/>
<circle cx="82" cy="136" r="8" fill="${PALETTE.yellow}" stroke="${ink}" stroke-width="2.6"/>
<circle cx="106" cy="136" r="8" fill="${PALETTE.blue}" stroke="${ink}" stroke-width="2.6"/>
<rect x="124" y="126" width="36" height="26" rx="5" fill="${mix(o.main, '#000000', 0.32)}" stroke="${ink}" stroke-width="3"/>`;
      },
      refs(s) { return { slip: s.querySelector('.tc-slip'), stamp: s.querySelector('.tc-rstamp'), digits: [...s.querySelectorAll('.tc-dg')] }; },
      mouth() { return [100, 8]; },
      pose(r, u, rattle, o) {
        /* 號碼：開始後滾動，由左到右一個一個停在設定的數字 */
        const dg = String(o.digits).replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
        r.digits.forEach((t, i) => {
          const show = u < 0 || u >= 0.12 + 0.08 * i ? dg[i] : String(((Math.floor(u * 22) + i * 3) * 7 + i) % 10);
          if (t.textContent !== show) t.textContent = show;
          t.setAttribute('fill', u >= this.burst ? o.light : o.gold);
        });
        /* 發票：像印表機一樣一格一格吐出來，邊吐邊微微震動 */
        const p = clamp((u - 0.2) / 0.8, 0, 1), x = p * 12, fl = Math.floor(x), step = (fl + ease.out(x - fl)) / 12;
        const off = u < 0.2 ? 120 : 120 * (1 - Math.min(1, step)), jx = u > 0.2 && p < 1 ? Math.sin(u * 90) * 0.7 : 0;
        r.slip.setAttribute('transform', `translate(${jx.toFixed(2)} ${off.toFixed(2)})`);
        /* 印章：蓋下去的瞬間就是光芒噴出的時刻 */
        const w = u - (this.burst - 0.2);
        if (w < 0) r.stamp.style.display = 'none';
        else { r.stamp.style.display = ''; r.stamp.setAttribute('transform', `translate(100 41) rotate(-12) scale(${(1 + 1.5 * (1 - ease.out(clamp(w / 0.2, 0, 1)))).toFixed(3)})`); }
        const v2 = u - this.burst;
        return { squash: u < 0 ? 0 : v2 > -0.02 && v2 < 0.1 ? 0.045 * (1 - (v2 + 0.02) / 0.12) : u > 0.2 && p < 1 ? 0.01 * Math.abs(Math.sin(u * 40)) : 0 };
      }
    },

    /* ── 土地公：福德祠的廟門打開，土地公笑咪咪探出來，元寶噴出 ── */
    tudigong: {
      main: '#EF6661', trim: '#E3D322', items: 'ingot', count: 12, hint: '點擊拜拜', burst: 0.7, cover: '',
      svg(o, c, id) {
        const ink = c.ink, skin = '#FFC88A', white = '#F4F3EC', hat = '#3B2A20', brown = '#8A5530', mouthC = '#7A2F2A';
        const leaf = (x, ring) => `
    <rect x="${x}" y="44" width="60" height="112" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3"/>
    <rect x="${x + 5}" y="49" width="50" height="102" fill="none" stroke="url(#${id}-t)" stroke-width="2.4"/>
    ${[0, 1, 2].map(i => [0, 1, 2, 3].map(j => `<circle cx="${x + 15 + i * 15}" cy="${64 + j * 22}" r="2.8" fill="${o.trim}" stroke="${c.trimInk}" stroke-width="1"/>`).join('')).join('')}
    <circle cx="${ring}" cy="104" r="5.5" fill="none" stroke="${c.trimInk}" stroke-width="3"/>`;
        return `
<defs>
  <radialGradient id="${id}-g" cx="0.5" cy="0.55" r="0.65"><stop offset="0" stop-color="${o.light}"/><stop offset="1" stop-color="${mix(o.gold, '#000000', 0.6)}"/></radialGradient>
  <clipPath id="${id}-ac"><rect x="40" y="44" width="120" height="112"/></clipPath>
</defs>
<rect class="tc-glow" x="40" y="44" width="120" height="112" fill="${c.mainD}"/>
<g clip-path="url(#${id}-ac)">
  <g class="tc-god">
    <g class="tc-stick">
      <path d="M60,166 V98 Q60,86 70,89 Q77,92 74,99" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round"/>
      <path d="M60,166 V98 Q60,86 70,89 Q77,92 74,99" fill="none" stroke="${brown}" stroke-width="6" stroke-linecap="round"/>
    </g>
    <path d="M62,164 Q62,118 100,108 Q138,118 138,164 Z" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
    <path d="M84,120 L100,152 M116,120 L100,152" stroke="${c.trimD}" stroke-width="2.4" fill="none"/>
    <rect x="68" y="146" width="64" height="9" fill="${o.main}" stroke="${ink}" stroke-width="2.4"/>
    <path d="${ingotPath(141, 112, 10)}" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="63" cy="140" rx="10" ry="17" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
    <ellipse cx="137" cy="140" rx="10" ry="17" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
    <circle cx="62" cy="126" r="6.2" fill="${skin}" stroke="${ink}" stroke-width="2.4"/>
    <circle cx="138" cy="125" r="6.2" fill="${skin}" stroke="${ink}" stroke-width="2.4"/>
    <circle cx="80" cy="94" r="5" fill="${skin}" stroke="${ink}" stroke-width="2.4"/>
    <circle cx="120" cy="94" r="5" fill="${skin}" stroke="${ink}" stroke-width="2.4"/>
    <circle cx="100" cy="92" r="20" fill="${skin}" stroke="${ink}" stroke-width="3"/>
    <circle cx="86" cy="99" r="4.5" fill="${PALETTE.pink}"/><circle cx="114" cy="99" r="4.5" fill="${PALETTE.pink}"/>
    <path d="M86,90 Q91,84 96,90 M104,90 Q109,84 114,90" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M83,81 Q90,75 98,80 M102,80 Q110,75 117,81" fill="none" stroke="${ink}" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M83,81 Q90,75 98,80 M102,80 Q110,75 117,81" fill="none" stroke="${white}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="100" cy="96" r="3.6" fill="${PALETTE.playful}"/>
    <g class="tc-beard">
      <path d="M80,102 Q76,130 100,144 Q124,130 120,102 Q112,113 100,111 Q88,113 80,102 Z" fill="${white}" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/>
      <ellipse cx="100" cy="111" rx="5.5" ry="3.2" fill="${mouthC}"/>
      <path d="M84,102 Q92,96 100,102 Q108,96 116,102 Q108,109 100,105 Q92,109 84,102 Z" fill="${white}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
    </g>
    <ellipse cx="73" cy="72" rx="11" ry="5" transform="rotate(-12 73 72)" fill="${hat}" stroke="${ink}" stroke-width="2.4"/>
    <ellipse cx="127" cy="72" rx="11" ry="5" transform="rotate(12 127 72)" fill="${hat}" stroke="${ink}" stroke-width="2.4"/>
    <path d="M80,80 Q80,58 100,56 Q120,58 120,80 Z" fill="${hat}" stroke="${ink}" stroke-width="3"/>
    <rect x="79" y="74" width="42" height="7" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2"/>
    <text x="100" y="66" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="${c.trimL}" font-family="${SERIF}">福</text>
    <circle cx="100" cy="55" r="4.5" fill="${o.main}" stroke="${ink}" stroke-width="2"/>
  </g>
</g>
<g class="tc-dl">${leaf(40, 92)}</g>
<g class="tc-dr">${leaf(100, 108)}</g>
<rect x="26" y="40" width="14" height="124" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3"/>
<rect x="160" y="40" width="14" height="124" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3"/>
<rect x="26" y="62" width="14" height="6" fill="url(#${id}-t)"/><rect x="160" y="62" width="14" height="6" fill="url(#${id}-t)"/>
<rect x="26" y="132" width="14" height="6" fill="url(#${id}-t)"/><rect x="160" y="132" width="14" height="6" fill="url(#${id}-t)"/>
<rect x="24" y="34" width="152" height="10" rx="3" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3"/>
<path d="M10,30 L40,4 H160 L190,30 Z" fill="${c.mainD}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M54,6 L38,30 M78,4 L68,30 M100,4 V30 M122,4 L132,30 M146,6 L162,30" stroke="${ink}" stroke-width="1.8" fill="none"/>
<rect x="6" y="27" width="188" height="7" rx="3" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="3"/>
<path d="M36,6 Q100,-12 164,6" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
<path d="M36,6 Q100,-12 164,6" fill="none" stroke="url(#${id}-t)" stroke-width="5" stroke-linecap="round"/>
<path d="M38,8 Q18,6 16,-14 Q26,-2 48,2 Z" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M162,8 Q182,6 184,-14 Q174,-2 152,2 Z" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.4" stroke-linejoin="round"/>
<circle cx="100" cy="-9" r="5" fill="${o.main}" stroke="${ink}" stroke-width="2.4"/>
<rect x="72" y="10" width="56" height="15" rx="2" fill="${ink}" stroke="url(#${id}-t)" stroke-width="2"/>
<text x="100" y="18" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="800" fill="${c.trimL}" font-family="${SERIF}">福德祠</text>
<rect x="12" y="156" width="176" height="10" rx="3" fill="#86877F" stroke="${ink}" stroke-width="3"/>`;
      },
      refs(s) {
        const g = q => s.querySelector(q);
        return { dl: g('.tc-dl'), dr: g('.tc-dr'), god: g('.tc-god'), beard: g('.tc-beard'), stick: g('.tc-stick'), glow: g('.tc-glow'), gid: s.querySelector('radialGradient').id };
      },
      mouth() { return [100, 58]; },
      pose(r, u, rattle, o, c) {
        /* 廟門：0.4 秒打開，立在兩側變成窄窄一條 */
        const e = u < 0 ? 0 : ease.inout(clamp(u / 0.4, 0, 1)), k = u < 0 ? 1 - 0.06 * rattle : 1 - 0.82 * e;
        r.dl.setAttribute('transform', `translate(40 0) scale(${k.toFixed(3)} 1) translate(-40 0)`);
        r.dr.setAttribute('transform', `translate(160 0) scale(${k.toFixed(3)} 1) translate(-160 0)`);
        /* 土地公：門開後從 0.78 倍彈到滿，之後輕輕點頭、鬍子搖、拐杖點地 */
        const gp = u < 0.2 ? 0 : clamp((u - 0.2) / 0.5, 0, 1), gs = 0.78 + 0.22 * ease.back(gp);
        const t2 = Math.max(0, u - 0.7), bob = u > 0.7 ? Math.sin(t2 * 8) * 1.6 * Math.min(1, t2 * 3) : 0;
        r.god.setAttribute('transform', `translate(100 ${(156 + bob).toFixed(2)}) scale(${gs.toFixed(3)}) translate(-100 -160)`);
        r.beard.setAttribute('transform', `rotate(${(u > 0.7 ? Math.sin(t2 * 7) * 3 * Math.min(1, t2 * 3) : 0).toFixed(2)} 100 102)`);
        r.stick.setAttribute('transform', `rotate(${(u > 0.7 ? -8 * Math.abs(Math.sin(t2 * 6)) : 0).toFixed(2)} 60 164)`);
        r.glow.setAttribute('fill', u >= this.burst ? `url(#${r.gid})` : c.mainD);
        return { squash: u >= 0.62 && u < 0.72 ? 0.03 : 0 };
      }
    },

    /* ── 新聞快報：老電視頂上的警示燈轉起來，螢幕像映像管一樣展開，彩條之後切到新聞畫面，NEWS 條從左邊滑入 ── */
    news: {
      main: '#778CE1', trim: '#C6C7BD', items: 'news', count: 22, hint: '點擊收看', burst: 0.9, cover: '',
      svg(o, c, id) {
        const ink = c.ink, red = PALETTE.urgent, navy = mix(PALETTE.indigo, '#000000', 0.28), sea = mix(PALETTE.indigo, '#000000', 0.5), txt = String(o.cover || '').trim();
        const bars = ['shell', 'yellow', 'key', 'green', 'pink', 'red', 'blue'].map(n => PALETTE[n]);
        const scan = Array.from({ length: 14 }, (_, i) => `M30,${64 + i * 6} H134`).join(' ');
        const barRects = bars.map((col, i) => `<rect x="${(30 + i * 104 / 7).toFixed(2)}" y="60" width="${(104 / 7 + 0.4).toFixed(2)}" height="56" fill="${col}"/>`).join('');
        const lat = [-10, 0, 10].map(d => { const w = Math.sqrt(400 - d * d); return `M${(82 - w).toFixed(1)},${82 + d} H${(82 + w).toFixed(1)}`; }).join(' ');
        const scroll = estW(txt, 11) > 96;
        const tick = txt
          ? `<g clip-path="url(#${id}-tc)"><text class="tc-t1" x="${scroll ? 134 : 82}" y="133" text-anchor="${scroll ? 'start' : 'middle'}" dominant-baseline="central" font-size="11" font-weight="700" fill="${PALETTE.vanilla}" font-family="${SANS}">${esc(txt)}</text><text class="tc-t2" x="134" y="133" dominant-baseline="central" font-size="11" font-weight="700" fill="${PALETTE.vanilla}" font-family="${SANS}" style="display:${scroll ? '' : 'none'}">${esc(txt)}</text></g>`
          : `<path d="M38,133 h22 M66,133 h14 M86,133 h30" stroke="${PALETTE.gray}" stroke-width="3.4" stroke-linecap="round"/>`;
        return `
<defs><clipPath id="${id}-sc"><rect x="30" y="60" width="104" height="82" rx="7"/></clipPath><clipPath id="${id}-tc"><rect x="30" y="124" width="104" height="18"/></clipPath></defs>
<g class="tc-bm" style="display:none"><path d="M100,35 L146,21 L146,49 Z" fill="${red}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/></g>
<path d="M78,46 L48,8 M122,46 L152,8" stroke="${ink}" stroke-width="7.5" stroke-linecap="round"/>
<path d="M78,46 L48,8 M122,46 L152,8" stroke="url(#${id}-t)" stroke-width="4" stroke-linecap="round"/>
<circle cx="48" cy="8" r="4.6" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.4"/><circle cx="152" cy="8" r="4.6" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.4"/>
<rect x="24" y="154" width="22" height="12" rx="3" fill="${c.mainD}" stroke="${ink}" stroke-width="3"/><rect x="154" y="154" width="22" height="12" rx="3" fill="${c.mainD}" stroke="${ink}" stroke-width="3"/>
<rect x="14" y="44" width="172" height="114" rx="16" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3.5"/>
<path d="M20,64 V134" stroke="${c.mainL}" stroke-width="4" stroke-linecap="round"/>
<rect x="26" y="56" width="112" height="90" rx="10" fill="${ink}" stroke="url(#${id}-t)" stroke-width="3"/>
<g clip-path="url(#${id}-sc)">
  <g class="tc-s0"><rect x="30" y="60" width="104" height="82" fill="${ink}"/><path d="${scan}" stroke="${mix(ink, '#FFFFFF', 0.88)}" stroke-width="1"/></g>
  <g class="tc-s1" style="display:none"><rect class="tc-wh" x="30" y="60" width="104" height="82" fill="#F4F3EC"/></g>
  <g class="tc-s2" style="display:none">${barRects}<rect x="30" y="116" width="104" height="26" fill="${ink}"/><path d="M38,129 H66 M74,129 H96 M104,129 H126" stroke="${PALETTE.shell}" stroke-width="5" stroke-linecap="round"/><rect class="tc-gl" x="30" y="60" width="104" height="5" fill="#F4F3EC"/></g>
  <g class="tc-s3" style="display:none">
    <rect x="30" y="60" width="104" height="82" fill="${navy}"/>
    <circle cx="82" cy="82" r="20" fill="${sea}" stroke="${PALETTE.key}" stroke-width="2"/>
    <path d="${lat}" stroke="${PALETTE.key}" stroke-width="1.4" fill="none"/>
    ${[0, 1, 2].map(() => `<ellipse class="tc-mr" cx="82" cy="82" rx="10" ry="20" fill="none" stroke="${PALETTE.key}" stroke-width="1.4"/>`).join('')}
    <circle class="tc-dot" cx="122" cy="68" r="3.6" fill="${red}"/>
    <g class="tc-bn"><path d="M30,102 H112 L122,112 L112,122 H30 Z" fill="${red}"/><text x="38" y="112.5" dominant-baseline="central" font-size="13" font-weight="900" letter-spacing="1.5" fill="#F4F3EC" font-family="${SANS}">NEWS</text></g>
    <g class="tc-tk"><rect x="30" y="122" width="104" height="20" fill="${ink}"/><rect x="30" y="122" width="104" height="2" fill="${PALETTE.yellow}"/>${tick}</g>
    <rect class="tc-fl" x="30" y="60" width="104" height="82" fill="#F4F3EC" style="display:none"/>
  </g>
</g>
<path d="M36,66 Q44,62 62,62" stroke="${c.trimL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<circle cx="161" cy="76" r="9" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.6"/><path d="M161,76 L166,70" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="161" cy="102" r="9" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.6"/><path d="M161,102 L156,97" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M150,122 H174 M150,129 H174 M150,136 H174 M150,143 H174" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
<rect x="82" y="40" width="36" height="8" rx="3" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.6"/>
<path class="tc-bulb" d="M88,41 A12,12 0 0 1 112,41 Z" fill="${c.mainD}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M92,37 Q95,32 100,31" stroke="${c.trimL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      },
      refs(s) {
        const g = q => s.querySelector(q);
        return { bm: g('.tc-bm'), bulb: g('.tc-bulb'), s: [g('.tc-s0'), g('.tc-s1'), g('.tc-s2'), g('.tc-s3')], wh: g('.tc-wh'), gl: g('.tc-gl'), mr: [...s.querySelectorAll('.tc-mr')], dot: g('.tc-dot'), bn: g('.tc-bn'), tk: g('.tc-tk'), fl: g('.tc-fl'), t1: g('.tc-t1'), t2: g('.tc-t2') };
      },
      mouth() { return [100, 78]; },
      pose(r, u, rattle, o, c) {
        const on = u >= 0;
        /* 警示燈：開啟後亮起，光束像燈塔一樣轉動（光束寬度隨 cos 變化，過 0 就換邊） */
        r.bulb.setAttribute('fill', on ? PALETTE.urgent : c.mainD);
        r.bm.style.display = on ? '' : 'none';
        if (on) r.bm.setAttribute('transform', `translate(100 35) scale(${Math.cos(u * 8).toFixed(3)} 1) translate(-100 -35)`);
        /* 螢幕：待機黑屏 → 映像管展開（白線拉開）→ 彩條 → 新聞畫面 */
        const ph = u < 0 ? 0 : u < 0.22 ? 1 : u < 0.6 ? 2 : 3;
        r.s.forEach((g, i) => { g.style.display = i === ph ? '' : 'none'; });
        if (ph === 1) {
          const a = clamp(u / 0.08, 0, 1), b = clamp((u - 0.08) / 0.14, 0, 1);
          r.wh.setAttribute('transform', `translate(82 101) scale(${(0.12 + 0.88 * ease.out(a)).toFixed(3)} ${(0.03 + 0.97 * ease.out(b)).toFixed(3)}) translate(-82 -101)`);
        } else if (ph === 2) {
          r.s[2].setAttribute('transform', `translate(${(Math.sin(u * 90) * (u < 0.3 ? 2.5 : 0.8)).toFixed(2)} 0)`);
          r.gl.setAttribute('y', (60 + (u * 170) % 82).toFixed(1));
        } else if (ph === 3) {
          const t = u - 0.6, bp = clamp(t / 0.3, 0, 1), tp = clamp((t - 0.15) / 0.25, 0, 1);
          r.bn.setAttribute('transform', `translate(${(-100 * (1 - ease.back(bp))).toFixed(2)} 0)`);
          r.tk.setAttribute('transform', `translate(0 ${(20 * (1 - ease.out(tp))).toFixed(2)})`);
          r.mr.forEach((e, i) => e.setAttribute('rx', Math.max(0.6, Math.abs(Math.cos(t * 1.3 + i * Math.PI / 3)) * 20).toFixed(2)));
          r.dot.style.display = Math.floor(u * 2) % 2 ? 'none' : '';
          const v = u - this.burst; r.fl.style.display = v >= 0 && v < 0.07 ? '' : 'none';
          /* 跑馬燈：文字比字幕條長才捲動，兩份首尾相接 */
          const txt = String(o.cover || '').trim(), tw = estW(txt, 11);
          if (txt && tw > 96) { const off = (t * 30) % (tw + 30); r.t1.setAttribute('x', (134 - off).toFixed(1)); r.t2.setAttribute('x', (134 - off + tw + 30).toFixed(1)); }
        }
        const v2 = u - this.burst;
        return { squash: u < 0 ? 0 : v2 > -0.02 && v2 < 0.1 ? 0.04 * (1 - (v2 + 0.02) / 0.12) : 0 };
      }
    },

    /* ── 拉布幕：兩側紅布幔往外拉開，匾額彈出，元寶噴出。匾額文字用 cover-text 設定，沒寫就是一個元寶 ── */
    curtain: {
      main: '#EF6661', trim: '#E3D322', items: 'ingot', count: 16, hint: '點擊拉開', burst: 0.62, cover: '',
      svg(o, c, id) {
        const ink = c.ink, txt = String(o.cover || '').trim(), ch = [...txt], n = ch.length;
        const total = estW(txt, 1), words = txt.split(/\s+/);
        let lines = [txt];
        if (total > 7) {
          /* 太長就拆成兩行：有空白的英文在最接近中間的空白拆，其他在字數一半拆 */
          if (words.length > 1) { let best = 1, bd = 1e9; for (let i = 1; i < words.length; i++) { const d = Math.abs(estW(words.slice(0, i).join(' '), 1) - total / 2); if (d < bd) { bd = d; best = i; } } lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]; }
          else { const half = Math.ceil(n / 2); lines = [ch.slice(0, half).join(''), ch.slice(half).join('')]; }
        }
        const two = lines.length > 1, fs = n ? Math.min(two ? 17 : 30, 92 / Math.max(...lines.map(l => estW(l, 1)))) : 0, ys = two ? [79, 96] : [87];
        const drape = x => `<rect x="${x}" y="40" width="66" height="116" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3"/>${[1, 2, 3, 4, 5].map(i => `<path d="M${x + i * 11},42 Q${x + i * 11 + (i % 2 ? 4 : -4)},100 ${x + i * 11},152" fill="none" stroke="${c.mainD}" stroke-width="2.2"/>`).join('')}<rect x="${x}" y="146" width="66" height="10" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.4"/>`;
        let arcs = 'M178,48'; for (let i = 0; i < 6; i++) arcs += ` Q${178 - 26 * i - 13},66 ${178 - 26 * (i + 1)},48`;
        const tassel = [1, 2, 3, 4, 5].map(i => { const x = 178 - 26 * i; return `<path d="M${x},50 V60" stroke="${o.trim}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x}" cy="48" r="3.2" fill="url(#${id}-t)" stroke="${ink}" stroke-width="1.8"/>`; }).join('');
        const text = n ? lines.map((l, i) => `<text x="100" y="${ys[i]}" text-anchor="middle" dominant-baseline="central" font-size="${fs.toFixed(1)}" font-weight="900" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="0.8" font-family="${SERIF}">${esc(l)}</text>`).join('') : `<path d="${ingotPath(100, 87, 15)}" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.4" stroke-linejoin="round"/>`;
        const pile = [[80, 146], [120, 146], [100, 128]].map(p => `<path d="${ingotPath(p[0], p[1], 11)}" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.2" stroke-linejoin="round"/>`).join('');
        return `
<defs>
  <radialGradient id="${id}-g" cx="0.5" cy="0.55" r="0.65"><stop offset="0" stop-color="${o.light}"/><stop offset="1" stop-color="${mix(o.gold, '#000000', 0.6)}"/></radialGradient>
  <clipPath id="${id}-pc"><rect x="46" y="64" width="108" height="44" rx="4"/></clipPath>
</defs>
<rect class="tc-glow" x="34" y="40" width="132" height="116" fill="${c.mainD}"/>
<path d="M70,50 V64 M130,50 V64" stroke="${o.trim}" stroke-width="2.4"/>
<g class="tc-pile">${pile}</g>
<g class="tc-pl">
  <rect x="46" y="64" width="108" height="44" rx="4" fill="url(#${id}-m)" stroke="url(#${id}-t)" stroke-width="4"/>
  <rect x="52" y="70" width="96" height="32" rx="2" fill="none" stroke="${c.trimL}" stroke-width="1.4"/>
  ${text}
  <g clip-path="url(#${id}-pc)"><rect class="tc-sn" x="-80" y="60" width="14" height="52" fill="${mix(o.trim, '#FFFFFF', 0.35)}" transform="skewX(-22)"/></g>
</g>
<g class="tc-dl">${drape(34)}</g>
<g class="tc-dr">${drape(100)}</g>
<rect x="22" y="32" width="12" height="124" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
<rect x="166" y="32" width="12" height="124" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
<path d="M22,30 H178 V48 ${arcs.slice(8)} Z" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
<path d="${arcs}" fill="none" stroke="url(#${id}-t)" stroke-width="2.4"/>
${tassel}
<rect x="16" y="24" width="168" height="8" rx="4" fill="url(#${id}-t)" stroke="${ink}" stroke-width="3"/>
<circle cx="16" cy="28" r="7" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.6"/><circle cx="184" cy="28" r="7" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.6"/>
<path d="${ingotPath(100, 14, 9)}" fill="url(#${id}-t)" stroke="${c.trimInk}" stroke-width="2.2" stroke-linejoin="round"/>
<rect x="12" y="156" width="176" height="10" rx="3" fill="#86877F" stroke="${ink}" stroke-width="3"/>`;
      },
      refs(s) {
        const g = q => s.querySelector(q);
        return { dl: g('.tc-dl'), dr: g('.tc-dr'), pl: g('.tc-pl'), pile: g('.tc-pile'), sn: g('.tc-sn'), glow: g('.tc-glow'), gid: s.querySelector('radialGradient').id };
      },
      mouth() { return [100, 66]; },
      pose(r, u, rattle, o, c) {
        /* 布幔：搖晃時微微抖動；開啟後 0.62 秒往兩側拉開，聚成窄窄一條 */
        const e = u < 0 ? 0 : ease.inout(clamp((u - 0.04) / 0.62, 0, 1)), k = u < 0 ? 1 - 0.05 * rattle : 1 - 0.8 * e;
        r.dl.setAttribute('transform', `translate(34 0) scale(${k.toFixed(3)} 1) translate(-34 0)`);
        r.dr.setAttribute('transform', `translate(166 0) scale(${k.toFixed(3)} 1) translate(-166 0)`);
        /* 匾額：布幔拉到一半時彈出 */
        const pp = u < 0.2 ? 0 : clamp((u - 0.2) / 0.5, 0, 1);
        r.pl.setAttribute('transform', `translate(100 86) scale(${(0.86 + 0.14 * ease.back(pp)).toFixed(3)}) translate(-100 -86)`);
        const t2 = Math.max(0, u - 0.7), bob = u > 0.7 ? Math.sin(t2 * 6) * 1.2 * Math.min(1, t2 * 3) : 0;
        r.pile.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
        /* 反光：每 2.8 秒掃過匾額 */
        const g = u < 0.9 ? -1 : ((u - 0.9) % 2.8) / 0.9;
        r.sn.setAttribute('x', g < 0 || g > 1 ? -80 : 40 + 170 * ease.inout(g));
        r.glow.setAttribute('fill', u >= this.burst ? `url(#${r.gid})` : c.mainD);
        const v2 = u - this.burst;
        return { squash: u < 0 ? 0 : v2 > -0.02 && v2 < 0.1 ? 0.035 * (1 - (v2 + 0.02) / 0.12) : 0 };
      }
    },

    /* ── 太空梭：太空梭繞地球飛一圈（繞到地球後面會被擋住），回到起點之後文字出現。沒有光芒與星光 ── */
    shuttle: {
      main: '#5DBAE8', trim: '#C6C7BD', items: 'coin', count: 0, plain: true, hint: '點擊發射', burst: 2.7, tail: 0.7, pd: 0, lift: [0, 0.1], cover: '',
      svg(o, c, id) {
        const ink = c.ink, W = '#F4F3EC', space = mix(o.main, '#000000', 0.1), green = PALETTE.green;
        const stars = [[26, 34, 1.3], [48, 27, 0.9], [72, 36, 1.1], [132, 28, 1.2], [152, 34, 0.9], [172, 42, 1.4], [30, 72, 1], [170, 76, 1], [22, 108, 1.2], [178, 112, 1], [40, 150, 1], [160, 150, 1.2], [112, 154, 0.9], [24, 140, 0.9], [182, 140, 0.9]]
          .map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${i % 4 === 0 ? PALETTE.yellow : PALETTE.shell}"/>`).join('');
        const land = `<path d="M70,82 Q80,74 92,80 Q98,88 90,96 Q82,94 74,100 Q66,94 70,82 Z M106,108 Q118,102 128,110 Q132,120 122,128 Q112,124 106,108 Z M128,80 Q138,78 142,86 Q138,94 130,90 Z" fill="${green}" stroke="${mix(green, '#000000', 0.55)}" stroke-width="1.4" stroke-linejoin="round"/>`;
        const cloud = `<path d="M64,92 Q72,88 84,92 M96,76 Q108,72 120,77 M108,122 Q116,118 130,122" stroke="${PALETTE.shell}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        return `
<defs><clipPath id="${id}-pn"><rect x="14" y="18" width="172" height="144" rx="11"/></clipPath><clipPath id="${id}-ec"><circle cx="100" cy="100" r="38"/></clipPath></defs>
<g clip-path="url(#${id}-pn)">
  <rect x="14" y="18" width="172" height="144" fill="${space}"/>
  ${stars}
  <g class="tc-bk" transform="translate(100 100) rotate(-14)"><path d="M-70,0 A70,20 0 0 1 70,0" fill="none" stroke="${PALETTE.gray}" stroke-width="1.4" stroke-dasharray="4 4"/>
    <g class="tc-sh">
      <g class="tc-fl"><path d="M-19,-2 L-28,0 L-19,2 Z" fill="${PALETTE.playful}" stroke="${ink}" stroke-width="1"/></g>
      <path d="M-12,-3.5 L-17,-13 L-6,-3.5 Z" fill="${W}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-16,2 L4,2 L-8,10.5 L-16,6 Z" fill="${W}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-19,-4 L8,-4 Q17,-3.6 19.5,0 Q17,3.6 8,4 L-19,4 Z" fill="${W}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M-19,2 L9,2 Q16,2.4 19,0.6 Q17,3.6 8,4 L-19,4 Z" fill="${ink}"/>
      <path d="M9,-3.2 L13.5,-3 Q16,-2 16.6,-0.8 L9,-0.8 Z" fill="${mix(PALETTE.indigo, '#000000', 0.45)}"/>
      <rect x="-12" y="-4" width="3.2" height="3" fill="${PALETTE.red}"/>
      <rect x="-22" y="-2.6" width="3.4" height="5.2" rx="1" fill="${ink}"/>
    </g>
  </g>
  <circle cx="100" cy="100" r="38" fill="${o.main}"/>
  <g clip-path="url(#${id}-ec)">
    <g class="tc-land">${land}<g transform="translate(84 0)">${land}</g></g>
    <g class="tc-cld">${cloud}<g transform="translate(84 0)">${cloud}</g></g>
    <circle cx="118" cy="112" r="44" fill="none" stroke="${c.mainD}" stroke-width="24"/>
  </g>
  <circle cx="100" cy="100" r="38" fill="none" stroke="${ink}" stroke-width="2.4"/>
  <path d="M75,86 Q80,74 94,69" stroke="${PALETTE.shell}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <g class="tc-ft" transform="translate(100 100) rotate(-14)"><path d="M70,0 A70,20 0 0 1 -70,0" fill="none" stroke="${PALETTE.gray}" stroke-width="1.4" stroke-dasharray="4 4"/></g>
</g>${sceneFrame(c, id)}`;
      },
      refs(s) {
        const g = q => s.querySelector(q);
        return { bk: g('.tc-bk'), ft: g('.tc-ft'), sh: g('.tc-sh'), fl: g('.tc-fl'), land: g('.tc-land'), cld: g('.tc-cld') };
      },
      mouth() { return [100, 76]; },
      pose(r, u) {
        /* 繞一圈：起點在左下，沿傾斜的橢圓軌道走完整一圈，頭尾慢、中間快 */
        const T0 = this.burst, p = u < 0 ? 0 : ease.inout(clamp(u / T0, 0, 1)), th = 2.6 - 2 * Math.PI * p;
        const rx = 70, ry = 20, x = rx * Math.cos(th), y = ry * Math.sin(th) + (u < 0 ? Math.sin(performance.now() / 500) * 0.8 : 0);
        const ang = Math.atan2(-ry * Math.cos(th), rx * Math.sin(th)) * 180 / Math.PI, sc = 0.9 * (1 + 0.22 * Math.sin(th));
        r.sh.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(1)}) scale(${sc.toFixed(3)})`);
        /* 在地球前面（橢圓下半）就放到前景，在後面就放回地球後方 */
        const grp = Math.sin(th) > 0 ? r.ft : r.bk;
        if (r.sh.parentNode !== grp) grp.appendChild(r.sh);
        const burning = u > 0.12 && u < T0 - 0.15;
        r.fl.style.display = burning ? '' : 'none';
        if (burning) r.fl.setAttribute('transform', `translate(-19 0) scale(${(0.75 + 0.45 * Math.abs(Math.sin(u * 45))).toFixed(2)} 1) translate(19 0)`);
        /* 地球自轉：陸地與雲以不同速度往左移，兩份首尾相接 */
        const t = Math.max(0, u);
        r.land.setAttribute('transform', `translate(${(-(t * 7) % 84).toFixed(2)} 0)`);
        r.cld.setAttribute('transform', `translate(${(-(t * 12) % 84).toFixed(2)} 0)`);
        return { squash: 0 };
      }
    },

    /* ── 輕軌：車廂從遠方駛來，先直行，再轉彎，朝鏡頭駛到跟前停下，文字出現。沒有光芒與星光 ──
       鏡頭是真的透視投影：車廂是一個長方體，每一幀依路線上的位置與方向重新算出看得見的面（車頭、側面、車頂） */
    tram: {
      main: '#71CD76', trim: '#C6C7BD', items: 'coin', count: 0, plain: true, hint: '點擊發車', burst: 3.2, tail: 0.7, pd: 0, lift: [0, 0.1], cover: '',
      svg(o, c, id) {
        const T = TRAM, ink = c.ink, pr = T.pr, ground = mix(PALETTE.green, '#000000', 0.38), bed = mix(PALETTE.gray, '#000000', 0.55);
        const strip = (s0, s1, step, lat0, lat1) => {
          const L = [], Rr = [];
          for (let s = s0; s <= s1 + 1e-6; s += step) { const [X, Z, al] = T.at(s), lx = -Math.sin(al), lz = Math.cos(al); L.push(pr(X + lx * lat0, 0, Z + lz * lat0)); Rr.push(pr(X + lx * lat1, 0, Z + lz * lat1)); }
          return poly(L.concat(Rr.reverse()));
        };
        let ties = '';
        for (let s = -40; s <= T.LT + 8; s += 1.4) { const [X, Z, al] = T.at(s), fx = Math.cos(al), fz = Math.sin(al), lx = -fz, lz = fx; ties += poly([[-1, -0.13], [1, -0.13], [1, 0.13], [-1, 0.13]].map(q => pr(X + lx * q[0] * 1.15 + fx * q[1], 0, Z + lz * q[0] * 1.15 + fz * q[1]))); }
        const rails = [-0.72, 0.72].map(g => strip(-40, T.LT + 8, 0.7, g - 0.1, g + 0.1)).join(' ');
        const city = [[18, 14, 12, 'calm'], [32, 20, 9, 'quiet'], [41, 10, 11, 'calm'], [52, 16, 8, 'quiet'], [60, 8, 10, 'calm'], [112, 12, 9, 'quiet'], [121, 22, 10, 'calm'], [131, 15, 8, 'quiet'], [139, 10, 12, 'calm'], [151, 19, 9, 'quiet'], [160, 12, 11, 'calm'], [171, 17, 10, 'quiet']]
          .map(b => `<rect x="${b[0]}" y="${T.HY - b[1]}" width="${b[2]}" height="${b[1]}" fill="${PALETTE[b[3]]}" stroke="${ink}" stroke-width="1"/>`).join('');
        const trees = [24, 70, 82, 96, 148, 166, 178].map((x, i) => `<circle cx="${x}" cy="${T.HY - 2}" r="${4 + (i % 3)}" fill="${mix(PALETTE.green, '#000000', 0.7)}" stroke="${ink}" stroke-width="1"/>`).join('');
        return `
<defs>
  <clipPath id="${id}-pn"><rect x="14" y="18" width="172" height="144" rx="11"/></clipPath>
  <linearGradient id="${id}-sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(PALETTE.blue, '#FFFFFF', 0.55)}"/><stop offset="1" stop-color="${mix(PALETTE.blue, '#FFFFFF', 0.82)}"/></linearGradient>
</defs>
<g clip-path="url(#${id}-pn)">
  <rect x="14" y="18" width="172" height="${T.HY - 18}" fill="url(#${id}-sk)"/>
  <ellipse cx="58" cy="30" rx="16" ry="4.4" fill="#F4F3EC"/><ellipse cx="146" cy="38" rx="20" ry="5" fill="#F4F3EC"/>
  ${city}${trees}
  <rect x="14" y="${T.HY}" width="172" height="${162 - T.HY}" fill="${ground}"/>
  <path d="${strip(-40, T.LT + 8, 0.7, -1.6, 1.6)}" fill="${bed}"/>
  <path d="${ties}" fill="${PALETTE['bg-alternative']}"/>
  <path d="${rails}" fill="${PALETTE.shell}" stroke="${ink}" stroke-width="0.3"/>
  <g class="tc-car" stroke="${ink}" stroke-linejoin="round" stroke-width="0.8">
    <path class="tc-cs" fill="${mix(ground, '#000000', 0.45)}" stroke="none"/>
    <path class="tc-sd" fill="${mix('#F4F3EC', '#000000', 0.78)}"/><path class="tc-sdw" fill="${mix(PALETTE.indigo, '#000000', 0.45)}" stroke="none"/><path class="tc-sds" fill="${o.main}" stroke="none"/><path class="tc-sdk" fill="${ink}" stroke="none"/>
    <path class="tc-fr" fill="#F4F3EC"/><path class="tc-frs" fill="${o.main}" stroke="none"/><path class="tc-frw" fill="${mix(PALETTE.indigo, '#000000', 0.45)}" stroke="none"/><path class="tc-frl" fill="${PALETTE.yellow}" stroke="none"/><path class="tc-frk" fill="${ink}" stroke="none"/><path class="tc-frg" fill="${PALETTE.red}" stroke="none"/>
    <path class="tc-rf" fill="${mix(o.trim, '#FFFFFF', 0.7)}"/><path class="tc-rfl" fill="${mix(o.trim, '#000000', 0.55)}" stroke="none"/>
  </g>
</g>${sceneFrame(c, id)}`;
      },
      refs(s) {
        const g = q => s.querySelector(q), n = {};
        ['cs', 'sd', 'sdw', 'sds', 'sdk', 'fr', 'frs', 'frw', 'frl', 'frk', 'frg', 'rf', 'rfl'].forEach(k => { n[k] = g('.tc-' + k); });
        n.car = g('.tc-car'); return n;
      },
      mouth() { return [100, 66]; },
      pose(r, u) {
        const T = TRAM, pr = T.pr, A = T.A, B = T.B, Y0 = T.Y0, Y1 = T.Y1;
        /* 前半段較快、靠站時慢慢煞住 */
        const t = u < 0 ? 0 : clamp(u / this.burst, 0, 1), s = (1 - (1 - t) * (1 - t)) * T.LT;
        const [Xc, Zc, al] = T.at(s), fx = Math.cos(al), fz = Math.sin(al), lx = -fz, lz = fx;
        const P = (fo, lo, Y) => pr(Xc + fx * fo + lx * lo, Y, Zc + fz * fo + lz * lo);
        /* 面上的一塊矩形：(u0..u1, v0..v1) 是在該面上的相對位置 */
        const front = (u0, u1, v0, v1) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(q => P(A, -B + 2 * B * q[0], Y0 + (Y1 - Y0) * q[1])));
        const lc = lx * Xc + lz * Zc, sg = lc > 0 ? -1 : 1, sideOn = Math.abs(lc) > B, frontOn = fx * Xc + fz * Zc < -A;
        const side = (u0, u1, v0, v1) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(q => P(-A + 2 * A * q[0], sg * B, Y0 + (Y1 - Y0) * q[1])));
        r.car.setAttribute('stroke-width', clamp(7 / Zc, 0.25, 1.4).toFixed(2));
        r.cs.setAttribute('d', poly([[-A, -B], [A, -B], [A, B], [-A, B]].map(q => P(q[0] + 0.3, q[1] * 1.1 + 0.25, 0))));
        r.rf.setAttribute('d', poly([[-A, -B], [A, -B], [A, B], [-A, B]].map(q => P(q[0], q[1], Y1))));
        r.rfl.setAttribute('d', poly([[-A, -0.3], [A, -0.3], [A, 0.3], [-A, 0.3]].map(q => P(q[0], q[1], Y1))));
        const on = (k, d) => r[k].setAttribute('d', d);
        if (sideOn) {
          on('sd', side(0, 1, 0, 1)); on('sds', side(0, 1, 0.2, 0.32)); on('sdk', side(0, 1, 0, 0.17));
          on('sdw', [0, 1, 2, 3, 4].map(i => side(0.07 + 0.185 * i, 0.21 + 0.185 * i, 0.5, 0.86)).join(' '));
        } else ['sd', 'sds', 'sdk', 'sdw'].forEach(k => on(k, ''));
        if (frontOn) {
          on('fr', front(0, 1, 0, 1)); on('frs', front(0, 1, 0.2, 0.32)); on('frk', front(0, 1, 0, 0.17));
          on('frw', front(0.08, 0.92, 0.52, 0.9)); on('frg', front(0.3, 0.7, 0.92, 0.99));
          on('frl', front(0.05, 0.17, 0.2, 0.32) + ' ' + front(0.83, 0.95, 0.2, 0.32));
        } else ['fr', 'frs', 'frk', 'frw', 'frg', 'frl'].forEach(k => on(k, ''));
        return { squash: 0 };
      }
    },

    /* ── 撕日曆：掛在牆上的日曆，一張一張撕掉，停在 date 指定的日期。有 chest-prize 才在最後出現文字，沒有就結束。沒有光芒與星光 ──
       date 寫 2026-11-20、11-20 或 20（沒寫就是今天）；tear 是撕幾張（預設 5），所以第一張是 date 往前推 tear 天 */
    calendar: {
      main: '#EF6661', trim: '#E3D322', items: 'coin', count: 0, plain: true, hint: '點擊撕日曆', tail: 0.5, pd: 0, lift: [0, 0.1], cover: '',
      /* 解析 date：2026-11-20、2026/11/20、11-20、20；解析不了就用今天 */
      parse(str) {
        const now = new Date(), m = String(str || '').match(/\d+/g) || [];
        let y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
        if (m.length >= 3) { y = +m[0]; mo = +m[1] - 1; d = +m[2]; } else if (m.length === 2) { mo = +m[0] - 1; d = +m[1]; } else if (m.length === 1) d = +m[0];
        const dt = new Date(y, mo, d);
        return isNaN(dt) ? now : dt;
      },
      n(o) { return clamp(Math.round(num(o.tear, 5)), 1, 12); },
      tt(i) { return 0.15 + 0.3 * i; },
      burstOf(o) { return 0.35 + 0.3 * this.n(o); },
      svg(o, c, id) {
        const ink = c.ink, n = this.n(o), end = this.parse(o.date), WD = ['日', '一', '二', '三', '四', '五', '六'];
        const sheet = i => {
          const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - n + i), wk = d.getDay(), col = wk === 0 || wk === 6 ? PALETTE.red : '#0C0D0C';
          return `<g class="tc-pg" data-i="${i}">
      <rect x="40" y="50" width="120" height="98" rx="2" fill="#F4F3EC" stroke="${ink}" stroke-width="2.2"/>
      <text x="48" y="68" font-size="12" font-weight="800" fill="${col}" font-family="${SANS}">${d.getMonth() + 1}月</text>
      <text x="152" y="68" text-anchor="end" font-size="12" font-weight="800" fill="${col}" font-family="${SANS}">週${WD[wk]}</text>
      <text x="100" y="108" text-anchor="middle" dominant-baseline="central" font-size="58" font-weight="900" fill="${col}" font-family="${SERIF}">${d.getDate()}</text>
      <text x="100" y="137" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="${PALETTE.gray}" font-family="${SANS}">${d.getFullYear()}</text>
    </g>`;
        };
        /* DOM 順序：第 0 張（最先撕）在最上面，最後放進去 */
        const sheets = Array.from({ length: n + 1 }, (_, k) => sheet(n - k)).join('');
        return `
<g class="tc-sw">
  <path d="M94,26 L100,-12 L106,26" fill="none" stroke="${o.trim}" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="28" y="10" width="144" height="156" rx="8" fill="url(#${id}-m)" stroke="${ink}" stroke-width="3.5"/>
  <circle cx="100" cy="27" r="4.4" fill="${ink}"/>
  <path d="M40,40 H160" stroke="${c.mainD}" stroke-width="2" stroke-dasharray="3 4"/>
  <rect class="tc-th" x="44" y="148" width="112" height="4" rx="2" fill="${PALETTE.shell}" stroke="${ink}" stroke-width="2"/>
  ${sheets}
  <rect x="36" y="46" width="128" height="8" rx="3" fill="url(#${id}-t)" stroke="${ink}" stroke-width="2.4"/>
  <circle cx="52" cy="50" r="1.8" fill="${c.trimD}"/><circle cx="148" cy="50" r="1.8" fill="${c.trimD}"/>
</g>
<circle cx="100" cy="-14" r="4.6" fill="${PALETTE.gray}" stroke="${ink}" stroke-width="2.4"/>`;
      },
      refs(s) {
        return { sw: s.querySelector('.tc-sw'), th: s.querySelector('.tc-th'), pg: [...s.querySelectorAll('.tc-pg')].sort((a, b) => a.dataset.i - b.dataset.i) };
      },
      mouth() { return [100, -20]; },
      pose(r, u, rattle, o) {
        const n = this.n(o);
        let torn = 0, sway = u < 0 ? 2 * rattle : 0;
        r.pg.forEach((g, i) => {
          if (i >= n) { g.removeAttribute('transform'); g.style.display = ''; return; }
          const w = u < 0 ? -1 : (u - this.tt(i)) / 0.55;
          if (w <= 0) { g.removeAttribute('transform'); g.style.display = ''; return; }
          torn++;
          if (w >= 1) { g.style.display = 'none'; return; }
          g.style.display = '';
          /* 右上角先被捏起來掀開，再脫手往左下掉，一邊旋轉 */
          const lift = clamp(w / 0.3, 0, 1), fall = Math.pow(Math.max(0, w - 0.3) / 0.7, 2);
          const a = 28 * ease.out(lift) + 62 * Math.pow(Math.max(0, w - 0.3) / 0.7, 1.4);
          g.setAttribute('transform', `translate(${(-26 * fall).toFixed(2)} ${(190 * fall).toFixed(2)}) rotate(${a.toFixed(2)} 160 52)`);
        });
        /* 每撕一張，整本日曆在釘子上晃一下 */
        for (let i = 0; i < n; i++) { const dt = u - this.tt(i); if (u >= 0 && dt > 0) sway += (i % 2 ? -1 : 1) * 3.2 * Math.exp(-4 * dt) * Math.sin(20 * dt); }
        r.sw.setAttribute('transform', `rotate(${sway.toFixed(2)} 100 -14)`);
        r.th.setAttribute('height', Math.min(14, 2 + (n + 1 - torn)).toFixed(1));
        const v2 = u - this.burstOf(o);
        return { squash: u < 0 ? 0 : v2 > -0.05 && v2 < 0.15 ? 0.03 * Math.sin((v2 + 0.05) / 0.2 * Math.PI) : 0 };
      }
    },

    /* ── 街道：約 45 度俯視的十字路口，面對的轉角是超商（轉角開門）。density（0 到 10）決定進出顧客的數量，同時決定四個車道的車流量。
       紅綠燈輪流放行，車子會排隊、跟車；顧客走進超商、過一陣子再提著袋子走出來。沒有光芒與星光，有 chest-prize 才在 3.5 秒後出現文字 ── */
    street: {
      main: '#71CD76', trim: '#C6C7BD', items: 'coin', count: 0, plain: true, hint: '點擊開始營業', burst: 3.5, tail: 0.5, pd: 0, lift: [0, 0.1], cover: '',
      DOOR: [-20.5, -20.5],
      svg(o, c, id) {
        const P = iso, ink = c.ink, W = '#F4F3EC';
        const asphalt = mix(PALETTE.gray, '#000000', 0.5), walk = mix(PALETTE.shell, '#000000', 0.8), grass = mix(PALETTE.green, '#000000', 0.42);
        const flat = (x0, y0, x1, y1, z = 0) => poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]);
        /* 面上的一塊矩形：O 是原點，U、V 是兩個方向，(u0..u1, v0..v1) 是在面上的相對位置 */
        const Q = (O, U, V, u0, u1, v0, v1) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(q => P(O[0] + U[0] * q[0] + V[0] * q[1], O[1] + U[1] * q[0] + V[1] * q[1], O[2] + U[2] * q[0] + V[2] * q[1])));
        const box = (x0, y0, x1, y1, h, cT, cR, cL, win) => {
          const OR = [x1, y0, 0], UR = [0, y1 - y0, 0], OL = [x0, y1, 0], UL = [x1 - x0, 0, 0], V = [0, 0, h];
          const wins = (O, U) => [0, 1, 2].map(i => Q(O, U, V, 0.12 + i * 0.29, 0.34 + i * 0.29, 0.2, 0.8)).join(' ');
          return `<path d="${poly([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, h), P(x1, y0, h)])}" fill="${cR}"/><path d="${poly([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)])}" fill="${cL}"/>`
            + `<path d="${wins(OR, UR)}" fill="${win}"/><path d="${wins(OL, UL)}" fill="${win}"/><path d="${flat(x0, y0, x1, y1, h)}" fill="${cT}"/>`;
        };
        /* 斑馬線與車道線 */
        const zebra = (fn) => Array.from({ length: 6 }, (_, i) => fn(-8 + i * 3.2)).join(' ');
        const zA = [13, -17].map(x0 => zebra(y => flat(x0, y - 0.9, x0 + 4, y + 0.9))).join(' '), zB = [13, -17].map(y0 => zebra(x => flat(x - 0.9, y0, x + 0.9, y0 + 4))).join(' ');
        const dash = pts => 'M' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' L');
        const center = [dash([P(-110, 0), P(-19, 0)]), dash([P(19, 0), P(110, 0)]), dash([P(0, -110), P(0, -19)]), dash([P(0, 19), P(0, 110)])].join(' ');
        /* 超商：轉角切掉一個斜面當作入口，斜面正對鏡頭 */
        const x0 = -42, y0 = -42, x1 = -16, y1 = -16, cc = 9, H = 24, V = [0, 0, H];
        const FR = [x1, y0, 0], UR = [0, (y1 - cc) - y0, 0], FL = [x0, y1, 0], UL = [(x1 - cc) - x0, 0, 0], FC = [x1, y1 - cc, 0], UC = [-cc, cc, 0];
        const glass = mix(PALETTE.blue, '#000000', 0.45), ink2 = c.mainD;
        const sign = (O, U) => `<path d="${Q(O, U, V, 0, 1, 0.8, 1)}" fill="${o.main}"/><path d="${Q(O, U, V, 0, 1, 0.74, 0.79)}" fill="${PALETTE.salmon}"/>`;
        const front = (O, U, k) => `<path d="${poly([[0, 0], [1, 0], [1, 1], [0, 1]].map(q => P(O[0] + U[0] * q[0], O[1] + U[1] * q[0], H * q[1])))}" fill="${k}"/>`;
        const NV = [3.2, 3.2, -3.4], aw = (u, z) => P(FC[0] + UC[0] * u, FC[1] + UC[1] * u, H * 0.68 + z);
        const awning = Array.from({ length: 6 }, (_, i) => { const u0 = 0.08 + i * 0.14, u1 = u0 + 0.14, a = P(FC[0] + UC[0] * u0, FC[1] + UC[1] * u0, H * 0.68), b = P(FC[0] + UC[0] * u1, FC[1] + UC[1] * u1, H * 0.68), a2 = P(FC[0] + UC[0] * u0 + NV[0], FC[1] + UC[1] * u0 + NV[1], H * 0.68 + NV[2]), b2 = P(FC[0] + UC[0] * u1 + NV[0], FC[1] + UC[1] * u1 + NV[1], H * 0.68 + NV[2]); return `<path d="${poly([a, b, b2, a2])}" fill="${i % 2 ? W : o.main}" stroke="${ink}" stroke-width="0.4"/>`; }).join('');
        const store = `
  ${front(FR, UR, mix(W, '#000000', 0.86))}${front(FL, UL, mix(W, '#000000', 0.74))}${front(FC, UC, W)}
  ${sign(FR, UR)}${sign(FL, UL)}${sign(FC, UC)}
  <path d="${Q(FR, UR, V, 0.1, 0.9, 0.14, 0.6)} ${Q(FL, UL, V, 0.1, 0.9, 0.14, 0.6)}" fill="${glass}"/>
  <path d="${Q(FC, UC, V, 0.18, 0.82, 0, 0.64)}" fill="${ink2}"/>
  <path class="tc-dg" d="${Q(FC, UC, V, 0.22, 0.48, 0.02, 0.6)} ${Q(FC, UC, V, 0.52, 0.78, 0.02, 0.6)}" fill="${glass}"/>
  <path d="${poly([P(x0, y0, H), P(x1, y0, H), P(x1, y1 - cc, H), P(x1 - cc, y1, H), P(x0, y1, H)])}" fill="${mix(PALETTE.shell, '#000000', 0.62)}" stroke="${ink}" stroke-width="0.6"/>
  ${awning}`;
        const tree = (x, y) => { const q = P(x, y); return `<g class="tc-st" data-d="${x + y}" transform="translate(${q[0].toFixed(1)} ${q[1].toFixed(1)}) scale(0.8)"><ellipse cx="0" cy="0.5" rx="6" ry="2.4" fill="${mix(grass, '#000000', 0.6)}"/><rect x="-1.1" y="-7" width="2.2" height="7" fill="${PALETTE['bg-alternative']}"/><circle cx="-3.4" cy="-9" r="4.4" fill="${mix(PALETTE.green, '#000000', 0.6)}" stroke="${ink}" stroke-width="0.5"/><circle cx="3.4" cy="-9" r="4.4" fill="${mix(PALETTE.green, '#000000', 0.6)}" stroke="${ink}" stroke-width="0.5"/><circle cx="0" cy="-12" r="5.2" fill="${mix(PALETTE.green, '#000000', 0.78)}" stroke="${ink}" stroke-width="0.5"/></g>`; };
        const pq = P(13, 13), pole = `<g class="tc-st" data-d="26" transform="translate(${pq[0].toFixed(1)} ${pq[1].toFixed(1)})"><path d="M0,0 L0,-17" stroke="${PALETTE.gray}" stroke-width="1.6"/><rect x="-6" y="-24" width="12" height="7" rx="2" fill="#0C0D0C" stroke="${PALETTE.gray}" stroke-width="0.8"/><circle class="tc-lA" cx="-3" cy="-20.5" r="2" fill="${PALETTE.red}"/><circle class="tc-lB" cx="3" cy="-20.5" r="2" fill="${PALETTE.red}"/></g>`;
        return `
<defs><clipPath id="${id}-pn"><rect x="14" y="18" width="172" height="144" rx="11"/></clipPath></defs>
<g clip-path="url(#${id}-pn)">
  <rect x="14" y="18" width="172" height="144" fill="${mix(PALETTE.blue, '#FFFFFF', 0.7)}"/>
  <path d="${flat(-110, -110, 110, 110)}" fill="${grass}"/>
  <path d="${flat(11, 11, 44, 44)} ${flat(-44, 11, -11, 44)} ${flat(11, -44, 44, -11)} ${flat(-44, -44, -11, -11)} ${flat(-110, -16, 110, -11)} ${flat(-110, 11, 110, 16)} ${flat(-16, -110, -11, 110)} ${flat(11, -110, 16, 110)}" fill="${walk}"/>
  <path d="${flat(14, 14, 41, 41)}" fill="${grass}"/>
  <path d="${flat(-110, -11, 110, 11)} ${flat(-11, -110, 11, 110)}" fill="${asphalt}"/>
  <path d="${center}" fill="none" stroke="${PALETTE.yellow}" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="${zA} ${zB}" fill="${PALETTE.vanilla}"/>
  ${box(-42, 18, -18, 42, 10, mix(PALETTE.calm, '#FFFFFF', 0.8), mix(PALETTE.calm, '#000000', 0.8), mix(PALETTE.calm, '#000000', 0.68), mix(PALETTE.indigo, '#000000', 0.5))}
  ${box(18, -42, 42, -18, 16, mix(PALETTE.quiet, '#FFFFFF', 0.8), mix(PALETTE.quiet, '#000000', 0.8), mix(PALETTE.quiet, '#000000', 0.68), mix(PALETTE.indigo, '#000000', 0.5))}
  ${store}
  <g class="tc-dyn" stroke-linejoin="round">${pole}${tree(27, 27)}${tree(38, 22)}${tree(24, 38)}${tree(37, 37)}</g>
</g>${sceneFrame(c, id)}`;
      },
      refs(s) {
        return { dyn: s.querySelector('.tc-dyn'), dg: s.querySelector('.tc-dg'), lA: s.querySelector('.tc-lA'), lB: s.querySelector('.tc-lB'), stat: [...s.querySelectorAll('.tc-st')].map(el => ({ el, d: +el.dataset.d })), sim: null, lu: -1 };
      },
      mouth() { return [100, 44]; },
      /* 紅綠燈：A 路（沿 x）綠 3.4 秒、黃 0.8 秒、全紅 0.6 秒，再換 B 路 */
      phase(t) {
        const T = t % 9.6;
        return { A: T < 3.4 ? 'g' : T < 4.2 ? 'y' : 'r', B: T >= 4.8 && T < 8.2 ? 'g' : T >= 8.2 && T < 9 ? 'y' : 'r' };
      },
      init(r, o) {
        let a = (Math.random() * 4294967296) >>> 0;
        const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        const dens = clamp(num(o.density, 5), 0, 10);
        const S = r.sim = { rnd, dens, time: 0, pt: 0.3, exits: [], peds: [], lanes: [
          { ax: 'x', dir: 1, off: 5.5, road: 'A', cars: [], t: 0.2 }, { ax: 'x', dir: -1, off: -5.5, road: 'A', cars: [], t: 0.9 },
          { ax: 'y', dir: 1, off: -5.5, road: 'B', cars: [], t: 0.5 }, { ax: 'y', dir: -1, off: 5.5, road: 'B', cars: [], t: 1.3 }] };
        /* 一開始就有幾位顧客在店裡，等一下陸續走出來 */
        for (let i = 0; i < Math.round(dens / 2); i++) S.exits.push(0.5 + rnd() * 3.5);
        /* 先暖機 8 秒，待機時就是一個有車有人的畫面 */
        for (let i = 0; i < 160; i++) this.step(r, 0.05);
      },
      mk(r, svg) { const g = document.createElementNS(NS, 'g'); g.innerHTML = svg; r.dyn.appendChild(g); return g; },
      step(r, dt) {
        const S = r.sim, rnd = S.rnd, ph = this.phase(S.time + dt), pal = ['red', 'blue', 'yellow', 'shell', 'pink', 'green', 'indigo', 'salmon', 'violet', 'key'].map(n => PALETTE[n]), ink = '#0C0D0C';
        S.time += dt;
        /* ── 車流：每個車道各自生車，前車太近就減速，紅燈與黃燈停在停止線前 ── */
        S.lanes.forEach(L => {
          if (S.dens > 0) {
            L.t -= dt;
            const last = L.cars[L.cars.length - 1];
            if (L.t <= 0 && (!last || last.p - last.L / 2 > 4)) {
              const col = pal[(rnd() * pal.length) | 0], car = { p: 0, v: 18, L: 10, el: null };
              car.el = this.mk(r, carSVG(L.ax, L.dir, col, ink)); L.cars.push(car);
              L.t = -Math.log(1 - rnd()) / (S.dens * 0.05);
            } else if (L.t <= 0) L.t = 0.2;
          }
          L.cars.forEach((c, i) => {
            const lead = L.cars[i - 1], light = ph[L.road], dist = 87 - (c.p + c.L / 2);
            let target = 22;
            if (lead) target = Math.min(target, Math.max(0, lead.p - lead.L / 2 - (c.p + c.L / 2) - 2.5) * 4);
            if (light !== 'g' && dist > -0.5 && (light === 'r' || dist > 3.5)) target = Math.min(target, Math.max(0, dist) * 3);
            c.v += Math.max(-45 * dt, Math.min(14 * dt, target - c.v)); c.p += c.v * dt;
          });
          L.cars = L.cars.filter(c => { if (c.p > 215) { c.el.remove(); return false; } return true; });
        });
        /* ── 顧客：從兩條人行道走來，走進斜面的門；店裡的人過一陣子再提著袋子走出來 ── */
        const door = this.DOOR, app = [-17.5, -17.5], newPed = (path, kind) => {
          const shirt = ['yellow', 'pink', 'key', 'green', 'blue', 'violet', 'playful', 'salmon', 'energetic', 'red'].map(n => PALETTE[n])[(rnd() * 10) | 0], skin = [PALETTE.salmon, PALETTE.playful, '#8A5530'][(rnd() * 3) | 0];
          S.peds.push({ x: path[0][0], y: path[0][1], path, i: 1, sp: 11 + rnd() * 5, kind, sc: kind === 'out' ? 0 : 1, ph: rnd() * 6, el: this.mk(r, pedSVG(shirt, skin, kind === 'out', ink, PALETTE.vanilla)) });
        };
        S.pt -= dt;
        if (S.dens > 0 && S.pt <= 0 && S.peds.length < 14) {
          newPed(rnd() < 0.5 ? [[-105, -13.5], [-18, -13.5], app, door] : [[-13.5, -105], [-13.5, -18], app, door], 'in');
          S.pt = -Math.log(1 - rnd()) / (S.dens * 0.1);
        } else if (S.pt <= 0) S.pt = 0.3;
        S.exits = S.exits.filter(t => { if (t <= S.time && S.peds.length < 16) { newPed(rnd() < 0.5 ? [door, app, [-18, -13.5], [-105, -13.5]] : [door, app, [-13.5, -18], [-13.5, -105]], 'out'); return false; } return true; });
        S.peds = S.peds.filter(q => {
          if (q.kind === 'out') q.sc = Math.min(1, q.sc + dt * 4);
          const tg = q.path[q.i], dx = tg[0] - q.x, dy = tg[1] - q.y, d = Math.hypot(dx, dy), st = q.sp * dt;
          if (d <= st) { q.x = tg[0]; q.y = tg[1]; q.i++; } else { q.x += dx / d * st; q.y += dy / d * st; }
          q.ph += dt * 12;
          if (q.i >= q.path.length) {
            if (q.kind === 'in') S.exits.push(S.time + 1.2 + rnd() * 3.5);
            q.el.remove(); return false;
          }
          /* 走進門的最後一段：身體縮窄，像是被門吞進去 */
          if (q.kind === 'in' && q.i === q.path.length - 1) q.sc = Math.max(0.1, Math.hypot(door[0] - q.x, door[1] - q.y) / 4.2);
          return true;
        });
      },
      pose(r, u, rattle, o) {
        if (!r.sim) this.init(r, o);
        const S = r.sim, dt = u < 0 ? 0 : clamp(u - (r.lu < 0 ? 0 : r.lu), 0, 0.05);
        r.lu = u;
        if (dt > 0) this.step(r, dt);
        const ents = r.stat.slice(), col = { g: PALETTE.green, y: PALETTE.yellow, r: PALETTE.red }, ph = this.phase(S.time), dr = this.DOOR;
        r.lA.setAttribute('fill', col[ph.A]); r.lB.setAttribute('fill', col[ph.B]);
        S.lanes.forEach(L => L.cars.forEach(c => {
          const a = L.dir > 0 ? -100 + c.p : 100 - c.p, x = L.ax === 'x' ? a : L.off, y = L.ax === 'x' ? L.off : a, q = iso(x, y);
          c.el.setAttribute('transform', `translate(${q[0].toFixed(2)} ${q[1].toFixed(2)})`); ents.push({ el: c.el, d: x + y });
        }));
        let near = 0;
        S.peds.forEach(q => {
          const p = iso(q.x, q.y), bob = Math.abs(Math.sin(q.ph)) * 0.7;
          if (Math.hypot(q.x - dr[0], q.y - dr[1]) < 5) near++;
          q.el.setAttribute('transform', `translate(${p[0].toFixed(2)} ${(p[1] - bob).toFixed(2)}) scale(${q.sc.toFixed(2)} 1)`); ents.push({ el: q.el, d: q.x + q.y + 0.3 });
        });
        r.dg.setAttribute('fill', near ? PALETTE.vanilla : mix(PALETTE.blue, '#000000', 0.45));
        /* 由遠到近排序：離鏡頭越近的越晚畫 */
        ents.sort((a, b) => a.d - b.d).forEach((e, i) => { if (r.dyn.children[i] !== e.el) r.dyn.insertBefore(e.el, r.dyn.children[i] || null); });
        return { squash: 0 };
      }
    }
  };

  class TreasureChest extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      else this._build();
    }
    disconnectedCallback() { if (this._io) this._io.disconnect(); cancelAnimationFrame(this._raf); this._raf = 0; }

    /* shake：0 到 1，越大搖得越明顯 */
    _shakeVal(v) {
      const t = String(v).trim().toLowerCase();
      if (t === 'false') return 0;
      if (t === '' || t === 'true') return 0.5;
      return clamp(num(t, 0.5), 0, 1);
    }
    _opt() {
      const a = (n, d) => this.hasAttribute(n) ? this.getAttribute(n) : d;
      let type = String(a('type', 'chest')).trim().toLowerCase();
      if (!TYPES[type]) { console.warn(`[treasure-chest] 未知的 type「${type}」，改用 chest`); type = 'chest'; }
      const T = TYPES[type];
      return {
        type, size: num(a('size'), 220), trigger: a('trigger', 'click'), delay: num(a('delay'), 300),
        bg: color(a('bg', 'base')), gold: color(a('gold', 'yellow')), light: color(a('light', '#FFF6C8')),
        main: color(a('chest-color', T.main)), trim: color(a('trim-color', T.trim)), capsule: color(a('capsule-color', 'pink')),
        rays: Math.max(0, Math.round(num(a('rays'), T.plain ? 0 : 14))), date: a('date', ''), tear: a('tear', '5'), density: a('density', '5'), raySpeed: num(a('ray-speed'), 10),
        sparkles: Math.max(0, num(a('sparkles'), T.plain ? 0 : 80)), coins: Math.max(0, num(a('coins'), T.count)),
        ambient: a('ambient', T.plain ? 'false' : 'true') !== 'false', shake: this._shakeVal(a('shake', '0')),
        hint: a('hint', T.hint), replay: this.hasAttribute('replay'),
        words: a('words', ''), wordColors: parseWordColors(a('word-colors', '')), stamp: a('stamp', T.stamp || ''), cover: a('cover-text', T.cover || ''), digits: a('digits', '05687777'),
        prizeBg: color(a('prize-bg', 'base')), prizeColor: color(a('prize-color', 'yellow')), prizeSize: a('prize-size', '1.4rem'),
        reveal: a('reveal-targets', ''), remove: a('remove-targets', '')
      };
    }

    _build() {
      const o = this._o = this._opt(), S = o.size;
      this.T = TYPES[o.type];
      this.W = Math.round(S * 2.2); this.H = Math.round(S * 1.95);
      this.style.setProperty('--tc-gold', o.gold); this.style.setProperty('--tc-pbg', o.prizeBg); this.style.setProperty('--tc-pc', o.prizeColor);
      this.style.setProperty('--tc-pfs', /^\d*\.?\d+$/.test(o.prizeSize) ? o.prizeSize + 'rem' : o.prizeSize);
      this.style.setProperty('--tc-hc', mix(o.gold, o.bg, 0.8));
      const stage = this.stage = document.createElement('div'); stage.className = 'tc-stage';
      stage.style.width = this.W + 'px'; stage.style.height = this.H + 'px'; stage.style.background = o.bg;
      this.back = document.createElement('canvas'); this.front = document.createElement('canvas');
      stage.append(this.back);
      this._svg(stage);
      stage.append(this.front);
      const prize = this.querySelector(':scope > chest-prize');
      this.prize = document.createElement('div'); this.prize.className = 'tc-prize';
      if (prize && prize.innerHTML.trim()) { const pin = document.createElement('div'); pin.className = 'tc-prize-in'; pin.innerHTML = prize.innerHTML; this.prize.append(pin); }
      stage.append(this.prize);
      this.hintEl = document.createElement('div'); this.hintEl.className = 'tc-hint' + (o.hint && o.trigger === 'click' ? '' : ' off'); this.hintEl.textContent = o.hint;
      stage.append(this.hintEl);
      this.append(stage);
      [this.back, this.front].forEach(c => { const d = window.devicePixelRatio || 1; c.width = this.W * d; c.height = this.H * d; c.getContext('2d').setTransform(d, 0, 0, d, 0, 0); });

      this.state = 'closed'; this.t0 = 0; this.parts = []; this.items = []; this.intensity = 0; this.rot = 0; this._done = { shown: [], removed: [] };
      if (o.trigger === 'click') { stage.classList.add('tc-click'); stage.addEventListener('click', () => { if (this.state === 'closed') this.open(); else if (this.state === 'open' && o.replay) this.reset(); }); }
      if (o.trigger === 'auto') {
        this._io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && this.state === 'closed') { this._io.disconnect(); setTimeout(() => this.open(), o.delay); } }, { threshold: 0.6 });
        this._io.observe(stage);
      }
      this._apply(-1, 0, 0);
    }

    _svg(stage) {
      const o = this._o, S = o.size, k = S / 200;
      const c = this.c = {
        mainD: mix(o.main, '#000000', 0.62), mainL: mix(o.main, '#FFFFFF', 0.82), ink: mix(o.main, '#000000', 0.28),
        trimD: mix(o.trim, '#000000', 0.62), trimL: mix(o.trim, '#FFFFFF', 0.55), trimInk: mix(o.trim, '#000000', 0.25)
      };
      const id = 'tc' + Math.random().toString(36).slice(2, 8);
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'tc-svg'); svg.setAttribute('viewBox', '0 -60 200 230');
      svg.setAttribute('width', S); svg.setAttribute('height', 230 * k);
      this.svgTop = this.H - 230 * k - S * 0.12; this.k = k;
      svg.style.top = this.svgTop + 'px';
      svg.innerHTML = `
<defs>
  <linearGradient id="${id}-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.mainL}"/><stop offset="1" stop-color="${o.main}"/></linearGradient>
  <linearGradient id="${id}-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.trimL}"/><stop offset=".5" stop-color="${o.trim}"/><stop offset="1" stop-color="${c.trimD}"/></linearGradient>
</defs>
<g class="tc-body">${this.T.svg(o, c, id)}</g>`;
      stage.append(svg);
      this.body = svg.querySelector('.tc-body');
      this.refs = this.T.refs(svg);
    }
    /* viewBox 座標 → 舞台座標 */
    _toStage(x, y) { return { x: this.W / 2 + (x - 100) * this.k, y: this.svgTop + (y + 60) * this.k }; }
    /* 光芒出口（寶箱口、杯口、盒口、扭蛋）在舞台上的座標 */
    _mouth() { const p = this.T.mouth(this._u); return this._toStage(p[0], p[1]); }

    /* 姿勢：共用的搖晃（角度、壓扁、上跳）＋各圖形自己的開啟動作 */
    _apply(u, rattle, rot, squash0 = 0, hop = 0) {
      this._u = u;
      const r = this.T.pose(this.refs, u, rattle, this._o, this.c) || {};
      const squash = squash0 + (r.squash || 0), sy = 1 - squash, sx = 1 + squash * 0.6;
      this.body.setAttribute('transform', `translate(100 ${166 + hop}) rotate(${rot}) scale(${sx} ${sy}) translate(-100 -166)`);
    }

    open() {
      if (!this._o || this.state !== 'closed') return;
      this.state = 'opening'; this.t0 = performance.now(); this.hintEl.classList.add('off'); this._burst = false;
      this.dispatchEvent(new CustomEvent('treasure-chest:open', { bubbles: true, detail: { type: this._o.type } }));
      this._loop();
    }
    /* link-when 的 do="play"（預設）會呼叫 play()，等同 open() */
    play() { this.open(); }
    reset() {
      if (!this._o) return;
      cancelAnimationFrame(this._raf); this._raf = 0;
      this.state = 'closed'; this.parts = []; this.items = []; this.intensity = 0; this._apply(-1, 0, 0);
      this.prize.style.transform = 'translate(-50%,-50%) scale(0)';
      if (this._o.hint && this._o.trigger === 'click') this.hintEl.classList.remove('off');
      [this.back, this.front].forEach(c => c.getContext('2d').clearRect(0, 0, this.W, this.H));
      this._undoTargets();
      this.dispatchEvent(new CustomEvent('treasure-chest:reset', { bubbles: true }));
    }
    get opened() { return this.state === 'open'; }
    get type() { return this._o ? this._o.type : (this.getAttribute('type') || 'chest'); }

    /* ── 動畫完結後：顯示、刪除指定元素。寫 id 可省略 #，也可以寫完整選擇器（如 .tip） ── */
    _targets(list) {
      return String(list || '').split(',').map(s => s.trim()).filter(Boolean).flatMap(s => {
        const sel = /^[#.\[]/.test(s) || /[\s>:~+]/.test(s) ? s : '#' + s;
        try {
          const found = [...document.querySelectorAll(sel)];
          if (!found.length) console.warn(`[treasure-chest] 找不到「${s}」`);
          return found;
        } catch (e) { console.warn(`[treasure-chest] 無效的選擇器「${s}」`); return []; }
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
    /* reset() 時還原：顯示過的再藏起來，刪除過的放回原位 */
    _undoTargets() {
      const d = this._done || { shown: [], removed: [] };
      d.shown.forEach(x => { uivRestore(x.el, x.vis); });
      d.removed.slice().reverse().forEach(x => { x.parent.insertBefore(x.el, x.next && x.next.parentNode === x.parent ? x.next : null); });
      this._done = { shown: [], removed: [] };
    }

    _loop() {
      if (this._raf) return;
      let last = performance.now();
      const tick = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        this._frame(now, dt);
        this._raf = (this.state === 'closed') ? 0 : requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }
    _frame(now, dt) {
      /* 搖晃強度 k（0 到 1）：角度、時間、震動、上跳高度都跟著放大 */
      const o = this._o, T = this.T, k = o.shake, t = (now - this.t0) / 1000, sh = k > 0 ? 0.35 + 0.8 * k : 0.05;
      /* 時間軸：搖晃 → 開啟動作 → 光芒、星光、噴出物 → 獎品升起 → 完結（顯示／刪除元素、opened 事件）→ 待機 */
      let rot = 0, squash = 0, hop = 0, rattle = 0, u = t - sh;
      if (t < sh && k > 0) {
        const p = t / sh, w = Math.sin(p * Math.PI * (7 + 4 * k)), env = 0.3 + 0.7 * p;
        rot = w * env * 14 * k; squash = 0.04 * p * Math.min(1, k * 2);
        rattle = Math.abs(w) * p * k; hop = -Math.abs(w) * p * Math.max(0, k - 0.4) * 14;
        u = -0.001;
      } else if (u < 0) u = 0;
      this._apply(u, rattle, rot, squash, hop);
      /* v：相對於光芒噴出的時間（寶箱為 u − 0.06，與 v1.2 時間點一致） */
      const v = u - (T.burstOf ? T.burstOf(o) : T.burst);
      if (v >= 0) {
        if (!this._burst) { this._burst = true; this._spawnBurst(); }
        const pu = Math.max(0, v - (T.pd === undefined ? 0.24 : T.pd)), pk = pu < 0.55 ? ease.back(pu / 0.55) : 1, rise = ease.out(Math.min(1, pu / 0.7));
        const m = this._mouth(), L = T.lift || [0.18, 0.7], top = m.y - o.size * (L[0] + (L[1] - L[0]) * rise);
        this.prize.style.left = m.x + 'px'; this.prize.style.top = top + 'px';
        this.prize.style.transform = `translate(-50%,-50%) scale(${Math.max(0, pk)})`;
        this.intensity = Math.min(1, (v + 0.06) / 0.5);
        if (this.state === 'opening' && v > (T.tail || 1.24)) {
          this.state = 'open';
          const res = this._runTargets();
          this.dispatchEvent(new CustomEvent('treasure-chest:opened', { bubbles: true, detail: Object.assign({ type: o.type }, res) }));
        }
        if (o.ambient && Math.random() < dt * 9) this._spark(true);
        if (o.ambient && T.items === 'word' && Math.random() < dt * 1.6) this._word(true);
      }
      this.rot += dt * o.raySpeed * Math.PI / 180;
      this._drawBack(t);
      this._drawFront(dt);
    }

    /* 背景層：光芒與光暈。用 lighter 疊加，每條光芒在碰到舞台邊緣時剛好淡到背景色，不會出現方形切邊 */
    _drawBack(t) {
      const o = this._o, c = this.back.getContext('2d'), I = this.intensity;
      c.globalCompositeOperation = 'source-over'; c.fillStyle = o.bg; c.fillRect(0, 0, this.W, this.H);
      if (I <= 0 || this.T.plain) return;
      const m = this._mouth();
      c.globalCompositeOperation = 'lighter';
      const cx = m.x, cy = m.y - o.size * 0.05, grow = ease.out(I);
      const edge = a => { const dx = Math.cos(a), dy = Math.sin(a); let d = Infinity;
        if (dx > 1e-6) d = Math.min(d, (this.W - cx) / dx); if (dx < -1e-6) d = Math.min(d, -cx / dx);
        if (dy > 1e-6) d = Math.min(d, (this.H - cy) / dy); if (dy < -1e-6) d = Math.min(d, -cy / dy); return d; };
      if (o.rays > 0) {
        const n = o.rays, w = Math.PI / n * 0.46, mid = mix(o.gold, '#000000', 0.32);
        for (let i = 0; i < n; i++) {
          const a = this.rot + i * Math.PI * 2 / n, ww = w * (i % 2 ? 0.62 : 1);
          const R = Math.max(1, Math.min(edge(a - ww), edge(a), edge(a + ww)) * grow);
          const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
          g.addColorStop(0, o.light); g.addColorStop(0.16, o.gold); g.addColorStop(0.55, mid); g.addColorStop(1, '#000000');
          c.fillStyle = g; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a - ww, a + ww); c.closePath(); c.fill();
        }
      }
      const gr = Math.max(1, Math.min(o.size * (0.62 + 0.05 * Math.sin(t * 2.6)), (this.H - cy) * 0.98, cx * 0.98, (this.W - cx) * 0.98) * grow);
      const g2 = c.createRadialGradient(cx, cy, 0, cx, cy, gr);
      g2.addColorStop(0, o.light); g2.addColorStop(0.35, mix(o.gold, '#000000', 0.7)); g2.addColorStop(1, '#000000');
      c.fillStyle = g2; c.beginPath(); c.arc(cx, cy, gr, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = 'source-over';
    }

    /* ── 粒子：星光、金幣、彩紙 ── */
    _spawnBurst() {
      const o = this._o, kind = this.T.items, conf = kind === 'confetti' || kind === 'slip' || kind === 'news', m = this._mouth();
      for (let i = 0; i < o.sparkles; i++) this._spark(false);
      if (kind === 'word') { for (let i = 0; i < o.coins; i++) this._word(false); return; }
      for (let i = 0; i < o.coins; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * (conf ? 2.2 : 1.5), v = o.size * (conf ? 2.2 + Math.random() * 2.2 : 2.4 + Math.random() * 1.6);
        this.items.push({ kind, x: m.x + (Math.random() - 0.5) * o.size * 0.4, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          r: o.size * (kind === 'slip' || kind === 'news' ? 0.05 + Math.random() * 0.025 : conf ? 0.03 + Math.random() * 0.02 : 0.045 + Math.random() * 0.02), ph: Math.random() * 6.28, spin: 8 + Math.random() * 8,
          col: CONFETTI[(Math.random() * CONFETTI.length) | 0], rot: Math.random() * 6.28, life: 0 });
      }
    }
    _spark(ambient) {
      const o = this._o, m = this._mouth();
      const a = ambient ? -Math.PI / 2 + (Math.random() - 0.5) * 0.9 : -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const v = ambient ? o.size * (0.35 + Math.random() * 0.5) : o.size * (1.6 + Math.random() * 2.6);
      const cols = [o.light, o.gold, '#FFFFFF', mix(o.gold, '#FFFFFF', 0.6)];
      this.parts.push({ x: m.x + (Math.random() - 0.5) * o.size * (ambient ? 0.7 : 0.5), y: m.y - (ambient ? 0 : 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: o.size * (ambient ? 0.02 + Math.random() * 0.025 : 0.025 + Math.random() * 0.045), col: cols[(Math.random() * cols.length) | 0], life: 0, max: ambient ? 1.6 + Math.random() : 0.9 + Math.random() * 0.9, tw: Math.random() * 6.28, g: ambient ? -0.15 : 1 });
    }
    /* 文字粒子（魔法書、農民曆）：往上飄、慢慢變小消失。文字來自 words 屬性，沒寫就用該圖形的預設 */
    _words() { const w = this._o.words; return w ? String(w).split(/[,，、\s]+/).filter(Boolean) : (this.T.words || []); }
    _word(ambient) {
      const o = this._o, m = this._mouth(), list = this._words();
      if (!list.length) return;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (ambient ? 0.7 : 2.0), v = o.size * (ambient ? 0.25 + Math.random() * 0.3 : 0.9 + Math.random() * 1.3);
      const idx = (Math.random() * list.length) | 0;
      this.items.push({ kind: 'word', txt: list[idx], x: m.x + (Math.random() - 0.5) * o.size * (ambient ? 0.8 : 0.5), y: m.y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: o.size * (0.085 + Math.random() * 0.05), col: o.wordColors ? o.wordColors[idx % o.wordColors.length] : CONFETTI[(Math.random() * CONFETTI.length) | 0],
        ph: Math.random() * 6.28, life: 0, max: 2.4 + Math.random() * 1.4 });
    }
    _drawFront(dt) {
      const o = this._o, c = this.front.getContext('2d');
      c.clearRect(0, 0, this.W, this.H);
      /* 星光：四角星，越接近生命終點越小（不用透明度） */
      this.parts = this.parts.filter(p => p.life < p.max);
      this.parts.forEach(p => {
        p.life += dt; p.vy += o.size * 2.2 * p.g * dt; p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.6, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = 1 - p.life / p.max, s = p.s * k * (0.75 + 0.25 * Math.sin(p.life * 18 + p.tw));
        if (s <= 0.3) return;
        c.fillStyle = p.col; c.beginPath();
        c.moveTo(p.x, p.y - s * 2); c.quadraticCurveTo(p.x, p.y, p.x + s * 2, p.y); c.quadraticCurveTo(p.x, p.y, p.x, p.y + s * 2);
        c.quadraticCurveTo(p.x, p.y, p.x - s * 2, p.y); c.quadraticCurveTo(p.x, p.y, p.x, p.y - s * 2); c.fill();
      });
      /* 金幣：拋物線落下，左右翻轉；顏色取 trim-color（寶箱、獎盃）或 gold（其他） */
      const gold = (o.type === 'chest' || o.type === 'trophy') ? o.trim : o.gold, dark = mix(gold, '#000000', 0.55), hi = mix(gold, '#FFFFFF', 0.45);
      this.items = this.items.filter(p => p.kind === 'word' ? p.life < p.max : p.y < this.H + 40);
      this.items.forEach(p => {
        p.life += dt;
        if (p.kind === 'word') {
          p.vx *= Math.pow(0.35, dt); p.vy = p.vy * Math.pow(0.35, dt) - o.size * 0.18 * dt;
          p.x += (p.vx + Math.sin(p.life * 3 + p.ph) * o.size * 0.12) * dt; p.y += p.vy * dt;
          const q = p.life / p.max, sc = q < 0.12 ? q / 0.12 : q > 0.7 ? Math.max(0, 1 - (q - 0.7) / 0.3) : 1;
          if (sc > 0.02) {
            c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(p.life * 2 + p.ph) * 0.2); c.scale(sc, sc);
            c.font = `800 ${p.r}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.lineWidth = p.r * 0.22; c.lineJoin = 'round'; c.strokeStyle = o.bg; c.strokeText(p.txt, 0, 0);
            c.fillStyle = p.col; c.fillText(p.txt, 0, 0); c.restore();
          }
          return;
        }
        if (p.kind === 'confetti' || p.kind === 'slip' || p.kind === 'news') {
          p.vy += o.size * 3.2 * dt; p.vx *= Math.pow(0.5, dt); p.vy = Math.min(p.vy, o.size * 1.1);
          p.x += (p.vx + Math.sin(p.life * 6 + p.ph) * o.size * 0.25) * dt; p.y += p.vy * dt; p.rot += dt * 5;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.max(0.15, Math.abs(Math.cos(p.life * 9 + p.ph))));
          if (p.kind === 'news') {
            /* 報紙：刊頭、照片、文字行 */
            c.fillStyle = '#F4F3EC'; c.fillRect(-p.r * 0.85, -p.r * 1.2, p.r * 1.7, p.r * 2.4);
            c.fillStyle = '#0C0D0C'; c.fillRect(-p.r * 0.7, -p.r * 1.05, p.r * 1.4, p.r * 0.3);
            c.fillStyle = p.col; c.fillRect(-p.r * 0.7, -p.r * 0.55, p.r * 0.62, p.r * 0.6);
            c.fillStyle = '#86877F';
            c.fillRect(0, -p.r * 0.5, p.r * 0.7, p.r * 0.13); c.fillRect(0, -p.r * 0.25, p.r * 0.7, p.r * 0.13); c.fillRect(0, 0, p.r * 0.7, p.r * 0.13);
            c.fillRect(-p.r * 0.7, p.r * 0.25, p.r * 1.4, p.r * 0.13); c.fillRect(-p.r * 0.7, p.r * 0.5, p.r * 1.4, p.r * 0.13); c.fillRect(-p.r * 0.7, p.r * 0.75, p.r * 0.95, p.r * 0.13);
          } else if (p.kind === 'slip') {
            c.fillStyle = '#F4F3EC'; c.fillRect(-p.r * 0.8, -p.r * 1.2, p.r * 1.6, p.r * 2.4);
            c.fillStyle = p.col; c.fillRect(-p.r * 0.8, -p.r * 0.95, p.r * 1.6, p.r * 0.45);
            c.fillStyle = '#86877F'; c.fillRect(-p.r * 0.55, -p.r * 0.1, p.r * 1.1, p.r * 0.18); c.fillRect(-p.r * 0.55, p.r * 0.35, p.r * 0.8, p.r * 0.18);
          } else { c.fillStyle = p.col; c.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); }
          c.restore();
          return;
        }
        p.vy += o.size * 6 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const sx = Math.max(0.12, Math.abs(Math.cos(p.ph + p.life * p.spin)));
        c.save(); c.translate(p.x, p.y); c.scale(sx, 1);
        if (p.kind === 'ingot') {
          const r = p.r * 1.4, path = () => {
            c.beginPath(); c.moveTo(-r * 1.3, -r * 0.2); c.quadraticCurveTo(-r * 1.3, -r * 0.95, -r * 0.8, -r * 0.75); c.quadraticCurveTo(0, -r * 0.1, r * 0.8, -r * 0.75);
            c.quadraticCurveTo(r * 1.3, -r * 0.95, r * 1.3, -r * 0.2); c.quadraticCurveTo(r * 1.1, r * 0.9, 0, r * 0.9); c.quadraticCurveTo(-r * 1.1, r * 0.9, -r * 1.3, -r * 0.2); c.closePath();
          };
          c.fillStyle = dark; c.save(); c.scale(1.12, 1.12); path(); c.fill(); c.restore();
          c.fillStyle = gold; path(); c.fill();
          c.fillStyle = hi; c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.55, r * 0.18, 0, 0, Math.PI * 2); c.fill();
        } else {
          c.fillStyle = dark; c.beginPath(); c.arc(0, 0, p.r * 1.12, 0, Math.PI * 2); c.fill();
          c.fillStyle = gold; c.beginPath(); c.arc(0, 0, p.r, 0, Math.PI * 2); c.fill();
          c.fillStyle = hi; c.beginPath(); c.arc(-p.r * 0.28, -p.r * 0.28, p.r * 0.32, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      });
    }
  }

  customElements.define('chest-prize', class extends HTMLElement {});
  customElements.define('treasure-chest', TreasureChest);
  window.TreasureChest = { types: Object.keys(TYPES), colors: PALETTE };

  /* 支援 <link-when event="done">：把完成事件登記到 link-when 的對照表。
     link-when.js 先載入或後載入都可以s */
  const reg = () => { const L = window.LinkWhen; if (L && L.doneEvents && !L.doneEvents['treasure-chest']) L.doneEvents['treasure-chest'] = 'treasure-chest:opened'; };
  reg(); customElements.whenDefined('link-when').then(reg);
})();