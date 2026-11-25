# rect-weave

`<rect-weave>` 是裝飾用的矩形交織圖。只用水平線與垂直線，轉角一律直角；矩形大小不一，彼此穿過、相連成一團，由亂數生成。寫上 `seed` 就能固定成同一張圖，錄影重來也一樣。元件不使用 Shadow DOM，不需要任何外部資源，離線也能用。

| 檔案 | 標籤 | 用途 |
| --- | --- | --- |
| `rect-weave.js` | `<rect-weave>` | 矩形交織圖。 |
| `rect-weave-demo-11-25-26.html` | | 範例：基本、交織與多色、形狀與鬆緊、每次都不一樣、違反規則。 |

## 快速開始

```html
<rect-weave width="360" height="420" count="13" seed="1125" show-grid></rect-weave>

<script src="rect-weave.js"></script>
```

## 屬性

| 屬性 | 預設 | 說明 |
| --- | --- | --- |
| `width`、`height` | `360`、`420` | 整張圖的寬和高（px）。 |
| `count` | `12` | 矩形數量。 |
| `seed` | 隨機 | 亂數種子，同一個值每次畫出同一張圖。不寫就每次不同，主控台會印出這次的 seed，抄下來寫上就能固定。 |
| `grid` | `18` | 點陣間距（px），矩形的邊都對齊到格線。 |
| `show-grid` | 關 | 畫出背景點陣。 |
| `grid-color` | `#2D2D2D` | 點陣的顏色。 |
| `min-size`、`max-size` | `3`、`11` | 矩形邊長的最小、最大格數。 |
| `shape` | `mix` | `mix` 各種比例混合、`wide` 多半是橫條、`tall` 多半是直條、`square` 接近正方形。指定比例時仍有三成是混合的，才會交織。 |
| `density` | `0.5` | 0 到 1，越高越往中央擠，越低越鬆散。 |
| `color` | `key` | 線的顏色，色票名稱或色碼；用逗號寫多個顏色時，每個矩形輪流使用。 |
| `line-width` | `3` | 線的粗細（px）。 |
| `line-style` | `solid` | `solid`、`dashed`、`dotted`。 |
| `weave` | 關 | 交叉的地方一上一下，像編織。 |
| `draw-speed` | `600` | 每個矩形畫出來的時間（ms）。 |
| `stagger` | `188` | 矩形依序出現的間隔（ms）。 |
| `no-animation` | 關 | 直接顯示，不播放畫線動畫。 |

轉角一律直角，沒有圓角屬性。

屬性名稱沿用 studyadvice 其他元件：`color`、`line-width`、`line-style`、`draw-speed`、`stagger`、`no-animation` 同 ui-guide 與 ui-connect，`seed` 同 mark-fx，`show-grid` 同 route-map。

## 生成方式

1. 依 `width`、`height`、`grid` 算出點陣格數。
2. 第一個矩形放在中央附近，之後每個矩形都要和已有的矩形重疊或相接，所以整團一定相連。
3. 不會有兩個同尺寸的矩形，也不會有矩形整個包住另一個。
4. 選位置時偏好穿過別的矩形的邊，避開邊重合或只差一格的位置，看起來才像交織，不像平面圖。
5. 同一個 seed 放不下時，會用同一串亂數整張重來幾次，結果仍然固定。

## 方法與事件

| 方法 | 說明 |
| --- | --- |
| `regenerate(seed)` | 重新生成。給 seed 就用那個 seed，不給就隨機。 |
| `replay()` | 重播畫線動畫。 |

| 事件 | `detail` | 時機 |
| --- | --- | --- |
| `rect-weave:end` | `{ seed }` | 畫線動畫結束。 |

## 規則

違反下列任何一條，整張圖不顯示，並在主控台印出紅字錯誤。看到一片空白就表示寫錯了。

| 情況 |
| --- |
| `width`、`height`、`count`、`grid`、`min-size`、`max-size` 不是正整數 |
| `min-size` 大於 `max-size` |
| `max-size` 超過圖的格數，或 `min-size` 超過圖較短邊的格數 |
| `shape`、`line-style` 的值不在清單裡 |
| `density` 不在 0 到 1 之間；`line-width` 不是正數；`draw-speed`、`stagger` 不是數字 |
| 矩形太多或圖太小，重試後仍放不下 |

## 授權

MIT License

Copyright (c) 2026 studyadvice

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
