/* =========================================================================
 * component-check.js  元件載入檢查（錄影前使用，用完不需留在頁面）
 *
 * 用書籤執行：開啟教材頁，點書籤「檢查元件」，結果顯示在頁面最頂端。
 *   應載入卻沒載入、載入了卻沒用到、重複載入、載入失敗、載入順序錯誤：urgent 色
 *   對照表裡找不到的標籤（可能拼錯）：yellow 色
 *   全部通過：一行 green 色字，不會自動消失
 *
 * 對照表由 UIWorld 與 extras 的原始碼掃描產生，元件有增減時需要重新產生。
 * 不使用 Shadow DOM，不寫入主控台。
 * ========================================================================= */
(function () {
  'use strict';

  /* ── 對照表（自動產生，請勿手改）──────────────────────────────────────
     r：u = UIWorld（workforce 為其複本），x = extras
     o：這個檔案負責的標籤（頁面有其中任何一個，就算用到）
     d：這個檔案會註冊的自訂元素（用來判斷是否成功執行）
     g：這個檔案會建立的全域物件（沒有註冊自訂元素時用來判斷是否成功執行） */
  var T = {
    'arrow-flow.js': {'r':'u','o':['arrow-flow','branch-option','flow-branch','flow-step'],'d':['arrow-flow','branch-option','flow-branch','flow-step'],'g':['ArrowFlow']},
    'bd/badge-targets.js': {'r':'u','o':[],'d':[],'g':['BadgeTargets']},
    'bd/card-badge.js': {'r':'u','o':['badge-item','card-badge'],'d':['badge-item','card-badge'],'g':[]},
    'bp-stepper.js': {'r':'u','o':['bp-step','bp-step-content','bp-step-title','bp-stepper'],'d':[],'g':['BPStepper']},
    'charts/ui-charts.js': {'r':'u','o':['chart-row','ui-chart'],'d':['chart-row','ui-chart'],'g':['UiChart']},
    'chunk-demo.js': {'r':'u','o':['cd-chunk','cd-level','chunk-demo'],'d':['chunk-demo'],'g':[]},
    'cn/ui-connect.js': {'r':'u','o':['connect-line','ui-connect'],'d':['connect-line','ui-connect'],'g':['UiConnect']},
    'dash/ui-dashboard.js': {'r':'u','o':['dash-cell','ui-dashboard'],'d':['dash-cell','ui-dashboard'],'g':[]},
    'drag/ui-drag-ans.js': {'r':'u','o':['drag-card','drop-slot','ui-drag-ans'],'d':['drag-card','drop-slot','ui-drag-ans'],'g':['UiDragAns']},
    'editor/md-editor-beyond.js': {'r':'u','o':[],'d':[],'g':['MdEditorBeyond']},
    'editor/md-editor.js': {'r':'u','o':['md-editor'],'d':['md-editor'],'g':['MdEditor']},
    'flow/play-maker.js': {'r':'u','o':['play-maker'],'d':['play-maker'],'g':[]},
    'flow/ui-contacts.js': {'r':'u','o':['p-card','p-msg','ui-contacts'],'d':['p-card','p-msg','ui-contacts'],'g':['UiContacts']},
    'flow/ui-play.js': {'r':'u','o':['hide-fx','pause-fx','pointer-fx','script-item','stage-item','type-fx','ui-play'],'d':['ui-play'],'g':[]},
    'flow/ui-stream-beyond.js': {'r':'u','o':[],'d':[],'g':['UiStreamBeyond']},
    'flow/ui-stream.js': {'r':'u','o':['stream-item','stream-role','ui-stream'],'d':['stream-item','stream-role','ui-stream'],'g':['UiStream']},
    'guide/ui-guide.js': {'r':'u','o':['guide-mark','ui-guide'],'d':['guide-mark','ui-guide'],'g':[]},
    'info/info-region.js': {'r':'u','o':['info-region','info-region-group','ir-choice','ir-choices','ir-input'],'d':['info-region','info-region-group','ir-choice','ir-choices','ir-input'],'g':['InfoRegion','InfoRegionConfig']},
    'ladder/ui-detail-ladder.js': {'r':'u','o':['ladder-step','step-body','step-note','step-title','ui-detail-ladder'],'d':['ui-detail-ladder'],'g':[]},
    'ladder/ui-insight.js': {'r':'u','o':['ins-line','ui-insight'],'d':['ui-insight'],'g':[]},
    'layout/ui-cards.js': {'r':'u','o':['card-back','card-detail','card-item','ui-cards'],'d':['card-item','ui-cards'],'g':[]},
    'layout/ui-drill.js': {'r':'u','o':['drill-tile','rightup-item','ui-drill'],'d':['drill-tile','rightup-item','ui-drill'],'g':[]},
    'layout/ui-steps.js': {'r':'u','o':['step-item','ui-steps'],'d':['step-item','ui-steps'],'g':[]},
    'lens/lens-read.js': {'r':'u','o':['lens-read','lens-word'],'d':['lens-read','lens-word'],'g':['LensRead']},
    'lesson/lesson-unit.js': {'r':'u','o':['lesson-nav','lesson-unit'],'d':['lesson-nav','lesson-unit'],'g':['LessonUnit']},
    'lw/link-when.js': {'r':'u','o':['link-when'],'d':['link-when'],'g':['LinkWhen']},
    'maze/maze-quiz.js': {'r':'u','o':['maze-quiz','maze-quiz-panel'],'d':['maze-quiz','maze-quiz-panel'],'g':[]},
    'mini/mini-table.js': {'r':'u','o':['mini-table','mt-badge'],'d':['mini-table'],'g':['MiniTable']},
    'msk/ui-mask.js': {'r':'u','o':['mask-cover','ui-mask','ui-mask-group'],'d':['mask-cover','ui-mask','ui-mask-group'],'g':['UiMask']},
    'note/bp-popnote.js': {'r':'u','o':['bp-notice'],'d':[],'g':['BpNotice','BpPopnote','PopoverConfig']},
    'numeric-list.js': {'r':'u','o':['list-item','list-item-ad','ui-list'],'d':[],'g':['NumericList']},
    'pen/dot-go.js': {'r':'u','o':['dot-go'],'d':['dot-go'],'g':['DotGo']},
    'pen/ink-pen.js': {'r':'u','o':['ink-handwrite','ui-ink-bar','ui-ink-layer','ui-ink-modal','ui-ink-ng-panel'],'d':['ink-handwrite','ui-ink-bar','ui-ink-layer','ui-ink-modal','ui-ink-ng-panel'],'g':['InkPen']},
    'pg/ui-progrid.js': {'r':'u','o':['pg-cat','pg-desc','pg-more','pg-note','pg-opt','pg-row','ui-progrid'],'d':['ui-progrid'],'g':['UiProgrid']},
    'php-integrated/ui-reaction/ui-reaction.js': {'r':'u','o':['reaction-item','ui-reaction'],'d':['reaction-item','ui-reaction'],'g':['UiReaction']},
    'phrase-chip.js': {'r':'u','o':['phrase-card','phrase-chip','phrase-example','phrase-stage','phrase-translation','phrase-upgrade'],'d':[],'g':[]},
    'post/ui-post-beyond.js': {'r':'u','o':[],'d':[],'g':['UiPostBeyond']},
    'post/ui-post.js': {'r':'u','o':['post-item','ui-post'],'d':['ui-post'],'g':['UiPost']},
    'practice-tracker.js': {'r':'u','o':['practice-tracker','pt-cell','pt-done-btn'],'d':[],'g':[]},
    'r2/ui-reading2.js': {'r':'u','o':['cm-group','cm-item','cm-point','collocation-map','layer-switch','ls-layer','ls-mark','ls-text','ui-spotlight'],'d':['cm-group','collocation-map','layer-switch','ui-spotlight'],'g':['UiReading2']},
    'rp/ui-repeat.js': {'r':'u','o':['ui-repeat'],'d':['ui-repeat'],'g':['UiRepeat']},
    'rwd/running-words.js': {'r':'u','o':['running-words','rw-span'],'d':['running-words'],'g':['RunningWords']},
    'sb/sentence-build.js': {'r':'u','o':['chunk-item','sentence-build'],'d':['sentence-build'],'g':[]},
    'scn/ui-screen.js': {'r':'u','o':['ui-screen','ui-screen-after','ui-screen-before','ui-screen-handle'],'d':['ui-screen'],'g':['UIScreen']},
    'scn/ui-scroll-scene.js': {'r':'u','o':['scene-layer','scene-stage','scene-step','ui-scroll-scene'],'d':['ui-scroll-scene'],'g':['UIScrollScene']},
    'shelf/ui-shelf.js': {'r':'u','o':['iso-item','ui-shelf'],'d':['ui-shelf'],'g':['UiShelf']},
    'slider-show.js': {'r':'u','o':['extra-note','slider-show'],'d':['slider-show'],'g':[]},
    'sthd/sticky-head.js': {'r':'u','o':['sticky-head'],'d':['sticky-head'],'g':['StickyHead']},
    'story/ui-storyboard.js': {'r':'u','o':['story-do','story-step','ui-storyboard'],'d':['story-do','story-step','ui-storyboard'],'g':['UiStoryboard']},
    'tbl/ui-table.js': {'r':'u','o':['cell-item','ui-col','ui-group','ui-row','ui-row-enhance','ui-table'],'d':[],'g':['UiTable','UiTableConfig']},
    'tetris/tetris-quiz.js': {'r':'u','o':['tetris-quiz','tetris-quiz-panel'],'d':['tetris-quiz','tetris-quiz-panel'],'g':[]},
    'tfx/text-fx.js': {'r':'u','o':['dissolve-fx','glow-fx','insert-fx','text-fx'],'d':['text-fx'],'g':['TextFx']},
    'tg/ui-teaching-guide.js': {'r':'u','o':['ui-teaching-guide'],'d':['ui-teaching-guide'],'g':['UiTeachingGuide']},
    'tl/ui-timeline.js': {'r':'u','o':['tl-item','ui-timeline'],'d':['ui-timeline'],'g':[]},
    'tour/page-tour.js': {'r':'u','o':['fx-arrow','fx-confetti','fx-count','fx-cursor','fx-hover','fx-line','fx-mark','fx-note','fx-punch','fx-ring','fx-shake','page-tour','tour-panel','tour-step','tour-world'],'d':['page-tour','tour-panel','tour-step','tour-world'],'g':['PageTour']},
    'tour/route-map.js': {'r':'u','o':['route-here','route-line','route-map','route-stop','route-train','route-transfer','route-zone'],'d':['route-here','route-line','route-map','route-stop','route-train','route-transfer','route-zone'],'g':['RouteMap']},
    'ui-fillin.js': {'r':'u','o':['ans-box','main-box','ui-fillin'],'d':['ans-box','main-box','ui-fillin'],'g':[]},
    'ui-frame.js': {'r':'u','o':['ui-frame'],'d':['ui-frame'],'g':['UiFrame']},
    'ui-inputs.js': {'r':'u','o':['cli-ask','cli-in','cli-out','cli-wait','ui-blank','ui-otp'],'d':['ui-blank','ui-otp'],'g':[]},
    'ui-plus.js': {'r':'u','o':['chalk-mark','col-pair','dual-hr','dual-vr','read-pulse','ui-arc-item','ui-arc-menu','ui-btn'],'d':['dual-hr','dual-vr','ui-arc-item','ui-arc-menu'],'g':['DualHR','DualLine','DualVR','UiBtn','UiBtnConfig','UiReading','UiReadingConfig']},
    'ui-tabs.js': {'r':'u','o':['tab-item','ui-tabs'],'d':['ui-tabs'],'g':['UiTabs']},
    'ui-toast.js': {'r':'u','o':['ui-toast'],'d':[],'g':['UiToast','UiToastConfig']},
    'vt/v-title.js': {'r':'u','o':['v-title'],'d':['v-title'],'g':['VTitle']},
    'chest/cycling-sprint.js': {'r':'x','o':['cycling-sprint','sprint-result'],'d':['cycling-sprint','sprint-result'],'g':['CyclingSprint']},
    'chest/treasure-chest.js': {'r':'x','o':['chest-prize','treasure-chest'],'d':['chest-prize','treasure-chest'],'g':['TreasureChest']},
    'chest/ui-opener.js': {'r':'x','o':['ui-opener'],'d':['ui-opener'],'g':['UiOpener']},
    'rw/rect-weave.js': {'r':'x','o':['rect-weave'],'d':['rect-weave'],'g':['RectWeave']},
    'ui-slice/ui-slice.js': {'r':'x','o':['ui-cut','ui-slice'],'d':['ui-slice'],'g':[]}
  };
  /* 多個檔案都能處理的標籤：載入其中任何一個就不算缺 */
  var SHARED = {'mark-fx':['bp-stepper.js','flow/play-maker.js','flow/ui-play.js','flow/ui-stream.js','ladder/ui-detail-ladder.js','layout/ui-cards.js','layout/ui-drill.js','post/ui-post.js','tbl/ui-table.js','tfx/text-fx.js','vt/v-title.js'],'note-fx':['flow/play-maker.js','flow/ui-play.js','flow/ui-stream.js','post/ui-post.js','tfx/text-fx.js','vt/v-title.js'],'remove-fx':['flow/ui-play.js','flow/ui-stream.js','post/ui-post.js'],'shake-fx':['flow/ui-play.js','tfx/text-fx.js'],'show-fx':['flow/play-maker.js','flow/ui-play.js'],'stamp-fx':['flow/play-maker.js','flow/ui-play.js','flow/ui-stream.js','post/ui-post.js'],'swap-fx':['flow/play-maker.js','flow/ui-play.js','flow/ui-stream.js','post/ui-post.js','tfx/text-fx.js'],'ui-flash':['tbl/ui-table.js','vt/v-title.js'],'ui-trans':['tbl/ui-table.js','vt/v-title.js'],'zoom-fx':['flow/ui-play.js','tfx/text-fx.js']};
  /* 會注入 <c-色名> 樣式的檔案，載入任何一個，色名標籤就有效 */
  var COLOR_FILES = ['arrow-flow.js','bd/card-badge.js','bp-stepper.js','chunk-demo.js','flow/ui-play.js','flow/ui-stream.js','guide/ui-guide.js','info/info-region.js','ladder/ui-detail-ladder.js','ladder/ui-insight.js','layout/ui-cards.js','layout/ui-drill.js','layout/ui-steps.js','mini/mini-table.js','note/bp-popnote.js','numeric-list.js','pen/dot-go.js','pen/ink-pen.js','pg/ui-progrid.js','phrase-chip.js','post/ui-post.js','practice-tracker.js','r2/ui-reading2.js','sb/sentence-build.js','slider-show.js','sthd/sticky-head.js','tbl/ui-table.js','tfx/text-fx.js','tl/ui-timeline.js','ui-fillin.js','ui-inputs.js','ui-plus.js'];
  var COLORS = ['shell','vanilla','yellow','pink','red','green','blue','indigo','violet','gray','key','calm','quiet','playful','urgent','energetic','dreamy','salmon'];
  /* ── 對照表結束 ── */

  /* 靠屬性啟動的檔案：頁面有符合的元素，就需要載入，也算有用到 */
  var ATTR = {
    'ui-frame.js': 'template[frame], card-detail[frame], card-back[frame]',
    'ui-toast.js': '[toast], [toast-target]',
    'bd/badge-targets.js': '[badge-reveal-targets], [badge-remove-targets], [badge-wait-end]',
    'note/bp-popnote.js': '[data-popover-target], [data-popover-content], [data-popover-title]',
    'post/ui-post-beyond.js': 'ui-post[avatar-glow], post-item[avatar-glow]',
    'flow/ui-stream-beyond.js': 'stream-item[avatar-glow], stream-item[reveal-pause], stream-item[data-style="spot"], stream-item[data-style="faint"], stream-role[data-style="spot"], stream-role[data-style="faint"], ui-stream[frame]',
    'editor/md-editor-beyond.js': 'md-editor[send-url], md-editor[reply]',
    'sthd/sticky-head.js': 'lesson-unit[sh-heading]',
    'numeric-list.js': 'lesson-nav'
  };
  /* 屬性對應的說明文字 */
  var ATTR_NOTE = {
    'ui-frame.js': '寫了 frame 的 template、card-detail 或 card-back',
    'ui-toast.js': 'toast 或 toast-target 屬性',
    'bd/badge-targets.js': 'badge-reveal-targets、badge-remove-targets 或 badge-wait-end 屬性',
    'note/bp-popnote.js': 'data-popover-* 屬性',
    'post/ui-post-beyond.js': 'ui-post 或 post-item 的 avatar-glow',
    'flow/ui-stream-beyond.js': 'stream-item 的 avatar-glow、reveal-pause、data-style="spot/faint"，或 ui-stream 的 frame',
    'editor/md-editor-beyond.js': 'md-editor 的 send-url 或 reply',
    'sthd/sticky-head.js': '寫了 sh-heading 的 lesson-unit（會產生 sticky-head）',
    'numeric-list.js': 'lesson-nav（會產生 ui-list）'
  };
  /* 依賴：載入左邊的檔案時，右邊每一組至少要載入一個 */
  var NEEDS = {
    'flow/play-maker.js': [['flow/ui-play.js'], ['ui-fillin.js']],
    'post/ui-post-beyond.js': [['post/ui-post.js']],
    'flow/ui-stream-beyond.js': [['flow/ui-stream.js']],
    'editor/md-editor-beyond.js': [['editor/md-editor.js']],
    'bd/badge-targets.js': [['flow/ui-stream.js', 'post/ui-post.js', 'guide/ui-guide.js']]
  };
  /* 載入順序：[先, 後, 條件]。後 寫 * 表示其他所有元件檔；條件省略表示一律檢查 */
  var ORDER = [
    ['rp/ui-repeat.js', '*', null],
    ['bd/badge-targets.js', 'flow/ui-stream.js', 'stream-item[badge-reveal-targets], stream-item[badge-remove-targets]'],
    ['flow/ui-stream-beyond.js', 'flow/ui-stream.js', 'stream-item[avatar-glow], stream-item[reveal-pause]']
  ];
  /* 預設網址：頁面沒有同一個 repo 的 script 可參考時使用 */
  var DEFAULT_BASE = {
    u: 'https://cdn.jsdelivr.net/gh/studyadvice/workforce@keyexpert.org/',
    x: 'https://cdn.jsdelivr.net/gh/studyadvice/extras@main/'
  };
  var BOX_ID = 'component-check-box';
  var PAL = {
    bg: '#2D2D2D', text: '#C6C7BD', urgent: '#FF2E63', green: '#71CD76',
    yellow: '#E3D322', quiet: '#8EA4DE', key: '#51DBCF'
  };

  /* ── 反查表 ── */
  var OWNER = {};
  var BY_BASE = {};
  Object.keys(T).forEach(function (k) {
    T[k].o.forEach(function (t) { OWNER[t] = k; });
    var b = k.split('/').pop();
    (BY_BASE[b] = BY_BASE[b] || []).push(k);
  });

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function tagList(arr) {
    return arr.map(function (t) { return '<code>&lt;' + esc(t) + '&gt;</code>'; }).join('、');
  }
  function repoName(k) { return T[k].r === 'x' ? 'extras' : 'UIWorld'; }

  /* ── 收集頁面：原始碼（讀得到時）與目前畫面，template 內容一併掃描 ── */
  function rootsOf(doc) {
    var roots = [doc];
    var i = 0;
    while (i < roots.length) {
      var r = roots[i++];
      var tps = r.querySelectorAll('template');
      for (var j = 0; j < tps.length; j++) roots.push(tps[j].content);
    }
    return roots;
  }

  function collect(roots) {
    var tags = {};
    var bpClass = false;
    roots.forEach(function (r) {
      var els = r.querySelectorAll('*');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.id === BOX_ID || (el.closest && el.closest('#' + BOX_ID))) continue;
        var n = el.localName;
        if (n.indexOf('-') > 0) tags[n] = (tags[n] || 0) + 1;
        if (!bpClass && el.classList) {
          for (var c = 0; c < el.classList.length; c++) {
            if (el.classList[c].indexOf('bp-') === 0) { bpClass = true; break; }
          }
        }
      }
    });
    return { tags: tags, bpClass: bpClass };
  }

  function anyMatch(roots, sel) {
    for (var i = 0; i < roots.length; i++) {
      try { if (roots[i].querySelector(sel)) return true; } catch (e) { return false; }
    }
    return false;
  }

  /* 依檔名找出對照表的鍵；同名檔案有好幾個時，以路徑結尾比對 */
  function keyOf(src) {
    var path;
    try { path = new URL(src, location.href).pathname; } catch (e) { path = src; }
    path = decodeURIComponent(path);
    var base = path.split('/').pop();
    var cands = BY_BASE[base];
    if (!cands) return null;
    if (cands.length === 1) return cands[0];
    for (var i = 0; i < cands.length; i++) {
      if (path.slice(-cands[i].length - 1) === '/' + cands[i]) return cands[i];
    }
    return cands[0];
  }

  function inlineText() {
    var s = '';
    var list = document.querySelectorAll('script:not([src])');
    for (var i = 0; i < list.length; i++) {
      var t = list[i].textContent;
      if (t.indexOf(BOX_ID) >= 0) continue;   /* 跳過偵測器自己 */
      s += '\n' + t;
    }
    return s;
  }

  function loadedOK(k) {
    var f = T[k];
    if (f.d.length) {
      for (var i = 0; i < f.d.length; i++) if (customElements.get(f.d[i])) return true;
      return false;
    }
    if (f.g.length) {
      for (var j = 0; j < f.g.length; j++) if (window[f.g[j]] !== undefined) return true;
      return false;
    }
    return true;
  }

  /* ── 主程式 ── */
  function analyse(srcDoc) {
    var roots = rootsOf(document);
    if (srcDoc) roots = roots.concat(rootsOf(srcDoc));
    var page = collect(roots);
    var tags = page.tags;

    /* 已載入的 script，依出現順序 */
    var scripts = [];
    var notInTable = [];
    var list = document.querySelectorAll('script[src]');
    for (var i = 0; i < list.length; i++) {
      var src = list[i].getAttribute('src');
      if (/component-check\.js/.test(src)) continue;
      var k = keyOf(src);
      if (k) scripts.push({ key: k, src: list[i].src });
      else if (/studyadvice\/(workforce|UIWorld|extras)|uiworld/i.test(list[i].src)) notInTable.push(list[i].src);
    }
    var loaded = {};
    var order = {};
    var base = {};
    scripts.forEach(function (s, idx) {
      loaded[s.key] = (loaded[s.key] || 0) + 1;
      if (order[s.key] === undefined) order[s.key] = idx;
      var r = T[s.key].r;
      if (!base[r] && s.src.slice(-s.key.length) === s.key) base[r] = s.src.slice(0, -s.key.length);
    });
    var styleLinks = document.querySelectorAll('link[rel~="stylesheet"][href]');
    var bpCss = false;
    for (var c = 0; c < styleLinks.length; c++) {
      if (/(^|\/)bp-styles\.css(\?|#|$)/.test(styleLinks[c].getAttribute('href'))) bpCss = true;
    }

    var missing = {};      /* key -> 原因清單 */
    var anyOf = [];        /* 多選一的缺漏 */
    var unknown = [];
    function need(k, why) { (missing[k] = missing[k] || []).push(why); }

    var byOwner = {};
    Object.keys(tags).sort().forEach(function (t) {
      if (/^c-/.test(t)) {
        if (COLORS.indexOf(t.slice(2)) < 0) { unknown.push(t); return; }
        var okC = COLOR_FILES.some(function (k) { return loaded[k]; });
        if (!okC) anyOf.push({ tags: [t], files: ['任何一個元件檔'] });
        return;
      }
      if (OWNER[t]) {
        (byOwner[OWNER[t]] = byOwner[OWNER[t]] || []).push(t);
        return;
      }
      if (SHARED[t]) {
        var ok = SHARED[t].some(function (k) { return loaded[k]; });
        if (!ok) {
          var same = null;
          anyOf.forEach(function (a) { if (a.files.join() === SHARED[t].join()) same = a; });
          if (same) same.tags.push(t); else anyOf.push({ tags: [t], files: SHARED[t].slice() });
        }
        return;
      }
      unknown.push(t);
    });
    Object.keys(byOwner).forEach(function (k) {
      if (!loaded[k]) need(k, '頁面用到 ' + tagList(byOwner[k]));
    });
    Object.keys(ATTR).forEach(function (k) {
      if (!loaded[k] && anyMatch(roots, ATTR[k])) need(k, '頁面有' + esc(ATTR_NOTE[k]));
    });
    Object.keys(NEEDS).forEach(function (k) {
      if (!loaded[k]) return;
      NEEDS[k].forEach(function (grp) {
        if (grp.some(function (g) { return loaded[g]; })) return;
        if (grp.length === 1) need(grp[0], '<code>' + esc(k) + '</code> 需要它');
        else anyOf.push({ tags: [], files: grp, why: '<code>' + esc(k) + '</code> 需要其中一個' });
      });
    });

    /* 載入了卻沒用到 */
    var inl = null;
    var unused = [];
    Object.keys(loaded).forEach(function (k) {
      var f = T[k];
      if (f.o.some(function (t) { return tags[t]; })) return;
      if (ATTR[k] && anyMatch(roots, ATTR[k])) return;
      if (k === 'ui-frame.js' && tags['ui-frame']) return;
      var gs = f.g.filter(function (g) { return g !== 'UiColorTags'; });
      if (gs.length) {
        if (inl === null) inl = inlineText();
        if (gs.some(function (g) { return new RegExp('\\b' + g + '\\b').test(inl); })) return;
      }
      /* 被其他已載入的檔案依賴 */
      var dep = Object.keys(NEEDS).some(function (n) {
        return loaded[n] && NEEDS[n].some(function (grp) { return grp.indexOf(k) >= 0; });
      });
      if (dep) return;
      unused.push(k);
    });

    var dup = Object.keys(loaded).filter(function (k) { return loaded[k] > 1; });
    var failed = Object.keys(loaded).filter(function (k) { return !loadedOK(k); });

    var orderErr = [];
    ORDER.forEach(function (o) {
      var a = o[0], b = o[1], cond = o[2];
      if (!loaded[a]) return;
      if (cond && !anyMatch(roots, cond)) return;
      var later = b === '*' ? Object.keys(loaded).filter(function (k) { return k !== a; }) : (loaded[b] ? [b] : []);
      var bad = later.filter(function (k) { return order[k] < order[a]; });
      if (bad.length) orderErr.push({ first: a, after: bad });
    });

    var cssMissing = page.bpClass && !bpCss;
    var cssUnused = bpCss && !page.bpClass;

    return {
      missing: missing, anyOf: anyOf, unknown: unknown, unused: unused, dup: dup,
      failed: failed, orderErr: orderErr, cssMissing: cssMissing, cssUnused: cssUnused,
      notInTable: notInTable, loadedCount: Object.keys(loaded).length, base: base, fromSource: !!srcDoc
    };
  }

  /* ── 顯示 ── */
  function scriptTag(k, base) {
    var b = base[T[k].r] || DEFAULT_BASE[T[k].r];
    return '<div class="cc-code">' + esc('<script src="' + b + k + '"></script>') + '</div>';
  }

  function render(res) {
    var old = document.getElementById(BOX_ID);
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = BOX_ID;
    var css = '#' + BOX_ID + '{position:relative;z-index:99999;margin:0;padding:12px 18px;background:' + PAL.bg + ';color:' + PAL.text +
      ';font-family:"微軟正黑體","Inter",sans-serif;font-size:0.95rem;line-height:1.6;border-bottom:3px solid ' + PAL.urgent + ';text-align:left;}' +
      '#' + BOX_ID + '.cc-pass{border-bottom-color:' + PAL.green + ';}' +
      '#' + BOX_ID + '.cc-warn-only{border-bottom-color:' + PAL.yellow + ';}' +
      '#' + BOX_ID + ' .cc-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 0;}' +
      '#' + BOX_ID + ' .cc-title{font-weight:bold;color:' + PAL.key + ';}' +
      '#' + BOX_ID + ' .cc-btns button{margin:0 0 0 8px;padding:2px 10px;background:#0C0D0C;color:' + PAL.text + ';border:1px solid ' + PAL.text + ';border-radius:3px;font-size:0.85rem;cursor:pointer;}' +
      '#' + BOX_ID + ' .cc-item{margin:6px 0;padding:0 0 0 12px;border-left:3px solid ' + PAL.urgent + ';}' +
      '#' + BOX_ID + ' .cc-u{color:' + PAL.urgent + ';}' +
      '#' + BOX_ID + ' .cc-y{color:' + PAL.yellow + ';}' +
      '#' + BOX_ID + ' .cc-item.cc-warn{border-left-color:' + PAL.yellow + ';}' +
      '#' + BOX_ID + ' .cc-g{color:' + PAL.green + ';font-weight:bold;}' +
      '#' + BOX_ID + ' .cc-note{color:' + PAL.quiet + ';font-size:0.85rem;margin:6px 0 0 0;}' +
      '#' + BOX_ID + ' code{color:inherit;background:#0C0D0C;padding:0 5px;border-radius:3px;font-size:0.88rem;}' +
      '#' + BOX_ID + ' .cc-code{font-family:Consolas,monospace;font-size:0.85rem;color:' + PAL.text + ';background:#0C0D0C;padding:3px 8px;margin:3px 0 0 0;border-radius:3px;user-select:all;white-space:pre-wrap;word-break:break-all;}';

    var h = '<style>' + css + '</style>';
    h += '<div class="cc-head"><span class="cc-title">元件檢查</span><span class="cc-btns">' +
      '<button type="button" data-cc="rerun">重新檢查</button><button type="button" data-cc="close">關閉</button></span></div>';

    var urgent = [];
    Object.keys(res.missing).forEach(function (k) {
      urgent.push('<div class="cc-item cc-u">應載入 <code>' + esc(k) + '</code>（' + repoName(k) + '）：' + res.missing[k].join('；') + scriptTag(k, res.base) + '</div>');
    });
    res.anyOf.forEach(function (a) {
      var files = a.files.map(function (k) { return T[k] ? '<code>' + esc(k) + '</code>' : esc(k); }).join('、');
      var why = a.why || ('頁面用到 ' + tagList(a.tags));
      urgent.push('<div class="cc-item cc-u">應載入以下任一個：' + files + '；' + why + '</div>');
    });
    if (res.cssMissing) {
      urgent.push('<div class="cc-item cc-u">應載入 <code>bp-styles.css</code>：頁面用到 bp- 開頭的 class</div>');
    }
    res.failed.forEach(function (k) {
      urgent.push('<div class="cc-item cc-u">載入失敗 <code>' + esc(k) + '</code>：script 有寫，但元件沒有成功執行。請確認網址，或確認這個檔案已經從 UIWorld 同步過去</div>');
    });
    res.unused.forEach(function (k) {
      var why = T[k].o.length ? '頁面沒有 ' + tagList(T[k].o) : '頁面沒有用到它的功能';
      if (ATTR_NOTE[k]) why += '，也沒有' + esc(ATTR_NOTE[k]);
      urgent.push('<div class="cc-item cc-u">載入了卻沒用到 <code>' + esc(k) + '</code>：' + why + '</div>');
    });
    if (res.cssUnused) {
      urgent.push('<div class="cc-item cc-u">載入了卻沒用到 <code>bp-styles.css</code>：頁面沒有 bp- 開頭的 class</div>');
    }
    res.dup.forEach(function (k) {
      urgent.push('<div class="cc-item cc-u">重複載入 <code>' + esc(k) + '</code>：同一個檔案寫了不只一次，請刪掉多的那一行</div>');
    });
    res.orderErr.forEach(function (o) {
      urgent.push('<div class="cc-item cc-u">載入順序 <code>' + esc(o.first) + '</code> 要放在 ' +
        o.after.map(function (k) { return '<code>' + esc(k) + '</code>'; }).join('、') + ' 前面</div>');
    });

    var warn = [];
    if (res.unknown.length) {
      warn.push('<div class="cc-item cc-warn cc-y">對照表裡沒有這些標籤：' + tagList(res.unknown) +
        '。可能拼錯，或是對照表需要更新</div>');
    }

    res.notInTable.forEach(function (src) {
      warn.push('<div class="cc-item cc-warn cc-y">對照表裡沒有這個檔案：<code>' + esc(src) +
        '</code>。可能是網址打錯，或是新元件還沒加進對照表</div>');
    });

    if (!urgent.length && !warn.length) {
      box.className = 'cc-pass';
      h += '<div class="cc-g">元件檢查通過：載入 ' + res.loadedCount + ' 個元件檔，都有用到，沒有缺漏、重複、失敗或順序問題。</div>';
    } else {
      if (!urgent.length) box.className = 'cc-warn-only';
      h += urgent.join('') + warn.join('');
    }
    if (!res.fromSource && location.protocol !== 'about:') {
      h += '<div class="cc-note">讀不到這一頁的原始碼（例如直接用 file:// 開啟），改以目前畫面檢查。元件執行後會改寫部分標籤，「沒用到」可能誤報，建議用本機伺服器開啟再檢查一次。</div>';
    }
    box.innerHTML = h;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      if (b.getAttribute('data-cc') === 'close') box.remove();
      else run();
    });
    document.body.insertBefore(box, document.body.firstChild);
    window.scrollTo(0, 0);
  }

  function run() {
    var done = function (srcDoc) {
      var res;
      try { res = analyse(srcDoc); } catch (e) {
        res = null;
        var old = document.getElementById(BOX_ID);
        if (old) old.remove();
        var box = document.createElement('div');
        box.id = BOX_ID;
        box.style.cssText = 'padding:12px 18px;background:' + PAL.bg + ';color:' + PAL.urgent + ';font-size:0.95rem;';
        box.textContent = '元件檢查本身發生錯誤：' + e.message;
        document.body.insertBefore(box, document.body.firstChild);
        return;
      }
      render(res);
    };
    var fe = null;
    try { fe = window.frameElement; } catch (e) { fe = null; }
    if (fe && fe.hasAttribute('srcdoc')) {
      done(new DOMParser().parseFromString(fe.getAttribute('srcdoc'), 'text/html'));
    } else if (/^https?:$/.test(location.protocol)) {
      fetch(location.href, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
        .then(function (txt) { done(new DOMParser().parseFromString(txt, 'text/html')); })
        .catch(function () { done(null); });
    } else {
      done(null);
    }
  }

  window.ComponentCheck = { run: run, table: T };
  if (document.readyState === 'complete') setTimeout(run, 0);
  else window.addEventListener('load', function () { setTimeout(run, 0); });
})();
