/* inbox-arrival.js：模擬收件匣收到新郵件的動畫。
   收件匣先顯示既有郵件，鈴鐺搖晃、未讀數加一，新郵件從列表頂端滑入並亮起，可加右上角通知卡；
   可選擇讓游標移過去點開新郵件，展開閱讀窗格。完結後可顯示或刪除指定元素，並支援 link-when。
   語意標籤：<inbox-arrival> <inbox-mail>
   單一檔案，CSS 內建，不使用 Shadow DOM，不需要任何外部資源，離線也能用。顏色一律實色，不使用透明度。
   畫面是自創的通用郵件程式，不模仿任何真實產品。 */
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

  if (customElements.get('inbox-arrival')) return;

  const PALETTE = { base:'#0C0D0C', shell:'#C6C7BD', vanilla:'#DBEDD8', yellow:'#E3D322', pink:'#FF91D7', red:'#EF6661', green:'#71CD76', blue:'#5DBAE8', indigo:'#778CE1', violet:'#B484E8', gray:'#86877F', key:'#51DBCF', calm:'#A3C4BC', quiet:'#8EA4DE', playful:'#FFA987', urgent:'#FF2E63', energetic:'#B6FF00', dreamy:'#C394CD', salmon:'#FFC88A', 'bg-alternative':'#2D2D2D' };
  const color = v => { if (!v) return ''; const t = String(v).trim(); return PALETTE[t.toLowerCase()] || t; };
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hex = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 1, 2].map(i => parseInt(h.slice(i * 2, i * 2 + 2), 16) || 0); };
  /* 兩個實色混合（k＝a 的比例），用來算深淺 */
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v * k + B[i] * (1 - k)).toString(16).padStart(2, '0')).join(''); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const first = s => Array.from(String(s).trim())[0] || '?';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const AVATAR = ['pink', 'blue', 'green', 'violet', 'playful', 'salmon', 'indigo', 'yellow', 'calm', 'dreamy'].map(c => PALETTE[c]);
  const hash = s => Array.from(String(s)).reduce((h, c) => (h * 31 + c.codePointAt(0)) >>> 0, 7);

  /* 設計尺寸：畫面先以 960×560 排版，再依實際寬度等比縮放 */
  const DW = 960, DH = 560, ROW = 62;
  /* 骨架列的長度（px 與 %），依序循環 */
  const SKEL_FROM = [96, 118, 82, 106, 90, 128, 100, 112];
  const SKEL_SUB = [62, 78, 55, 70, 86, 58, 66, 73];

  const I = {
    mail: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="2" y="5" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 6.5L10 11.5L17 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13.5 13.5L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    bell: '<svg viewBox="0 0 22 22" width="22" height="22"><path d="M11 3A6 6 0 0 0 5 9V12L3 15H19L17 12V9A6 6 0 0 0 11 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 17A2 2 0 0 0 13 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    inbox: '<svg viewBox="0 0 20 20" width="18" height="18"><rect x="2.5" y="3" width="15" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 12H7L8 13.5H12L13 12H17.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 20 20" width="18" height="18"><polygon points="10,2 12.5,7.5 18,8 13.9,12 15,17.5 10,15 5,17.5 6.1,12 2,8 7.5,7.5" fill="currentColor"/></svg>',
    starO: '<svg viewBox="0 0 20 20" width="18" height="18"><polygon points="10,2 12.5,7.5 18,8 13.9,12 15,17.5 10,15 5,17.5 6.1,12 2,8 7.5,7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M3 10L18 3L12 18L10 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    draft: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M3 17L3.5 13L13 3.5L16.5 7L7 16Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M5 6H15L13.8 17H6.2Z M3 6H17 M7.5 6V3H12.5V6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    clip: '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M13 6L7 12A2 2 0 0 0 10 15L16 9A3.5 3.5 0 0 0 11 3.9L5 9.9A5 5 0 0 0 12 17L17 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    pen: '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M3 17L3.5 13L13 3.5L16.5 7L7 16Z" fill="currentColor"/></svg>',
    cursor: '<svg viewBox="0 0 26 30" width="26" height="30"><path d="M2 2L2 23L7.5 17.5L11 26L15 23.5L11.5 15.5L19 15.5Z" fill="#F2F2EC" stroke="#0C0D0C" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };

  const STYLE = `
inbox-arrival{display:block;position:relative;max-width:100%;}
inbox-arrival > inbox-mail{display:none;}
inbox-arrival .ia-wrap{position:relative;overflow:hidden;border-radius:12px;width:100%;}
inbox-arrival .ia-stage{position:absolute;left:0;top:0;width:${DW}px;height:${DH}px;transform-origin:0 0;background:var(--ia-bg);color:var(--ia-text);overflow:hidden;line-height:1.5;user-select:none;-webkit-user-select:none;text-align:left;}
inbox-arrival .ia-stage *{box-sizing:border-box;}
inbox-arrival .ia-stage.ia-click{cursor:pointer;}
inbox-arrival .ia-stage svg{display:block;}
inbox-arrival .ia-top{position:absolute;left:0;top:0;right:0;height:56px;display:flex;align-items:center;gap:18px;padding:0 20px;}
inbox-arrival .ia-logo{display:flex;align-items:center;gap:10px;width:172px;flex:none;font-weight:800;font-size:1.1rem;color:var(--ia-strong);white-space:nowrap;overflow:hidden;}
inbox-arrival .ia-logo i{width:30px;height:30px;border-radius:8px;background:var(--ia-accent);color:var(--ia-bg);display:flex;align-items:center;justify-content:center;flex:none;}
inbox-arrival .ia-search{flex:1;height:38px;border-radius:19px;background:var(--ia-panel);color:var(--ia-dim);display:flex;align-items:center;gap:10px;padding:0 18px;font-size:0.9rem;}
inbox-arrival .ia-bell{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:var(--ia-text);transform-origin:50% 8px;flex:none;}
inbox-arrival .ia-badge{position:absolute;right:-3px;top:-1px;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:var(--ia-badge);color:var(--ia-bg);font-size:0.72rem;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;}
inbox-arrival .ia-badge.off{display:none;}
inbox-arrival .ia-me{width:36px;height:36px;border-radius:50%;background:var(--ia-me);color:var(--ia-bg);font-weight:800;font-size:0.95rem;display:flex;align-items:center;justify-content:center;flex:none;}
inbox-arrival .ia-side{position:absolute;left:0;top:56px;bottom:0;width:200px;padding:10px 12px 0 0;}
inbox-arrival .ia-compose{display:inline-flex;align-items:center;gap:10px;height:38px;padding:0 18px;margin:0 0 16px 12px;border-radius:12px;border:1px solid var(--ia-accent);color:var(--ia-accent);font-weight:700;font-size:0.95rem;}
inbox-arrival .ia-folder{display:flex;align-items:center;gap:12px;height:36px;padding:0 12px 0 20px;border-radius:0 18px 18px 0;font-size:0.92rem;color:var(--ia-text);}
inbox-arrival .ia-folder.on{background:var(--ia-sel);color:var(--ia-strong);font-weight:700;}
inbox-arrival .ia-folder b{margin-left:auto;font-size:0.8rem;font-weight:800;}
inbox-arrival .ia-folder b.off{display:none;}
inbox-arrival .ia-main{position:absolute;left:200px;top:56px;right:0;bottom:0;background:var(--ia-panel);border-radius:12px 0 0 0;overflow:hidden;}
inbox-arrival .ia-head{height:38px;display:flex;align-items:center;gap:12px;padding:0 18px;font-size:0.85rem;color:var(--ia-dim);border-bottom:1px solid var(--ia-line);}
inbox-arrival .ia-head strong{color:var(--ia-strong);font-weight:700;}
inbox-arrival .ia-list{position:absolute;left:0;right:0;top:38px;bottom:0;overflow:hidden;}
inbox-arrival .ia-row{height:${ROW}px;border-bottom:1px solid var(--ia-line);border-left:3px solid var(--ia-panel);background:var(--ia-panel);overflow:hidden;}
inbox-arrival .ia-in{height:${ROW - 1}px;display:flex;align-items:center;gap:12px;padding:0 18px 0 15px;}
inbox-arrival .ia-chk{width:16px;height:16px;border:2px solid var(--ia-dim);border-radius:3px;flex:none;}
inbox-arrival .ia-star{flex:none;color:var(--ia-dim);}
inbox-arrival .ia-star.on{color:${PALETTE.yellow};}
inbox-arrival .ia-av{width:32px;height:32px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.9rem;color:${PALETTE.base};}
inbox-arrival .ia-from{width:150px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.95rem;color:var(--ia-text);}
inbox-arrival .ia-sub{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.95rem;color:var(--ia-text);}
inbox-arrival .ia-sub span{color:var(--ia-dim);}
inbox-arrival .ia-clip{flex:none;color:var(--ia-dim);}
inbox-arrival .ia-time{flex:none;width:68px;text-align:right;font-size:0.8rem;color:var(--ia-dim);white-space:nowrap;}
inbox-arrival .ia-row.ia-unread{background:var(--ia-unread);border-left-color:var(--ia-accent);}
inbox-arrival .ia-row.ia-unread .ia-from,inbox-arrival .ia-row.ia-unread .ia-sub b{font-weight:800;color:var(--ia-strong);}
inbox-arrival .ia-row.ia-unread .ia-time{font-weight:700;color:var(--ia-strong);}
inbox-arrival .ia-row.ia-sel{background:var(--ia-sel);border-left-color:var(--ia-accent);}
inbox-arrival .ia-row .ia-bar{height:10px;border-radius:5px;background:var(--ia-skel);}
inbox-arrival .ia-row .ia-av.ia-bar{height:32px;border-radius:50%;}
inbox-arrival .ia-stage.ia-done .ia-row[data-i]{cursor:pointer;}
inbox-arrival .ia-read{position:absolute;top:0;right:0;bottom:0;width:62%;background:var(--ia-panel);border-left:3px solid var(--ia-bg);padding:22px 28px 28px 28px;overflow:auto;transform:translateX(102%);transition:transform .52s cubic-bezier(.2,.8,.3,1);}
inbox-arrival .ia-read.on{transform:none;}
inbox-arrival .ia-r-x{position:absolute;right:16px;top:16px;height:30px;padding:0 12px;border-radius:15px;border:1px solid var(--ia-line2);color:var(--ia-dim);font-size:0.8rem;display:flex;align-items:center;cursor:pointer;}
inbox-arrival .ia-r-sub{font-size:1.3rem;font-weight:800;color:var(--ia-strong);margin:0 90px 16px 0;line-height:1.5;}
inbox-arrival .ia-r-meta{display:flex;align-items:center;gap:12px;padding:0 0 16px 0;margin:0 0 18px 0;border-bottom:1px solid var(--ia-line);}
inbox-arrival .ia-r-meta .ia-av{width:38px;height:38px;font-size:1rem;}
inbox-arrival .ia-r-who{flex:1;min-width:0;font-size:0.9rem;color:var(--ia-text);}
inbox-arrival .ia-r-who b{color:var(--ia-strong);}
inbox-arrival .ia-r-who small{display:block;color:var(--ia-dim);font-size:0.8rem;}
inbox-arrival .ia-r-time{font-size:0.8rem;color:var(--ia-dim);white-space:nowrap;}
inbox-arrival .ia-r-body{font-size:0.95rem;line-height:1.8;color:var(--ia-text);user-select:text;-webkit-user-select:text;}
inbox-arrival .ia-r-body p{margin:0 0 12px 0;}
inbox-arrival .ia-r-att{display:inline-flex;align-items:center;gap:8px;margin:18px 0 0 0;padding:8px 16px;border-radius:10px;border:1px solid var(--ia-line2);color:var(--ia-text);font-size:0.85rem;}
inbox-arrival .ia-toast{position:absolute;right:20px;top:68px;width:300px;padding:12px 16px;border-radius:12px;background:var(--ia-toast);border:1px solid var(--ia-accent);display:flex;align-items:center;gap:12px;z-index:5;transform:translateX(330px);transition:transform .388s cubic-bezier(.2,.8,.3,1.1);}
inbox-arrival .ia-toast.on{transform:none;}
inbox-arrival .ia-toast .ia-t-txt{flex:1;min-width:0;}
inbox-arrival .ia-toast .ia-t-lab{font-size:0.72rem;color:var(--ia-accent);font-weight:800;letter-spacing:1px;}
inbox-arrival .ia-toast .ia-t-from{font-size:0.9rem;font-weight:800;color:var(--ia-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
inbox-arrival .ia-toast .ia-t-sub{font-size:0.82rem;color:var(--ia-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
inbox-arrival .ia-cursor{position:absolute;left:0;top:0;z-index:6;pointer-events:none;display:none;transform-origin:2px 2px;}
inbox-arrival .ia-cursor.on{display:block;}
inbox-arrival .ia-ripple{position:absolute;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;border:3px solid var(--ia-accent);z-index:5;pointer-events:none;}
inbox-arrival .ia-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);padding:6px 20px;border-radius:19px;background:var(--ia-bg);border:1px solid var(--ia-accent);color:var(--ia-accent);font-size:0.9rem;letter-spacing:2px;white-space:nowrap;pointer-events:none;z-index:7;animation:iaHint 1.6s ease-in-out infinite;}
inbox-arrival .ia-hint.off{display:none;}
inbox-arrival .ia-hint.ia-replay{pointer-events:auto;cursor:pointer;}
@keyframes iaHint{0%,100%{transform:translate(-50%,0);}50%{transform:translate(-50%,-5px);}}
`;
  const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);

  class InboxArrival extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => this._build(), { once: true });
      else this._build();
    }
    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      this._runId = (this._runId || 0) + 1; clearTimeout(this._toastT);
    }

    _opt() {
      const a = (n, d) => this.hasAttribute(n) ? this.getAttribute(n) : d;
      const on = n => this.hasAttribute(n) && this.getAttribute(n) !== 'false';
      return {
        width: clamp(num(a('width'), DW), 520, 1600), trigger: a('trigger', 'click'), delay: num(a('delay'), 300),
        interval: Math.max(600, num(a('interval'), 1200)), cursor: on('cursor'), open: on('open-mail') || on('cursor'),
        toast: on('toast'), replay: on('replay'), appName: a('app-name', 'Mailbox'), user: a('user', '我'),
        folder: a('folder-name', '收件匣'), filler: a('filler', 'auto'), unread: a('unread', ''),
        bg: color(a('bg', 'base')), panel: color(a('panel', 'bg-alternative')), accent: color(a('accent', 'key')),
        text: color(a('text-color', 'shell')), badge: color(a('badge-color', 'red')), me: color(a('user-color', 'violet')),
        hint: a('hint', '點擊收信'), replayHint: a('replay-hint', '再收一次'),
        reveal: a('reveal-targets', ''), remove: a('remove-targets', '')
      };
    }

    /* 讀取 <inbox-mail>：沒有 new 的是既有郵件，有 new 的依原始碼順序抵達 */
    _mails() {
      const on = (m, n) => m.hasAttribute(n) && m.getAttribute(n) !== 'false';
      const list = [...this.querySelectorAll(':scope > inbox-mail')].map(m => {
        const isNew = on(m, 'new'), att = m.getAttribute('attach');
        return {
          isNew, from: m.getAttribute('from') || '寄件人', email: m.getAttribute('email') || '',
          subject: m.getAttribute('subject') || '（無主旨）', time: m.getAttribute('time') || (isNew ? '剛剛' : ''),
          html: m.innerHTML.trim(), text: m.textContent.replace(/\s+/g, ' ').trim(),
          unread: isNew || on(m, 'unread'), star: on(m, 'star'),
          attach: att === null || att === 'false' ? '' : (att.trim() && att !== 'true' ? att.trim() : '附件'),
          color: color(m.getAttribute('color'))
        };
      });
      if (!list.some(m => m.isNew)) {
        console.warn('[inbox-arrival] 沒有加上 new 的 <inbox-mail>，改用一封預設的新郵件');
        list.push({ isNew: true, from: '系統通知', email: '', subject: '你有一封新郵件', time: '剛剛', html: '', text: '', unread: true, star: false, attach: '', color: '' });
      }
      return list;
    }

    _build() {
      const o = this._o = this._opt();
      this._data = this._mails();
      this.state = 'ready'; this._runId = 0; this._done = { shown: [], removed: [] };
      this.style.width = o.width + 'px';
      const v = {
        bg: o.bg, panel: o.panel, accent: o.accent, text: o.text, badge: o.badge, me: o.me,
        strong: mix(o.text, '#FFFFFF', 0.62), dim: mix(o.text, o.panel, 0.62), line: mix(o.text, o.panel, 0.12), line2: mix(o.text, o.panel, 0.3),
        unread: mix(o.text, o.panel, 0.07), sel: mix(o.accent, o.panel, 0.2), flash: mix(o.accent, o.panel, 0.55),
        skel: mix(o.text, o.panel, 0.18), toast: mix(o.text, o.panel, 0.1)
      };
      this._flash = v.flash; this._unreadBg = v.unread;
      Object.keys(v).forEach(k => this.style.setProperty('--ia-' + k, v[k]));

      const wrap = this.wrap = document.createElement('div'); wrap.className = 'ia-wrap';
      const stage = this.stage = document.createElement('div'); stage.className = 'ia-stage';
      wrap.append(stage); this.append(wrap);
      this._render();

      stage.addEventListener('click', e => this._click(e));
      this._fit();
      if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this._fit()); this._ro.observe(this); }
      if (o.trigger === 'auto') {
        this._io = new IntersectionObserver(es => {
          if (es.some(e => e.isIntersecting) && this.state === 'ready') { this._io.disconnect(); setTimeout(() => this.play(), o.delay); }
        }, { threshold: 0.6 });
        this._io.observe(wrap);
      }
    }

    /* 依實際寬度等比縮放 */
    _fit() {
      const w = this.clientWidth || this._o.width;
      this._s = w / DW;
      this.wrap.style.height = Math.round(DH * this._s) + 'px';
      this.stage.style.transform = `scale(${this._s})`;
    }

    _av(m, cls = 'ia-av') {
      const c = m.color || AVATAR[hash(m.from) % AVATAR.length];
      return `<div class="${cls}" style="background:${c}">${esc(first(m.from))}</div>`;
    }

    /* 整個畫面重畫一次（初次建立與 reset 時） */
    _render() {
      const o = this._o, d = this._data;
      this._unread = o.unread !== '' ? Math.max(0, Math.round(num(o.unread, 0))) : d.filter(m => !m.isNew && m.unread).length;
      this._total = d.filter(m => !m.isNew).length;
      const folders = [['inbox', o.folder, true], ['star', '已加星號'], ['send', '寄件備份'], ['draft', '草稿'], ['trash', '垃圾桶']];
      this.stage.innerHTML = `
<div class="ia-top">
  <div class="ia-logo"><i>${I.mail}</i><span>${esc(o.appName)}</span></div>
  <div class="ia-search">${I.search}<span>搜尋郵件</span></div>
  <div class="ia-bell">${I.bell}<span class="ia-badge"></span></div>
  <div class="ia-me">${esc(first(o.user))}</div>
</div>
<div class="ia-side">
  <div class="ia-compose">${I.pen}<span>撰寫</span></div>
  ${folders.map(f => `<div class="ia-folder${f[2] ? ' on' : ''}">${I[f[0] === 'star' ? 'starO' : f[0]]}<span>${esc(f[1])}</span>${f[2] ? '<b class="ia-fcount"></b>' : ''}</div>`).join('')}
</div>
<div class="ia-main">
  <div class="ia-head"><span class="ia-chk"></span><strong>${esc(o.folder)}</strong><span class="ia-total"></span></div>
  <div class="ia-list"></div>
  <div class="ia-read"></div>
</div>
<div class="ia-toast"></div>
<div class="ia-cursor">${I.cursor}</div>
<div class="ia-hint"></div>`;
      const q = s => this.stage.querySelector(s);
      this.list = q('.ia-list'); this.read = q('.ia-read'); this.toastEl = q('.ia-toast'); this.cursor = q('.ia-cursor');
      this.bell = q('.ia-bell'); this.badge = q('.ia-badge'); this.fcount = q('.ia-fcount'); this.totalEl = q('.ia-total'); this.hintEl = q('.ia-hint');
      d.forEach((m, i) => { if (!m.isNew) this.list.append(this._row(m, i)); });
      const fill = o.filler === 'auto' ? Math.max(0, 8 - this._total) : Math.max(0, Math.round(num(o.filler, 0)));
      for (let i = 0; i < fill; i++) this.list.append(this._skel(i));
      this._counts();
      this.stage.classList.remove('ia-done');
      this.stage.classList.toggle('ia-click', o.trigger === 'click');
      this.hintEl.className = 'ia-hint' + (o.hint && o.trigger === 'click' ? '' : ' off');
      this.hintEl.textContent = o.hint;
    }

    _row(m, i) {
      const r = document.createElement('div');
      r.className = 'ia-row' + (m.unread ? ' ia-unread' : ''); r.dataset.i = i;
      const pre = m.text ? `<span>　${esc(m.text)}</span>` : '';
      r.innerHTML = `<div class="ia-in"><span class="ia-chk"></span><span class="ia-star${m.star ? ' on' : ''}">${m.star ? I.star : I.starO}</span>${this._av(m)}<span class="ia-from">${esc(m.from)}</span><span class="ia-sub"><b>${esc(m.subject)}</b>${pre}</span>${m.attach ? `<span class="ia-clip">${I.clip}</span>` : ''}<span class="ia-time">${esc(m.time)}</span></div>`;
      return r;
    }
    _skel(i) {
      const r = document.createElement('div'); r.className = 'ia-row ia-skel';
      const f = SKEL_FROM[i % SKEL_FROM.length], s = SKEL_SUB[i % SKEL_SUB.length];
      r.innerHTML = `<div class="ia-in"><span class="ia-chk"></span><span class="ia-star">${I.starO}</span><div class="ia-av ia-bar"></div><span class="ia-from"><div class="ia-bar" style="width:${f}px"></div></span><span class="ia-sub"><div class="ia-bar" style="width:${s}%"></div></span><span class="ia-time"><div class="ia-bar" style="width:36px;margin-left:auto"></div></span></div>`;
      return r;
    }
    _counts() {
      const n = this._unread;
      this.badge.textContent = n > 99 ? '99+' : n; this.badge.classList.toggle('off', !n);
      this.fcount.textContent = n > 999 ? '999+' : n; this.fcount.classList.toggle('off', !n);
      this.totalEl.textContent = `共 ${this._total} 封`;
    }

    /* ── 播放 ── */
    async play() {
      if (!this._o || this.state !== 'ready') return;
      const o = this._o, run = ++this._runId, alive = () => run === this._runId;
      this.state = 'playing'; this.hintEl.classList.add('off'); this.stage.classList.remove('ia-click');
      this.dispatchEvent(new CustomEvent('inbox-arrival:start', { bubbles: true }));
      const news = this._data.map((m, i) => [m, i]).filter(x => x[0].isNew);
      let lastRow = null, lastIdx = -1;
      for (let k = 0; k < news.length; k++) {
        const [m, i] = news[k];
        this._ring();
        await wait(200); if (!alive()) return;
        lastRow = this._arrive(m, i); lastIdx = i;
        this.dispatchEvent(new CustomEvent('inbox-arrival:arrive', { bubbles: true, detail: { index: k, from: m.from, subject: m.subject } }));
        if (k < news.length - 1) { await wait(o.interval - 200); if (!alive()) return; }
      }
      await wait(o.open ? 900 : 1600); if (!alive()) return;
      if (o.open) {
        if (o.cursor) { await this._point(lastRow); if (!alive()) return; }
        else { lastRow.animate([{ transform: 'none' }, { transform: 'scale(.985)' }, { transform: 'none' }], { duration: 288 }); await wait(288); if (!alive()) return; }
        this._openMail(lastIdx);
        await wait(588); if (!alive()) return;
      }
      this._finish();
    }
    /* link-when 的 do="play"（預設）會呼叫 play() */
    start() { this.play(); }

    _ring() {
      this.bell.animate([
        { transform: 'rotate(0deg)' }, { transform: 'rotate(-18deg)' }, { transform: 'rotate(15deg)' }, { transform: 'rotate(-12deg)' },
        { transform: 'rotate(9deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(0deg)' }
      ], { duration: 588, easing: 'ease-out' });
    }
    _arrive(m, i) {
      const row = this._row(m, i);
      this.list.prepend(row);
      row.animate([{ height: '0px' }, { height: ROW + 'px' }], { duration: 588, easing: 'cubic-bezier(.2,.8,.3,1)' });
      row.firstChild.animate([{ transform: 'translateX(-36px)' }, { transform: 'none' }], { duration: 688, easing: 'cubic-bezier(.2,.8,.3,1)' });
      row.animate([{ backgroundColor: this._flash }, { backgroundColor: this._flash, offset: 0.3 }, { backgroundColor: this._unreadBg }], { duration: 1600, easing: 'ease-out' });
      this._unread++; this._total++; this._counts();
      this.badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.38)' }, { transform: 'scale(1)' }], { duration: 388, easing: 'ease-out' });
      if (this._o.toast) this._toast(m);
      return row;
    }
    _toast(m) {
      const t = this.toastEl;
      t.innerHTML = `${this._av(m)}<div class="ia-t-txt"><div class="ia-t-lab">新郵件</div><div class="ia-t-from">${esc(m.from)}</div><div class="ia-t-sub">${esc(m.subject)}</div></div>`;
      if (t.classList.contains('on')) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 288 });
      t.classList.add('on');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => t.classList.remove('on'), 2800);
    }
    /* 游標從右下角移到信件上，按下，出現點擊波紋 */
    async _point(row) {
      const run = this._runId, s = this._s || 1, sr = this.stage.getBoundingClientRect(), rr = row.getBoundingClientRect();
      const x = (rr.left - sr.left) / s + 260, y = (rr.top - sr.top) / s + ROW / 2;
      const c = this.cursor; c.classList.add('on');
      const from = `translate(${DW - 120}px, ${DH - 60}px)`, to = `translate(${x}px, ${y}px)`;
      c.animate([{ transform: from }, { transform: to }], { duration: 788, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
      await wait(888); if (run !== this._runId) return;
      c.animate([{ transform: to }, { transform: to + ' scale(.85)' }, { transform: to }], { duration: 188, fill: 'forwards' });
      row.classList.add('ia-sel');
      const rp = document.createElement('div'); rp.className = 'ia-ripple'; rp.style.left = x + 'px'; rp.style.top = y + 'px';
      this.stage.append(rp);
      rp.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.8)' }], { duration: 388, easing: 'ease-out' }).onfinish = () => rp.remove();
      await wait(288);
    }
    /* 在閱讀窗格打開第 i 封信，並標為已讀 */
    _openMail(i) {
      const m = this._data[i]; if (!m) return;
      clearTimeout(this._toastT); this.toastEl.classList.remove('on');
      const row = this.list.querySelector(`.ia-row[data-i="${i}"]`);
      this.list.querySelectorAll('.ia-sel').forEach(r => r.classList.remove('ia-sel'));
      if (row) {
        row.getAnimations().forEach(a => a.cancel());
        if (row.classList.contains('ia-unread')) { row.classList.remove('ia-unread'); this._unread = Math.max(0, this._unread - 1); this._counts(); }
        row.classList.add('ia-sel');
      }
      const body = m.html || (m.text ? esc(m.text) : '<span style="color:var(--ia-dim)">（沒有內文）</span>');
      this.read.innerHTML = `<div class="ia-r-x">關閉</div><div class="ia-r-sub">${esc(m.subject)}</div>
<div class="ia-r-meta">${this._av(m)}<div class="ia-r-who"><b>${esc(m.from)}</b>${m.email ? ` &lt;${esc(m.email)}&gt;` : ''}<small>寄給 ${esc(this._o.user)}</small></div><div class="ia-r-time">${esc(m.time)}</div></div>
<div class="ia-r-body">${body}</div>${m.attach ? `<div class="ia-r-att">${I.clip}<span>${esc(m.attach)}</span></div>` : ''}`;
      this.read.scrollTop = 0;
      this.read.classList.add('on');
    }
    _closeMail() {
      this.read.classList.remove('on');
      this.list.querySelectorAll('.ia-sel').forEach(r => r.classList.remove('ia-sel'));
    }

    _finish() {
      this.state = 'done'; this.stage.classList.add('ia-done');
      const r = this._runTargets();
      if (this._o.replay && this._o.replayHint) {
        this.hintEl.className = 'ia-hint ia-replay'; this.hintEl.textContent = this._o.replayHint;
      }
      this.dispatchEvent(new CustomEvent('inbox-arrival:done', { bubbles: true, detail: r }));
    }

    _click(e) {
      const o = this._o;
      if (this.state === 'ready') { if (o.trigger === 'click') this.play(); return; }
      if (this.state !== 'done') return;
      if (e.target.closest('.ia-replay')) { this.reset(); this.play(); return; }
      if (e.target.closest('.ia-r-x')) { this._closeMail(); return; }
      const row = e.target.closest('.ia-row[data-i]');
      if (row) this._openMail(+row.dataset.i);
    }

    reset() {
      if (!this._o) return;
      this._runId++; clearTimeout(this._toastT);
      this._undoTargets();
      this.state = 'ready';
      this._render();
      this.dispatchEvent(new CustomEvent('inbox-arrival:reset', { bubbles: true }));
    }
    get done() { return this.state === 'done'; }

    /* ── 動畫完結後：顯示、刪除指定元素。寫 id 可省略 #，也可以寫完整選擇器（如 .tip） ── */
    _targets(list) {
      return String(list || '').split(',').map(s => s.trim()).filter(Boolean).flatMap(s => {
        const sel = /^[#.\[]/.test(s) || /[\s>:~+]/.test(s) ? s : '#' + s;
        try {
          const found = [...document.querySelectorAll(sel)];
          if (!found.length) console.warn(`[inbox-arrival] 找不到「${s}」`);
          return found;
        } catch (e) { console.warn(`[inbox-arrival] 無效的選擇器「${s}」`); return []; }
      });
    }
    _runTargets() {
      const o = this._o, shown = [], removed = [];
      this._targets(o.reveal).forEach(el => {
        shown.push({ el, vis: uivSave(el) });
        uivShow(el);
        if (el.animate) el.animate([{ transform: 'translateY(16px) scale(.97)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
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
  }

  customElements.define('inbox-mail', class extends HTMLElement {});
  customElements.define('inbox-arrival', InboxArrival);
  window.InboxArrival = { colors: PALETTE };

  /* 支援 <link-when event="done">：把完成事件登記到 link-when 的對照表。
     link-when.js 先載入或後載入都可以 */
  const reg = () => { const L = window.LinkWhen; if (L && L.doneEvents && !L.doneEvents['inbox-arrival']) L.doneEvents['inbox-arrival'] = 'inbox-arrival:done'; };
  reg(); customElements.whenDefined('link-when').then(reg);
})();
