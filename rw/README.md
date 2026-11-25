# rect-weave

`<rect-weave>` 是裝飾用的矩形交織圖。只用水平線與垂直線，轉角一律直角；矩形大小不一，彼此穿過、相連成一團，由亂數生成。寫上 `seed` 就能固定成同一張圖，錄影重來也一樣。也可以在其中的矩形放圖片。元件不使用 Shadow DOM，不需要任何外部資源，離線也能用。

| 檔案 | 標籤 | 用途 |
| --- | --- | --- |
| `rect-weave.js` | `<rect-weave>` | 矩形交織圖。 |
| `rect-weave-demo-11-25-26.html` | | 範例（越新越上面）：放圖片、多張圖片與單色調、基本、交織與多色、形狀與鬆緊、每次都不一樣、違反規則。 |
| `demo-sunset.jpg`、`demo-city.jpg`、`demo-dawn.jpg` | | 範例頁用的圖片。 |

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

## 圖片

| 屬性 | 預設 | 說明 |
| --- | --- | --- |
| `image` | 無 | 圖片網址；用逗號寫多張時，分別放進不同的矩形。名稱同 ui-cards。 |
| `image-pick` | `fit` | 選哪個矩形放圖片，見下表。 |
| `image-tone` | 無 | 把圖片轉成單色調，例如 `image-tone="key"`：暗部是底色 `#0C0D0C`，亮部是指定的顏色。 |

| `image-pick` | 做法 |
| --- | --- |
| `fit` | 挑形狀最接近圖片比例的矩形，裁掉最少；比例差不多時挑大的。 |
| `any` | 在不太細的矩形裡依 seed 任選。 |
| `center` | 生成時先依圖片比例放好矩形，第一張在中央附近，其他矩形再圍著長。比例最準。 |

- 「不太細」是指短邊至少 3 格、長邊不超過短邊的 2.5 倍；`fit` 與 `any` 都只從這些矩形裡挑。
- 圖片不變形，多的部分裁掉。
- 多張圖片時，放圖片的矩形彼此不重疊（可以貼著邊），圖片不會互相蓋住。`fit`、`any` 真的找不到不重疊的矩形時才會重疊。
- 圖片蓋在其他矩形的線上面，放圖片的矩形自己的邊框畫在圖片上。
- 圖片沒有動畫，邊框照常依序畫出。
- 圖片要先載入才知道比例，所以有圖片時整張圖會等圖片都載入後才出現。

```html
<rect-weave seed="1125" image="photo.jpg"></rect-weave>
<rect-weave seed="1125" image="a.jpg, b.jpg" image-pick="any" image-tone="key"></rect-weave>
```

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
| `image-pick` 的值不在清單裡；`image` 或 `image-tone` 沒有寫值 |
| 圖片比 `count` 多 |
| 圖片載入失敗 |
| 適合放圖片的矩形（不太細的）比圖片少 |

## 授權

MIT License

Copyright (c) 2026 studyadvice

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
