/* treasure-chest.js v1.3：獎勵開啟動畫。四種圖形（type）：chest 寶箱、trophy 獎盃、gift 禮物盒、gacha 轉蛋機。
   共用：搖晃、金色光芒、星光、噴出物、獎品升起；動畫完結後可顯示或刪除指定元素（reveal-targets、remove-targets）。
   語意標籤：<treasure-chest> <chest-prize>
   單一檔案，CSS 內建，不使用 Shadow DOM，不需要任何外部資源。光芒用實色漸層過渡到 bg 背景色，不使用透明度。 */
(() => {
  'use strict';
  if (customElements.get('treasure-chest')) return;

  const PALETTE = { base:'#0C0D0C', shell:'#C6C7BD', vanilla:'#DBEDD8', yellow:'#E3D322', pink:'#FF91D7', red:'#EF6661', green:'#71CD76', blue:'#5DBAE8', indigo:'#778CE1', violet:'#B484E8', gray:'#86877F', key:'#51DBCF', calm:'#A3C4BC', quiet:'#8EA4DE', playful:'#FFA987', urgent:'#FF2E63', energetic:'#B6FF00', dreamy:'#C394CD', salmon:'#FFC88A', 'bg-alternative':'#3B2A20' };
  const color = v => { if (!v) return ''; const t = String(v).trim(); return PALETTE[t.toLowerCase()] || t; };
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const hex = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); };
  /* 兩個實色混合（k＝a 的比例），用來算明暗 */
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v * k + B[i] * (1 - k)).toString(16).padStart(2, '0')).join(''); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = { out: t => 1 - Math.pow(1 - t, 3), back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, inout: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
  const NS = 'http://www.w3.org/2000/svg';
  const CONFETTI = ['yellow', 'pink', 'key', 'green', 'blue', 'violet', 'playful', 'salmon', 'energetic'].map(c => PALETTE[c]);

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

  /* ═════════ 四種圖形：預設色、SVG、開啟動作、光芒出口 ═════════
     座標：viewBox 0 -60 200 230，寬 200，底部在 y=166。
     u：搖晃結束後經過的秒數（搖晃期間與待機為負數）；burst：光芒在 u 的哪一刻噴出；rattle：搖晃時的震動量（0 到 1） */
  const TYPES = {
    /* ── 寶箱（與 v1.2 完全相同） ── */
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
    }
  };

  class TreasureChest extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      else this._build();
    }
    disconnectedCallback() { if (this._io) this._io.disconnect(); cancelAnimationFrame(this._raf); this._raf = 0; }

    /* shake：0 到 1，越大搖得越明顯；舊寫法 true 等同 0.5，false 等同 0 */
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
        rays: Math.max(0, Math.round(num(a('rays'), 14))), raySpeed: num(a('ray-speed'), 10),
        sparkles: Math.max(0, num(a('sparkles'), 80)), coins: Math.max(0, num(a('coins'), T.count)),
        ambient: a('ambient', 'true') !== 'false', shake: this._shakeVal(a('shake', '0.5')),
        hint: a('hint', T.hint), replay: this.hasAttribute('replay'),
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

    /* ── 公開方法 ── */
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
        shown.push({ el, hidden: el.hidden, display: el.style.display });
        el.hidden = false;
        if (el.style.display === 'none') el.style.display = '';
        if (getComputedStyle(el).display === 'none') el.style.display = 'block';
        if (el.animate) el.animate([{ transform: 'translateY(14px) scale(.97)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
      });
      this._targets(o.remove).forEach(el => { if (!el.parentNode) return; removed.push({ el, parent: el.parentNode, next: el.nextSibling }); el.remove(); });
      this._done = { shown, removed };
      return { revealed: shown.map(x => x.el), removed: removed.map(x => x.el) };
    }
    /* reset() 時還原：顯示過的再藏起來，刪除過的放回原位 */
    _undoTargets() {
      const d = this._done || { shown: [], removed: [] };
      d.shown.forEach(x => { x.el.hidden = x.hidden; x.el.style.display = x.display; });
      d.removed.slice().reverse().forEach(x => { x.parent.insertBefore(x.el, x.next && x.next.parentNode === x.parent ? x.next : null); });
      this._done = { shown: [], removed: [] };
    }

    /* ── 動畫 ── */
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
      const v = u - T.burst;
      if (v >= 0) {
        if (!this._burst) { this._burst = true; this._spawnBurst(); }
        const pu = Math.max(0, v - 0.24), pk = pu < 0.55 ? ease.back(pu / 0.55) : 1, rise = ease.out(Math.min(1, pu / 0.7));
        const m = this._mouth(), top = m.y - o.size * (0.18 + 0.52 * rise);
        this.prize.style.left = m.x + 'px'; this.prize.style.top = top + 'px';
        this.prize.style.transform = `translate(-50%,-50%) scale(${Math.max(0, pk)})`;
        this.intensity = Math.min(1, (v + 0.06) / 0.5);
        if (this.state === 'opening' && v > 1.24) {
          this.state = 'open';
          const res = this._runTargets();
          this.dispatchEvent(new CustomEvent('treasure-chest:opened', { bubbles: true, detail: Object.assign({ type: o.type }, res) }));
        }
        if (o.ambient && Math.random() < dt * 9) this._spark(true);
      }
      this.rot += dt * o.raySpeed * Math.PI / 180;
      this._drawBack(t);
      this._drawFront(dt);
    }

    /* 背景層：光芒與光暈。用 lighter 疊加，每條光芒在碰到舞台邊緣時剛好淡到背景色，不會出現方形切邊 */
    _drawBack(t) {
      const o = this._o, c = this.back.getContext('2d'), I = this.intensity;
      c.globalCompositeOperation = 'source-over'; c.fillStyle = o.bg; c.fillRect(0, 0, this.W, this.H);
      if (I <= 0) return;
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
      const o = this._o, kind = this.T.items, conf = kind === 'confetti', m = this._mouth();
      for (let i = 0; i < o.sparkles; i++) this._spark(false);
      for (let i = 0; i < o.coins; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * (conf ? 2.2 : 1.5), v = o.size * (conf ? 2.2 + Math.random() * 2.2 : 2.4 + Math.random() * 1.6);
        this.items.push({ kind, x: m.x + (Math.random() - 0.5) * o.size * 0.4, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          r: o.size * (conf ? 0.03 + Math.random() * 0.02 : 0.045 + Math.random() * 0.02), ph: Math.random() * 6.28, spin: 8 + Math.random() * 8,
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
      this.items = this.items.filter(p => p.y < this.H + 40);
      this.items.forEach(p => {
        p.life += dt;
        if (p.kind === 'confetti') {
          /* 彩紙：先衝高，再像紙片一樣左右飄落 */
          p.vy += o.size * 3.2 * dt; p.vx *= Math.pow(0.5, dt); p.vy = Math.min(p.vy, o.size * 1.1);
          p.x += (p.vx + Math.sin(p.life * 6 + p.ph) * o.size * 0.25) * dt; p.y += p.vy * dt; p.rot += dt * 5;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.max(0.15, Math.abs(Math.cos(p.life * 9 + p.ph))));
          c.fillStyle = p.col; c.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9); c.restore();
          return;
        }
        p.vy += o.size * 6 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const sx = Math.max(0.12, Math.abs(Math.cos(p.ph + p.life * p.spin)));
        c.save(); c.translate(p.x, p.y); c.scale(sx, 1);
        c.fillStyle = dark; c.beginPath(); c.arc(0, 0, p.r * 1.12, 0, Math.PI * 2); c.fill();
        c.fillStyle = gold; c.beginPath(); c.arc(0, 0, p.r, 0, Math.PI * 2); c.fill();
        c.fillStyle = hi; c.beginPath(); c.arc(-p.r * 0.28, -p.r * 0.28, p.r * 0.32, 0, Math.PI * 2); c.fill();
        c.restore();
      });
    }
  }

  customElements.define('chest-prize', class extends HTMLElement {});
  customElements.define('treasure-chest', TreasureChest);
  window.TreasureChest = { types: Object.keys(TYPES), colors: PALETTE };

  /* 支援 <link-when event="done">：把完成事件登記到 link-when 的對照表。
     link-when.js 先載入或後載入都可以（後載入時，等它定義完再登記，仍早於它綁定事件） */
  const reg = () => { const L = window.LinkWhen; if (L && L.doneEvents && !L.doneEvents['treasure-chest']) L.doneEvents['treasure-chest'] = 'treasure-chest:opened'; };
  reg(); customElements.whenDefined('link-when').then(reg);
})();
