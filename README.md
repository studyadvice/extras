# extras

教學網頁用的獨立特效元件。每個元件都是單一 `.js` 檔，載入後自動注入樣式，不使用 Shadow DOM，不需要任何外部資源，離線也能用。顏色屬性都可以直接寫色票名稱（例如 `key`、`bg-alternative`），也可以寫任何 CSS 顏色。


| 資料夾 | 檔案 | 標籤 | 用途 | 說明 | 範例頁 |
| --- | --- | --- | --- | --- | --- |
| `chest/` | `treasure-chest.js` | `<treasure-chest>` `<chest-prize>` | 獎勵開啟動畫：寶箱、獎盃、禮物盒、轉蛋機，噴出金色光芒、星光、金幣或彩紙，完結後可顯示或刪除指定元素。 | [chest/README.md](chest/README.md) | [`treasure-chest-demo-11-21-26.html`](chest/treasure-chest-demo-11-21-26.html) |
| `chest/` | `cycling-sprint.js` | `<cycling-sprint>` `<sprint-result>` | 單車選手衝刺終點動畫：起步、加速、撞斷終點彩帶、彩紙噴出、舉手歡呼，最後顯示成績；背景有視差捲動的山景與看台，可加 0 到 2 位對手。 | 見 [`cycling-sprint.js`](chest/cycling-sprint.js) 開頭註解 | [`cycling-sprint-demo-11-18-26.html`](chest/cycling-sprint-demo-11-18-26.html) |
| `chest/` | `ui-opener.js` | `<ui-opener>` | 課程片頭動畫：夜間城市與高架捷運。 | 見 [`ui-opener.js`](chest/ui-opener.js) 開頭註解 | [`ui-opener-demo-11-19-26.html`](chest/ui-opener-demo-11-19-26.html) |
| `ui-slice/` | `ui-slice.js` | `<ui-slice>` `<ui-cut>` | 斜線分割拼貼：用斜線把矩形切成多個區域，每個區域放一張圖片；支援直線與模擬手繪線。 | [ui-slice/README.md](ui-slice/README.md) | [`ui-slice-demo-11-24-26.html`](ui-slice/ui-slice-demo-11-24-26.html) |
| `rw/` | `rect-weave.js` | `<rect-weave>` | 矩形交織裝飾圖：只用水平與垂直線，大小不一的矩形彼此穿過、相連成一團，亂數生成，可用 seed 固定。 | [rw/README.md](rw/README.md) | [`rect-weave-demo-11-25-26.html`](rw/rect-weave-demo-11-25-26.html) |

## 使用方式

```html
<treasure-chest type="trophy" size="220">
  <chest-prize>Band 7.0 達成！</chest-prize>
</treasure-chest>

<script src="https://cdn.jsdelivr.net/gh/studyadvice/extras@v1.3/chest/treasure-chest.js"></script>
```

## 色票

| 名稱 | 色碼 | 名稱 | 色碼 | 名稱 | 色碼 |
| --- | --- | --- | --- | --- | --- |
| base | `#0C0D0C` | bg-alternative | `#2D2D2D` | shell | `#C6C7BD` |
| vanilla | `#DBEDD8` | yellow | `#E3D322` | pink | `#FF91D7` |
| red | `#EF6661` | green | `#71CD76` | blue | `#5DBAE8` |
| indigo | `#778CE1` | violet | `#B484E8` | gray | `#86877F` |
| key | `#51DBCF` | calm | `#A3C4BC` | quiet | `#8EA4DE` |
| playful | `#FFA987` | urgent | `#FF2E63` | energetic | `#B6FF00` |
| dreamy | `#C394CD` | salmon | `#FFC88A` | | |

## 授權

本專案以 MIT 授權釋出。

```
MIT License

Copyright (c) 2026 Nelson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
