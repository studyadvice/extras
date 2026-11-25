# treasure-chest 獎勵開啟動畫

`<treasure-chest>` 播放一段開啟獎勵的動畫：先搖晃，再打開，背後射出旋轉的金色光芒，星光與金幣（或彩紙）噴出，獎品從開口升起。四種圖形用 `type` 切換。圖形是 SVG，光芒與粒子畫在 canvas 上；光芒以實色漸層過渡到 `bg` 背景色、以亮度相加的方式疊亮，不使用透明度。

單一檔案 `treasure-chest.js`，CSS 內建，不使用 Shadow DOM，不需要任何外部資源。範例頁：[`treasure-chest-demo-11-21-26.html`](treasure-chest-demo-11-21-26.html)。

## 目錄

- [快速開始](#快速開始)
- [四種圖形](#四種圖形)
- [屬性](#屬性)
- [完結後顯示或刪除元素](#完結後顯示或刪除元素)
- [方法與事件](#方法與事件)
- [搭配 link-when](#搭配-link-when)
- [版本紀錄](#版本紀錄)
- [授權](#授權)

## 快速開始

```html
<treasure-chest size="240" replay>
  <chest-prize>Band 7.0 達成！</chest-prize>
</treasure-chest>

<script src="treasure-chest.js"></script>
```

`<chest-prize>` 裡寫獎品內容，可以是任何 HTML；不寫就不顯示獎品框。

## 四種圖形

| type | 開啟動作 | 噴出物 | chest-color 預設 | trim-color 預設 | hint 預設 | 完結時間 |
| --- | --- | --- | --- | --- | --- | --- |
| `chest`（預設） | 箱蓋往後翻開 | 10 枚金幣 | `#8A5530` 木頭 | `#E8B931` 金屬 | 點擊打開 | 約 2.1 秒 |
| `trophy` | 杯子從底座往上一頂，杯口亮起，再落回底座；反光每 2.8 秒掃過 | 8 枚金幣 | `#3B2A20` 底座 | `#E8B931` 杯身 | 點擊領獎 | 約 2.3 秒 |
| `gift` | 盒蓋連蝴蝶結彈飛，盒口亮起 | 40 片彩紙 | `#EF6661` 盒子 | `#E3D322` 緞帶 | 點擊拆開 | 約 2.1 秒 |
| `gacha` | 旋鈕轉兩圈，扭蛋滾出、飛到正前方放大後掀開 | 不噴 | `#EF6661` 機身 | `#C6C7BD` 金屬零件 | 點擊轉一次 | 約 3.5 秒 |

完結時間以預設 `shake="0.5"` 計算。寫錯 `type` 會在主控台提醒，並改用 `chest`。

## 屬性

| 屬性 | 預設 | 說明 |
| --- | --- | --- |
| `type` | `chest` | 圖形：`chest`、`trophy`、`gift`、`gacha`。 |
| `size` | `220` | 圖形寬度（px）。整個舞台約為寬 2.2 倍、高 1.95 倍。 |
| `trigger` | `click` | `click`：點擊開啟；`auto`：捲動到畫面中自動開啟；`none`：只用 `open()` 開啟。 |
| `delay` | `300` | `trigger="auto"` 時，出現在畫面上之後等幾毫秒再開。 |
| `replay` | 關 | 已開啟後再點一次會關回原狀，可以重來。 |
| `bg` | `base` | 舞台背景色。光芒邊緣會過渡到這個顏色，請設成和放置位置相同的底色。 |
| `gold`、`light` | `yellow`、`#FFF6C8` | 光芒的主色與最亮的中心色。 |
| `chest-color` | 依 type | 主體色：寶箱木頭、獎盃底座、禮物盒、轉蛋機機身。明暗自動計算。 |
| `trim-color` | 依 type | 配件色：寶箱金屬、獎盃杯身、緞帶與蝴蝶結、轉蛋機金屬零件。寶箱與獎盃的金幣也用這個顏色，其他圖形的金幣用 `gold`。 |
| `capsule-color` | `pink` | 轉蛋機掉出的那顆扭蛋顏色。 |
| `rays` | `14` | 光芒條數；`0` 不畫光芒，只有光暈。 |
| `ray-speed` | `10` | 光芒旋轉速度（度／秒）。 |
| `sparkles` | `80` | 開啟瞬間噴出的星光數量。 |
| `coins` | 依 type | 噴出物數量：寶箱、獎盃是金幣，禮物盒是彩紙，轉蛋機預設 `0`；`0` 不噴。 |
| `ambient` | `true` | 開啟後開口持續冒出細小星光；寫 `false` 關閉。 |
| `shake` | `0.5` | 開啟前的搖晃強度，`0` 到 `1`，越大搖得越明顯、時間越長，大於 `0.4` 時還會往上跳；`0` 直接開啟。舊寫法 `true` 等同 `0.5`、`false` 等同 `0`。 |
| `hint` | 依 type | `trigger="click"` 時圖形下方的提示文字；寫空字串不顯示。 |
| `prize-bg`、`prize-color`、`prize-size` | `base`、`yellow`、`1.4rem` | 獎品框的底色、文字色、字級（只寫數字視為 rem）。外框用 `gold` 的顏色。 |
| `reveal-targets` | 無 | 動畫完結後要顯示的元素。 |
| `remove-targets` | 無 | 動畫完結後要從頁面刪除的元素。 |

所有顏色屬性都可以寫色票名稱或任何 CSS 顏色，例如：

```html
<treasure-chest type="trophy" chest-color="indigo" trim-color="shell" gold="quiet" light="#F2F5FF" prize-color="shell">
  <chest-prize>銀盃</chest-prize>
</treasure-chest>
```

## 完結後顯示或刪除元素

```html
<treasure-chest type="gift" reveal-targets="rv-a,rv-b" remove-targets="rv-lock">
  <chest-prize>測驗滿分</chest-prize>
</treasure-chest>

<div id="rv-lock">尚未解鎖：拆開禮物後才能看到下一步。</div>
<div id="rv-a" hidden>解鎖 1：Part 2 口說題卡</div>
<div id="rv-b" style="display:none">解鎖 2：本課語塊表下載</div>
```

- 執行時機：動畫完結那一刻（獎品升起、光芒展開之後），與 `treasure-chest:opened` 事件同時。
- 寫法：用逗號分隔；只寫 id 可以省略 `#`，也可以寫選擇器，例如 `.tip`、`#box p`。找不到的項目會在主控台提醒。
- 顯示：拿掉 `hidden`、清掉 `display:none`，並往上浮現；CSS 本身設為 `display:none` 的元素會改成 `display:block`。
- 刪除：從頁面移除。
- `reset()`：顯示過的再藏起來，刪除過的放回原來的位置。

## 方法與事件

| 項目 | 類型 | 說明 |
| --- | --- | --- |
| `open()` | 方法 | 開啟；已經打開時不作用。 |
| `play()` | 方法 | 同 `open()`，給 link-when 的 `do="play"` 使用。 |
| `reset()` | 方法 | 關回原狀，可以再開一次；同時還原 `reveal-targets` 與 `remove-targets`。 |
| `opened` | 唯讀屬性 | 動畫是否已完結。 |
| `type` | 唯讀屬性 | 目前的圖形名稱。 |
| `treasure-chest:open` | 事件 | 開始開啟。`detail`：`{ type }`。 |
| `treasure-chest:opened` | 事件 | 動畫完結。`detail`：`{ type, revealed, removed }`，後兩個是元素陣列。 |
| `treasure-chest:reset` | 事件 | 關回原狀。 |

事件都會冒泡。

```js
const chest = document.querySelector('treasure-chest');
chest.addEventListener('treasure-chest:opened', e => console.log(e.detail.type, e.detail.revealed));
chest.open();
```

## 搭配 link-when

[studyadvice/ielts](https://github.com/studyadvice/ielts) 的 `<link-when>` 可以直接串接，不需要修改 link-when.js；兩個檔案誰先載入都可以。

```html
<!-- 對話播完 → 寶箱彈出並開啟（do 預設 play） -->
<link-when source="#lesson" target="#chest" delay="400" enter="pop"></link-when>

<!-- 寶箱開完（event="done" ＝ treasure-chest:opened）→ 顯示下一課 -->
<link-when source="#chest" target="#next" do="show" delay="300" enter="slide-up"></link-when>

<script src="https://cdn.jsdelivr.net/gh/studyadvice/ielts@v1.5/lw/link-when.js"></script>
<script src="treasure-chest.js"></script>
```

- 寶箱當 target：`do="play"`（預設）開啟，`do="reset"` 關回原狀，`do="show"` 只顯示（搭配 `trigger="auto"` 顯示後會自動開啟）。
- 寶箱當 source：`event="done"` 等到動畫完結；`event="treasure-chest:open"` 一開始就觸發。

範例頁的範例 5 從 jsDelivr 載入 ielts v1.5 的 ui-stream 與 link-when，需要連網；其他範例離線也能用。

## 版本紀錄

| 版本 | 內容 |
| --- | --- |
| v1.3 | 新增 `type`：獎盃、禮物盒、轉蛋機；新增 `capsule-color`、`reveal-targets`、`remove-targets`；事件 `detail` 加入 `type`、`revealed`、`removed`。首次在本 repo 發布。 |
| v1.2 | `shake` 改為 `0` 到 `1` 的強度，大於 `0.4` 會往上跳。 |
| v1.1 | 支援 link-when：新增 `play()`，`event="done"` 對應 `treasure-chest:opened`。 |
| v1.0 | 寶箱開啟動畫。 |

## 授權

MIT，見 repo 根目錄的 [LICENSE](../LICENSE)。
