/*! ui-opener.js v0.2.2
 *  課程片頭動畫元件（夜間城市與捷運）。語意標籤 <ui-opener>，不使用 Shadow DOM，CSS 由本檔自動注入。
 *  建立日期：11-19-26
 *  v0.2.2：捷運車廂縮小 5%；月亮表面加上弱陰影與坑洞（皆為實色，不用透明度）。
 *  v0.2.1：月亮與捷運幾乎同時出現；車流依車道有快有慢；修正轎車車頭方向（原本車頭朝後）。
 *  v0.2.0：移除火山與書桌場景；高架橋加入轉彎，車廂沿彎道有遠近與旋轉變化；
 *          高架橋下新增雙向車流（公車、卡車、轎車、機車），可用屬性設定數量。
 *  全程不使用透明度（opacity、rgba），消失一律以縮小或遮罩表現。
 */
(function () {
  'use strict';
  if (customElements.get('ui-opener')) return;

  var COLORS = {
    background: '#0C0D0C', base: '#0C0D0C', 'bg-alternative': '#2D2D2D',
    shell: '#C6C7BD', vanilla: '#DBEDD8', yellow: '#E3D322', pink: '#FF91D7', red: '#EF6661',
    green: '#71CD76', blue: '#5DBAE8', indigo: '#778CE1', violet: '#B484E8', gray: '#86877F',
    key: '#51DBCF', calm: '#A3C4BC', quiet: '#8EA4DE', playful: '#FFA987', urgent: '#FF2E63',
    energetic: '#B6FF00', dreamy: '#C394CD', salmon: '#FFC88A'
  };
  var FLOOR = '#242424'; // RGB(36,36,36)，只當背景上層區域底色
  var uid = 0;

  function col(v, d) {
    if (v === null || v === undefined || v === '') return d;
    v = String(v).trim();
    return COLORS[v] || v;
  }
  function size(v, d) {
    if (v === null || v === '') return d;
    return /^[\d.]+$/.test(v) ? v + 'rem' : v;
  }
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  /* ========== 軌道幾何：遠近與彎道 ========== */
  // 透視：地平線 y = HZ，軌道頂面在 y = HZ + k * KY（k = 1 為最近，y = 796）
  var HZ = 520, KY = 276, DECK = 34, PIL = 161;
  function kOf(y) { var k = (y - HZ) / KY; return k < 0.08 ? 0.08 : (k > 1 ? 1 : k); }
  var CURVE = [[-200, 540], [0, 540], [120, 796], [500, 796]];
  function bez(t) {
    var u = 1 - t, P = CURVE;
    return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]];
  }
  function makeTrack() {
    var pts = [[-3600, 540], [-1200, 540], [-200, 540]], i, N = 90;
    for (i = 1; i <= N; i++) pts.push(bez(i / N));
    pts.push([1200, 796]); pts.push([2400, 796]);
    var w = [0];
    for (i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      var km = (kOf(pts[i - 1][1]) + kOf(pts[i][1])) / 2;
      w.push(w[i - 1] + Math.sqrt(dx * dx + dy * dy) / km); // 世界長度 = 螢幕長度 / 縮放
    }
    function at(wd) {
      if (wd <= 0) wd = 0;
      if (wd >= w[w.length - 1]) wd = w[w.length - 1] - 1e-6;
      var lo = 0, hi = w.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (w[m] <= wd) lo = m; else hi = m; }
      var t = (wd - w[lo]) / (w[hi] - w[lo]);
      var x = pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, y = pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t;
      var a = Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]) * 180 / Math.PI;
      return { x: x, y: y, a: a, k: kOf(y) };
    }
    return { pts: pts, w: w, at: at, wStart: w[2], wEnd: w[2 + N] + 980 /* 前車停在 x = 1480 */ };
  }

  /* ========== 車輛（側視、朝右、原點在左下輪底） ========== */
  function wheel(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--uo-bg)" stroke="var(--uo-gray)" stroke-width="3.5"/>';
  }
  var VEH = {
    scooter: function () {
      return { w: 44, svg: '<g transform="scale(.85)">' +
        wheel(9, -9, 9) + wheel(39, -9, 9) +
        '<rect x="4" y="-30" width="20" height="10" rx="4" fill="var(--uo-gray)"/>' +
        '<rect x="20" y="-20" width="16" height="6" rx="3" fill="var(--uo-gray)"/>' +
        '<path d="M34 -14 L36 -38 L41 -38 L41 -14Z" fill="var(--uo-gray)"/>' +
        '<polygon points="13,-52 23,-54 27,-32 14,-30" fill="var(--uo-shell)"/>' +
        '<polyline points="16,-31 30,-26 32,-14" fill="none" stroke="var(--uo-shell)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="22" y1="-48" x2="38" y2="-41" stroke="var(--uo-shell)" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="34" y="-43" width="14" height="4" rx="2" fill="var(--uo-shell)"/>' +
        '<circle cx="19" cy="-62" r="6.5" fill="var(--uo-accent)"/>' +
        '<circle cx="47" cy="-33" r="3.2" fill="var(--uo-spark)"/></g>' };
    },
    car: function (color, taxi) {
      return { w: 80, svg:
        '<path d="M0 -9 L0 -16 Q1 -20 10 -20 L16 -20 Q20 -30 28 -31 L46 -31 Q54 -31 62 -21 L74 -19 Q80 -17 80 -9Z" fill="' + color + '"/>' +
        '<path d="M21 -21 L25 -28 L32 -28 L32 -21Z M36 -28 L46 -28 Q51 -28 57 -21 L36 -21Z" fill="var(--uo-bg)"/>' +
        wheel(16, -8, 7.5) + wheel(62, -8, 7.5) +
        '<rect x="77" y="-17" width="3" height="4" fill="var(--uo-spark)"/>' +
        (taxi ? '<rect x="30" y="-36" width="10" height="5" rx="1" fill="var(--uo-spark)"/>' : '') };
    },
    bus: function () {
      var s = '<rect x="0" y="-56" width="160" height="46" rx="8" fill="var(--uo-accent)"/>', i;
      for (i = 0; i < 5; i++) s += '<rect x="' + (8 + i * 20) + '" y="-48" width="16" height="17" rx="2" fill="var(--uo-bg)"/>';
      s += '<rect x="112" y="-48" width="14" height="34" rx="2" fill="var(--uo-bg)"/>' +
        '<rect x="132" y="-50" width="22" height="26" rx="3" fill="var(--uo-bg)"/>' +
        '<rect x="0" y="-22" width="160" height="4" fill="var(--uo-shell)"/>' +
        wheel(30, -9, 9) + wheel(126, -9, 9) +
        '<rect x="156" y="-18" width="4" height="6" fill="var(--uo-spark)"/>';
      return { w: 162, svg: s };
    },
    truck: function () {
      return { w: 142, svg:
        '<rect x="0" y="-60" width="94" height="48" rx="4" fill="var(--uo-gray)"/>' +
        '<rect x="0" y="-34" width="94" height="4" fill="var(--uo-shell)"/>' +
        '<path d="M98 -12 L98 -50 L124 -50 L138 -30 L140 -12Z" fill="var(--uo-shell)"/>' +
        '<path d="M112 -46 L123 -46 L133 -32 L112 -32Z" fill="var(--uo-bg)"/>' +
        wheel(20, -9, 9) + wheel(74, -9, 9) + wheel(122, -9, 9) +
        '<rect x="137" y="-20" width="3" height="5" fill="var(--uo-spark)"/>' };
    }
  };

  /* ========== 場景 ========== */
  var TITLE_Y = 20, TRAIN_T = 3.2, ENTER_AT = 0.5, TRAIN_SCALE = 0.95;

  function buildScene(el, id) {
    var r = rng(7), h = '', i;
    var track = makeTrack();
    var accent = 'var(--uo-accent)';

    // 星與月
    for (i = 0; i < 16; i++) {
      h += '<circle class="uo-x uo-star" cx="' + f(r() * 1500) + '" cy="' + f(r() * 260) + '" r="' + f(2 + r() * 2) +
        '" fill="var(--uo-gray)" style="--t:' + f(2.4 + r() * 2.6) + 's;--d:-' + f(r() * 4) + 's"/>';
    }
    h += '<clipPath id="uo-mc' + id + '"><circle cx="1700" cy="170" r="56"/></clipPath>' +
      '<g class="uo-x uo-pop" style="--d:.15s;--t:.55s"><g clip-path="url(#uo-mc' + id + ')">' +
      '<circle cx="1700" cy="170" r="56" fill="var(--uo-shell)"/>' +
      '<circle cx="1692" cy="162" r="56" fill="#DBEDD8"/>' +
      '<circle cx="1684" cy="148" r="9" fill="var(--uo-shell)"/>' +
      '<circle cx="1712" cy="160" r="6" fill="var(--uo-shell)"/>' +
      '<circle cx="1686" cy="180" r="7" fill="var(--uo-shell)"/>' +
      '<circle cx="1664" cy="166" r="5" fill="var(--uo-shell)"/>' +
      '</g></g>';

    // 天際線（遠到近）；窗戶逐盞亮起
    function layer(fill, hmin, hr, wmin, wr, base, prob, ww, wh, sx, sy, x0, seedGap) {
      var s = '', x = x0, bw, bh, cols, rows, rr, cc;
      while (x < 1960) {
        bw = wmin + r() * wr; bh = hmin + r() * hr;
        s += '<rect x="' + f(x) + '" y="' + f(base - bh) + '" width="' + f(bw) + '" height="' + f(bh + 4) + '" fill="' + fill + '"/>';
        cols = Math.floor((bw - ww) / sx); rows = Math.floor((bh - wh * 2) / sy);
        for (rr = 0; rr < rows; rr++) {
          for (cc = 0; cc < cols; cc++) {
            if (r() < prob) {
              s += '<rect class="uo-x uo-lit" x="' + f(x + ww + cc * sx) + '" y="' + f(base - bh + wh + rr * sy) +
                '" width="' + ww + '" height="' + wh + '" style="--from:' + fill + ';--to:var(--uo-spark);--d:' + f(.3 + r() * 2.0) + 's"/>';
            }
          }
        }
        x += bw + seedGap + r() * seedGap;
      }
      return s;
    }
    h += layer(FLOOR, 90, 100, 50, 40, 530, .4, 6, 9, 14, 20, -20, 4);
    h += layer('var(--uo-shape)', 110, 150, 70, 60, 650, .45, 9, 13, 20, 28, -20, 6);
    h += layer(FLOOR, 200, 130, 90, 80, 830, .5, 14, 22, 28, 42, 520, 8);

    // 道路：每個方向兩條車道、中央分隔線
    h += '<rect x="0" y="905" width="1920" height="105" fill="' + FLOOR + '"/>';
    h += '<rect x="0" y="901" width="1920" height="4" fill="var(--uo-gray)"/>';
    h += '<rect x="0" y="1010" width="1920" height="4" fill="var(--uo-gray)"/>';
    h += '<line x1="0" y1="955" x2="1920" y2="955" stroke="var(--uo-gray)" stroke-width="3" stroke-dasharray="26 22"/>';
    h += '<rect x="0" y="1014" width="1920" height="66" fill="' + FLOOR + '"/>';

    // 車流：四條車道，各有固定車速（外側快、內側慢），同車道的車速度一致才不會互相穿過
    function cnt(name, d) {
      var v = el.getAttribute(name);
      var base = v === null ? d : Math.max(0, Math.round(num(v, d)));
      return Math.max(0, Math.round(base * num(el.getAttribute('traffic'), 1)));
    }
    var t, list = {};
    [['bus', 2], ['truck', 2], ['car', 6], ['scooter', 8]].forEach(function (o) { list[o[0]] = cnt(o[0], o[1]); });
    var rs = rng(21);
    // 車道 0 遠側外（右行、快）、1 遠側內（右行、慢）、2 近側內（左行、慢）、3 近側外（左行、快）
    var LANES = [
      { base: 926, kl: .88, sp: 1.45, dir: 'R', v: [] },
      { base: 948, kl: .93, sp: .8, dir: 'R', v: [] },
      { base: 976, kl: .97, sp: .9, dir: 'L', v: [] },
      { base: 999, kl: 1, sp: 1.3, dir: 'L', v: [] }
    ];
    var turn = { heavy: 0, scooter: 0, car: 0 };
    function put(ty, group) {
      var cand = group === 'heavy' ? [1, 2] : group === 'scooter' ? [0, 3] : [0, 1, 2, 3];
      var li = cand[turn[group]++ % cand.length];
      if (LANES[li].v.length < 11) LANES[li].v.push(ty);
    }
    var pool = [];
    ['bus', 'truck', 'car', 'scooter'].forEach(function (ty) { for (i = 0; i < list[ty]; i++) pool.push(ty); });
    for (i = pool.length - 1; i > 0; i--) { var j = Math.floor(rs() * (i + 1)); t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool.slice(0, 44).forEach(function (ty) { put(ty, ty === 'bus' || ty === 'truck' ? 'heavy' : ty); });
    var speed = num(el.getAttribute('traffic-speed'), 130);
    var carColors = ['var(--uo-spark)', 'var(--uo-shell)', 'var(--uo-gray)', 'var(--uo-shell)'];
    var laneSvg = ['', '', '', ''], ci = 0;
    LANES.forEach(function (ln, li) {
      var D = 2220 / (speed * ln.sp), nl = ln.v.length;
      ln.v.forEach(function (ty, idx) {
        var v, color;
        if (ty === 'car') { color = carColors[ci++ % carColors.length]; v = VEH.car(color, color === 'var(--uo-spark)'); }
        else v = VEH[ty]();
        var phase = (idx + r() * .3) / nl;
        var flip = ln.dir === 'L' ? ' translate(' + v.w + ' 0) scale(-1 1)' : '';
        laneSvg[li] += '<g transform="translate(0,' + ln.base + ')"><g class="uo-drive ' + (ln.dir === 'R' ? 'uo-dR' : 'uo-dL') +
          '" style="--t:' + f(D) + 's;--d:-' + f(phase * D) + 's"><g transform="scale(' + ln.kl + ')' + flip + '">' + v.svg + '</g></g></g>';
      });
    });
    h += laneSvg[0] + laneSvg[1];

    // 高架橋：橋墩、橋面（沿彎道、依遠近縮放）
    var pts = track.pts, pil = '', top = '', bot = '';
    var pillarAt = function (x, y) {
      var k = kOf(y);
      pil += '<rect x="' + f(x - 24 * k) + '" y="' + f(y + DECK * k) + '" width="' + f(48 * k) + '" height="' + f((PIL - DECK) * k) + '" fill="var(--uo-shape)"/>';
    };
    for (i = 8; i <= 90; i += 14) { var pp = bez(i / 90); pillarAt(pp[0], pp[1]); }
    for (var px = 650; px < 2100; px += 360) pillarAt(px, 796);
    for (i = 2; i < pts.length; i++) {
      var k = kOf(pts[i][1]);
      top += pts[i][0] + ',' + f(pts[i][1]) + ' ';
      bot = pts[i][0] + ',' + f(pts[i][1] + DECK * k) + ' ' + bot;
    }
    h += pil + '<polygon points="' + top + bot + '" fill="var(--uo-gray)"/>';
    var deckLine = 'M' + pts.slice(2).map(function (p) { return p[0] + ' ' + f(p[1]); }).join(' L');
    h += '<path d="' + deckLine + '" fill="none" stroke="var(--uo-shell)" stroke-width="3"/>';

    // 捷運：沿彎道行進，位置、旋轉、縮放逐格取樣成 keyframes
    var nCars = Math.max(2, Math.min(5, Math.round(num(el.getAttribute('train-cars'), 3))));
    var SP = 472 * TRAIN_SCALE, SAMPLES = 56, css = '', carsSvg = '', c, u, e, p0;
    // 前車的右緣第一次進入畫面的進度 uVis，讓它在 ENTER_AT 秒進場
    var uVis = 0;
    for (u = 0; u <= 1; u += 0.002) {
      e = 1 - Math.pow(1 - u, 2.2);
      var qv = track.at(track.wStart + (track.wEnd - track.wStart) * e);
      if (qv.x + 230 * qv.k > 0) { uVis = u; break; }
    }
    var trainAt = ENTER_AT - uVis * TRAIN_T;
    var arrive = trainAt + TRAIN_T, doorAt = arrive + 0.15, titleAt = doorAt + 0.35, total = titleAt + 1.1 + 0.7;
    for (c = 0; c < nCars; c++) {
      var name = 'uo-tr' + id + '_' + c, kf = '';
      for (var s = 0; s <= SAMPLES; s++) {
        u = s / SAMPLES; e = 1 - Math.pow(1 - u, 2.2);
        var wf = track.wStart + (track.wEnd - track.wStart) * e - c * SP;
        var q = track.at(wf);
        kf += f(u * 100) + '%{transform:translate(' + f(q.x) + 'px,' + f(q.y) + 'px) rotate(' + f(q.a) + 'deg) scale(' + f(q.k * TRAIN_SCALE * 1000) / 1000 + ')}';
        if (s === 0) p0 = q;
      }
      css += '@keyframes ' + name + '{' + kf + '}\n';
      carsSvg += '<g class="uo-car" style="--an:' + name + ';--t:' + TRAIN_T + 's;--d:' + f(trainAt) + 's;transform:translate(' + f(p0.x) + 'px,' + f(p0.y) + 'px) rotate(' + f(p0.a) + 'deg) scale(' + f(p0.k * TRAIN_SCALE * 1000) / 1000 + ')">' +
        '<rect x="-230" y="-144" width="460" height="140" rx="28" fill="var(--uo-shell)"/>' +
        '<rect x="-230" y="-58" width="460" height="14" fill="' + accent + '"/>' +
        '<rect x="-206" y="-120" width="64" height="54" rx="8" fill="var(--uo-bg)"/>' +
        '<rect x="-126" y="-120" width="64" height="54" rx="8" fill="var(--uo-bg)"/>' +
        '<rect x="62" y="-120" width="64" height="54" rx="8" fill="var(--uo-bg)"/>' +
        '<rect x="142" y="-120" width="64" height="54" rx="8" fill="var(--uo-bg)"/>' +
        '<rect x="-44" y="-124" width="88" height="106" rx="6" fill="var(--uo-spark)"/>' +
        '<rect class="uo-x uo-doorL" x="-44" y="-124" width="44" height="106" fill="var(--uo-shell)" stroke="var(--uo-bg)" stroke-width="3" style="--d:' + f(doorAt) + 's;--t:.5s"/>' +
        '<rect class="uo-x uo-doorR" x="0" y="-124" width="44" height="106" fill="var(--uo-shell)" stroke="var(--uo-bg)" stroke-width="3" style="--d:' + f(doorAt) + 's;--t:.5s"/>' +
        '<rect x="-190" y="-14" width="100" height="14" fill="var(--uo-gray)"/>' +
        '<rect x="90" y="-14" width="100" height="14" fill="var(--uo-gray)"/></g>';
    }
    // 後車先畫、前車壓在上面
    var carList = carsSvg.split('<g class="uo-car"').filter(Boolean).reverse().map(function (x) { return '<g class="uo-car"' + x; }).join('');
    h += carList;
    h += laneSvg[2] + laneSvg[3];

    return { svg: '<svg viewBox="0 0 1920 1080" width="1920" height="1080">' + h + '</svg>', css: css, titleAt: titleAt, total: total };
  }

  /* ========== CSS ========== */
  var CSS = [
    'ui-opener{display:block;position:relative;overflow:hidden;aspect-ratio:16/9;background:var(--uo-bg,#0C0D0C);font-family:"微軟正黑體","Microsoft JhengHei","Inter",sans-serif}',
    '.uo-stage{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0}',
    '.uo-stage svg{position:absolute;left:0;top:0;display:block}',
    '.uo-x{transform-box:fill-box;transform-origin:50% 50%}',
    '.uo-pop{transform:scale(0)}',
    '.uo-lit{fill:var(--from)}',
    '.uo-car{transform-box:view-box;transform-origin:0 0}',
    '.uo-drive{transform-box:view-box;transform-origin:0 0;transform:translateX(-400px)}',
    '.uo-ti{transform:translateY(125%)}',
    '.uo-run .uo-pop{animation:uo-pop calc(var(--t,.5s)*var(--s)) cubic-bezier(.3,1.4,.5,1) calc(var(--d,0s)*var(--s)) both}',
    '.uo-run .uo-lit{animation:uo-lit calc(.25s*var(--s)) linear calc(var(--d,0s)*var(--s)) both}',
    '.uo-run .uo-star{animation:uo-twinkle calc(var(--t,3s)*var(--s)) ease-in-out calc(var(--d,0s)*var(--s)) infinite}',
    '.uo-run .uo-car{animation:var(--an) calc(var(--t)*var(--s)) linear calc(var(--d)*var(--s)) both}',
    '.uo-run .uo-dR{animation:uo-dR calc(var(--t)*var(--s)) linear calc(var(--d)*var(--s)) infinite}',
    '.uo-run .uo-dL{animation:uo-dL calc(var(--t)*var(--s)) linear calc(var(--d)*var(--s)) infinite}',
    '.uo-doorL{transform-origin:0 50%}.uo-doorR{transform-origin:100% 50%}',
    '.uo-run .uo-doorL,.uo-run .uo-doorR{animation:uo-door calc(var(--t,.5s)*var(--s)) ease-in-out calc(var(--d,0s)*var(--s)) both}',
    '.uo-run .uo-ti{animation:uo-ti calc(.8s*var(--s)) cubic-bezier(.2,.8,.2,1) calc((var(--ta) + var(--o,0s))*var(--s)) both}',
    '.uo-paused,.uo-paused *{animation-play-state:paused !important}',
    '@keyframes uo-pop{from{transform:scale(0)}to{transform:scale(1)}}',
    '@keyframes uo-lit{from{fill:var(--from)}to{fill:var(--to)}}',
    '@keyframes uo-twinkle{0%,100%{transform:scale(1)}50%{transform:scale(.3)}}',
    '@keyframes uo-dR{from{transform:translateX(-300px)}to{transform:translateX(1920px)}}',
    '@keyframes uo-dL{from{transform:translateX(1920px)}to{transform:translateX(-300px)}}',
    '@keyframes uo-door{from{transform:scaleX(1)}to{transform:scaleX(0)}}',
    '@keyframes uo-ti{from{transform:translateY(125%)}to{transform:translateY(0)}}',
    '.uo-title{position:absolute;transform:translateY(-50%);text-align:center;z-index:2}',
    '.uo-mask{overflow:hidden;padding:6px 0}',
    '.uo-lesson{display:inline-block;background:var(--uo-accent);color:var(--uo-bg);border-radius:999px;padding:8px 28px;font-weight:700;letter-spacing:2px}',
    '.uo-h{color:var(--uo-text);font-weight:800;line-height:1.2;letter-spacing:2px;text-shadow:0 4px 0 var(--uo-bg)}',
    '.uo-sub{color:var(--uo-sub);line-height:1.4;letter-spacing:1px;text-shadow:0 2px 0 var(--uo-bg)}',
    '.uo-ctl{position:absolute;right:10px;bottom:10px;z-index:5;display:flex;gap:6px}',
    '.uo-ctl button{background:#3B2A20;color:#DBEDD8;border:2px solid #86877F;border-radius:6px;padding:4px 12px;font-size:0.85rem;cursor:pointer}',
    '.uo-ctl button:hover{border-color:#51DBCF;color:#51DBCF}',
    '.uo-safe{position:absolute;z-index:4;border:2px dashed #86877F;pointer-events:none}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('ui-opener-css')) return;
    var st = document.createElement('style');
    st.id = 'ui-opener-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ========== 元件 ========== */
  var ATTRS = ['title', 'subtitle', 'lesson', 'rate', 'width', 'bg', 'accent', 'spark', 'shape', 'text-color',
    'subtitle-color', 'title-size', 'subtitle-size', 'lesson-size', 'title-y', 'safe', 'show-safe', 'show-title',
    'controls', 'loop', 'loop-gap', 'autoplay', 'bus', 'truck', 'car', 'scooter', 'traffic', 'traffic-speed', 'train-cars'];

  function UiOpener() { return Reflect.construct(HTMLElement, [], UiOpener); }
  UiOpener.prototype = Object.create(HTMLElement.prototype);
  UiOpener.prototype.constructor = UiOpener;
  Object.setPrototypeOf(UiOpener, HTMLElement);
  Object.defineProperty(UiOpener, 'observedAttributes', { get: function () { return ATTRS; } });

  UiOpener.prototype._bool = function (n, d) {
    var v = this.getAttribute(n);
    if (v === null) return d;
    return v !== 'false';
  };
  UiOpener.prototype.connectedCallback = function () { injectCSS(); this._id = ++uid; this._ready = true; this._build(); };
  UiOpener.prototype.disconnectedCallback = function () { this._teardown(); };
  UiOpener.prototype.attributeChangedCallback = function () { if (this._ready && this.isConnected) this._build(); };
  UiOpener.prototype._teardown = function () {
    clearTimeout(this._endTimer); clearTimeout(this._loopTimer);
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
  };

  UiOpener.prototype._build = function () {
    var self = this;
    this._teardown();
    this.style.width = this.getAttribute('width') || '100%';
    this.style.setProperty('--uo-bg', col(this.getAttribute('bg'), '#0C0D0C'));
    this.style.setProperty('--uo-accent', col(this.getAttribute('accent'), COLORS.key));
    this.style.setProperty('--uo-spark', col(this.getAttribute('spark'), COLORS.yellow));
    this.style.setProperty('--uo-shape', col(this.getAttribute('shape'), COLORS['bg-alternative']));
    this.style.setProperty('--uo-text', col(this.getAttribute('text-color'), COLORS.vanilla));
    this.style.setProperty('--uo-sub', col(this.getAttribute('subtitle-color'), COLORS.shell));
    this.style.setProperty('--uo-gray', COLORS.gray);
    this.style.setProperty('--uo-shell', COLORS.shell);

    var rate = num(this.getAttribute('rate'), 1) || 1;
    this._rate = rate;
    this.innerHTML = '';
    var sc = buildScene(this, this._id);
    var kf = document.createElement('style');
    kf.textContent = sc.css;
    this.appendChild(kf);

    var stage = document.createElement('div');
    stage.className = 'uo-stage';
    stage.style.setProperty('--s', String(1 / rate));
    stage.style.setProperty('--ta', f(sc.titleAt) + 's');
    this._total = sc.total;
    stage.innerHTML = sc.svg;
    this._stage = stage;

    if (this._bool('show-title', true)) {
      var safe = num(this.getAttribute('safe'), 5);
      var w = Math.round(1920 * (100 - 2 * safe) / 100);
      var ty = num(this.getAttribute('title-y'), TITLE_Y);
      var t = document.createElement('div');
      t.className = 'uo-title';
      t.style.top = ty + '%';
      t.style.width = w + 'px';
      t.style.left = Math.round((1920 - w) / 2) + 'px';
      var add = function (cls, text, fs, o) {
        if (!text) return;
        var m = document.createElement('div'); m.className = 'uo-mask';
        var d = document.createElement('div'); d.className = 'uo-ti ' + cls;
        d.style.fontSize = fs; d.style.setProperty('--o', o);
        d.textContent = text; m.appendChild(d); t.appendChild(m);
      };
      add('uo-lesson', this.getAttribute('lesson') || '', size(this.getAttribute('lesson-size'), '1.6rem'), '0s');
      add('uo-h', this.hasAttribute('title') ? this.getAttribute('title') : 'IELTS Speaking Tutorial Series',
        size(this.getAttribute('title-size'), '5.2rem'), '.15s');
      add('uo-sub', this.getAttribute('subtitle') || '', size(this.getAttribute('subtitle-size'), '1.7rem'), '.3s');
      stage.appendChild(t);
    }
    this.appendChild(stage);

    if (this._bool('show-safe', false)) {
      var sf = num(this.getAttribute('safe'), 5);
      var g = document.createElement('div');
      g.className = 'uo-safe';
      g.style.left = sf + '%'; g.style.right = sf + '%';
      g.style.top = (sf * 16 / 9) + '%'; g.style.bottom = (sf * 16 / 9) + '%';
      this.appendChild(g);
    }
    if (this._bool('controls', false)) {
      var c = document.createElement('div'); c.className = 'uo-ctl';
      var b1 = document.createElement('button'); b1.textContent = '播放／暫停';
      var b2 = document.createElement('button'); b2.textContent = '重播';
      b1.addEventListener('click', function () { self.toggle(); });
      b2.addEventListener('click', function () { self.restart(); });
      c.appendChild(b1); c.appendChild(b2); this.appendChild(c);
    }

    this._ro = new ResizeObserver(function () { stage.style.transform = 'scale(' + (self.clientWidth / 1920) + ')'; });
    this._ro.observe(this);
    stage.style.transform = 'scale(' + (this.clientWidth / 1920 || 1) + ')';

    if (this.getAttribute('autoplay') !== 'false') {
      this._io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { self._io.disconnect(); self.restart(); }
      }, { threshold: 0.6 });
      this._io.observe(this);
    }
  };

  UiOpener.prototype.restart = function () {
    if (!this._stage) return;
    var st = this._stage;
    clearTimeout(this._endTimer); clearTimeout(this._loopTimer);
    st.classList.remove('uo-run', 'uo-paused');
    void st.offsetWidth;
    st.classList.add('uo-run');
    this._remain = this._total * 1000 / this._rate;
    this._t0 = performance.now();
    this._schedule();
    this.dispatchEvent(new CustomEvent('opener-start', { bubbles: true }));
  };
  UiOpener.prototype._schedule = function () {
    var self = this;
    clearTimeout(this._endTimer);
    this._endTimer = setTimeout(function () {
      self._remain = 0;
      self.dispatchEvent(new CustomEvent('opener-end', { bubbles: true }));
      if (self.hasAttribute('loop') && self.getAttribute('loop') !== 'false') {
        self._loopTimer = setTimeout(function () { self.restart(); }, num(self.getAttribute('loop-gap'), 1500));
      }
    }, this._remain);
  };
  UiOpener.prototype.play = function () {
    if (!this._stage) return;
    if (!this._stage.classList.contains('uo-run')) return this.restart();
    if (this._stage.classList.contains('uo-paused')) {
      this._stage.classList.remove('uo-paused');
      this._t0 = performance.now();
      this._schedule();
    }
  };
  UiOpener.prototype.pause = function () {
    if (!this._stage || this._stage.classList.contains('uo-paused')) return;
    this._stage.classList.add('uo-paused');
    clearTimeout(this._endTimer);
    this._remain -= performance.now() - this._t0;
  };
  UiOpener.prototype.toggle = function () {
    if (this._stage && this._stage.classList.contains('uo-paused')) this.play(); else this.pause();
  };
  Object.defineProperty(UiOpener.prototype, 'duration', { get: function () { return (this._total || 0) / (this._rate || 1); } });

  customElements.define('ui-opener', UiOpener);
  window.UiOpener = { colors: COLORS };
})();
