# ui-slice

用斜線把一個矩形切成多個區域，每個區域放一張圖片的拼貼元件。長、寬預設各分成 10 等分，分割線的端點用「哪一條邊的第幾等分點」來描述，不需要算座標。

- 不依賴任何套件，只要載入一個 `ui-slice.js`
- 支援直線與模擬手繪線，圖片邊緣會跟著手繪曲線裁切
- 分割線可以接在外框，也可以接在前面的分割線上，可擴充到任意張數

## 快速開始

```html
<script src="ui-slice.js"></script>

<ui-slice ratio="16/9">
  <ui-cut from="top:3" to="right:9"></ui-cut>
  <ui-cut from="bottom:7" to="cut1:4"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
</ui-slice>
```

第一條線從上邊第 3 等分點連到右邊第 9 等分點；第二條線從下邊第 7 等分點連到第一條線的第 4 等分點。兩條線切出三個區域，三張圖依區域編號放入。

## 手繪強弱

`line="sketch"` 時，用 `sketch-level` 選擇筆觸強弱。四級不只是幅度不同，彎曲的頻率和雙線分離的程度也不同：

| 等級 | 筆觸 |
|---|---|
| `subtle` | 幾乎是直線，只有緩和的起伏 |
| `normal` | 自然的手繪感 |
| `strong` | 起伏明顯，雙線分離較開 |
| `wild` | 大幅彎曲並帶有細碎抖動，像速寫 |

```html
<ui-slice line="sketch" sketch-level="strong" roughness="1.3">...</ui-slice>
```

## 端點寫法

| 寫法 | 位置 | 計數方向 |
|---|---|---|
| `top:k` | 上邊 | 由左往右 |
| `bottom:k` | 下邊 | 由左往右 |
| `left:k` | 左邊 | 由上往下 |
| `right:k` | 右邊 | 由上往下 |
| `cutN:k` | 第 N 條分割線 | 從該線的 `from` 端往 `to` 端 |

- `k` 必須介於 1 到「等分數減 1」，預設是 1 到 9。
- `cutN` 只能參照排在前面的分割線，第一條線的兩端都必須在外框上。
- 一條線的兩端必須落在同一個區域的邊界上，否則線會穿過其他分割線，元件會顯示錯誤說明。

## `<ui-slice>` 屬性

| 屬性 | 預設值 | 說明 |
|---|---|---|
| `ratio` | `16/9` | 長寬比，可寫 `16/9`、`3:2` 或 `1.5` |
| `line` | `straight` | `straight` 直線；`sketch` 模擬手繪線 |
| `gap` | `6` | 區域之間的間隙寬度（px），`0` 表示不留 |
| `gap-color` | `#0C0D0C` | 間隙與外框的顏色 |
| `frame` | `0` | 外框留邊寬度（px） |
| `stroke` | `#C6C7BD` | 分割線顏色 |
| `stroke-width` | `2` | 分割線粗細（px），`0` 表示不畫線 |
| `seed` | `7` | 手繪抖動的亂數種子，同一個種子每次畫出來都一樣 |
| `sketch-level` | `normal` | 手繪強弱：`subtle` 輕微、`normal` 標準、`strong` 明顯、`wild` 狂野 |
| `roughness` | `1` | 在同一級內微調抖動幅度，例如 `0.8` 稍弱、`1.3` 稍強，`0` 等於直線 |
| `divisions` | `10` | 每條邊與每條分割線的等分數 |
| `debug` | 無 | 加上後會標出等分點、線名與區域編號 |

## `<img>` 屬性

| 屬性 | 說明 |
|---|---|
| `src` | 圖片網址 |
| `focus` | 裁切焦點，語意同 CSS `object-position`，例如 `50% 30%`、`right center` |
| `zoom` | 放大倍率，最小為 `1` |
| `region` | 直接指定放進第幾區，沒有指定的圖片依序補進剩下的區域 |

圖片會等比放大到蓋滿區域的外接矩形，再依 `focus` 決定偏移。

## 區域編號規則

區域依重心位置**由上往下**編號，重心高度相同時再**由左往右**。編號以直線幾何計算，切換成手繪線也不會改變。排版時加上 `debug` 屬性，就能直接看到每一區的編號。

以快速開始的設定為例：區域 1 是右上三角，區域 2 是左側，區域 3 是右下。

## 提示訊息

- **設定錯誤**（紅色）：端點格式錯誤、等分點超出範圍、參照了後面的分割線、兩端不在同一區域。這時不會畫圖。
- **提醒**（黃色）：圖片數量和區域數量不符，或圖片載入失敗。圖仍會畫出，缺圖的區域顯示底色。開啟 `debug` 時不提醒缺圖。

提示框帶有 Bootstrap 的 `alert` 類別；沒有載入 Bootstrap 時也有內建樣式。

## 注意事項

- 間隙是沿著分割線畫一條 `gap-color` 色的粗線，因此是實心色，不是鏤空。把 `gap-color` 設成與頁面背景相同，看起來就像鏤空。
- 元件不使用 shadow DOM，樣式會注入到 `<head>`，選擇器都以 `ui-slice` 開頭。
- 容器尺寸改變時會自動重畫；修改 `<ui-cut>` 或 `<img>` 的屬性也會自動更新。

## License

MIT License

Copyright (c) 2026 studyadvice

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
