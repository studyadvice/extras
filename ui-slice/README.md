# ui-slice

用斜線把一個矩形切成多個區域，每個區域放一張圖片的拼貼元件。長、寬預設各分成 10 等分，分割線的端點用「哪一條邊的第幾等分點」來描述，不需要算座標。

- 不依賴任何套件，只要載入一個 `ui-slice.js`
- 支援直線與模擬手繪線，圖片邊緣會跟著手繪曲線裁切
- 分割線可以接在外框，也可以接在前面的分割線上，可擴充到任意張數

## 目錄

- [快速開始](#快速開始)
- [常用版型](#常用版型)：兩張、三張、四張、五張、正方形、橫幅、更細的等分
- [外觀變化](#外觀變化)：純拼接、只畫線、鏤空、速寫風
- [控制圖片位置](#控制圖片位置)
- [寬度與長寬比](#寬度與長寬比)
- [排版流程：先 debug 再放圖](#排版流程先-debug-再放圖)
- [常見錯誤](#常見錯誤)
- [手繪強弱](#手繪強弱)、[端點寫法](#端點寫法)、[屬性](#ui-slice-屬性)、[區域編號規則](#區域編號規則)

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

## 常用版型

下面的區域編號都已用 `debug` 實際確認過。圖片檔名請換成自己的圖。

### 兩張：斜切左右

```html
<ui-slice ratio="16/9">
  <ui-cut from="top:6" to="bottom:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

區域 1 左、2 右。最常用的雙圖對比，例如「之前／之後」。

### 兩張：斜切上下

```html
<ui-slice ratio="16/9">
  <ui-cut from="left:3" to="right:7"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

區域 1 上、2 下。適合橫向的風景圖上下排。

### 三張：斜直條

```html
<ui-slice ratio="16/9">
  <ui-cut from="top:3" to="bottom:2"></ui-cut>
  <ui-cut from="top:7" to="bottom:6"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
</ui-slice>
```

區域 1 左、2 中、3 右。兩條線都接在上下兩邊，第二條線的兩端都落在右側區域，所以合法。

### 三張：一大兩小

```html
<ui-slice ratio="16/9">
  <ui-cut from="top:6" to="bottom:5"></ui-cut>
  <ui-cut from="cut1:5" to="right:5"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
</ui-slice>
```

區域 1 右上、2 左邊大區、3 右下。第二條線從 cut1 的中點接到右邊。主圖要放左邊大區時，寫 `region="2"`。

### 四張：斜十字

```html
<ui-slice ratio="16/9">
  <ui-cut from="top:6" to="bottom:5"></ui-cut>
  <ui-cut from="left:3" to="cut1:5"></ui-cut>
  <ui-cut from="cut1:5" to="right:6"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
  <img src="d.jpg">
</ui-slice>
```

區域 1 左上、2 右上、3 左下、4 右下。不能畫一條穿過 cut1 的橫線，所以拆成兩段：cut2 從左邊接到 cut1，cut3 再從 cut1 的同一點接到右邊。

### 五張：三欄再切兩刀

```html
<ui-slice ratio="16/9">
  <ui-cut from="top:3" to="bottom:2"></ui-cut>
  <ui-cut from="top:7" to="bottom:6"></ui-cut>
  <ui-cut from="left:6" to="cut1:6"></ui-cut>
  <ui-cut from="cut2:3" to="right:2"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
  <img src="d.jpg">
  <img src="e.jpg">
</ui-slice>
```

區域 1 右上小區、2 左上、3 中間、4 右下、5 左下。區域大小差很多時，編號不一定照直覺排，先開 `debug` 看清楚再放圖。

### 正方形：三條斜帶

```html
<ui-slice ratio="1:1">
  <ui-cut from="top:8" to="left:8"></ui-cut>
  <ui-cut from="bottom:3" to="right:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
</ui-slice>
```

區域 1 左上、2 中間斜帶、3 右下。兩條平行的對角線，切出三條斜帶。

### 橫幅：手繪四欄

```html
<ui-slice ratio="21/9" line="sketch" sketch-level="strong" seed="12">
  <ui-cut from="top:2" to="bottom:3"></ui-cut>
  <ui-cut from="top:5" to="bottom:6"></ui-cut>
  <ui-cut from="top:8" to="bottom:7"></ui-cut>
  <img src="a.jpg" region="3">
  <img src="b.jpg" region="2">
  <img src="c.jpg" region="1">
  <img src="d.jpg" region="4">
</ui-slice>
```

直線幾何下四欄的重心高度略有不同，編號由左到右是 3、2、1、4。想讓圖片由左到右照順序排，就用 `region` 指定，如範例所示。

### 更細的等分：divisions

```html
<ui-slice ratio="16/9" divisions="12">
  <ui-cut from="top:5" to="right:11"></ui-cut>
  <ui-cut from="bottom:7" to="cut1:7"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
  <img src="c.jpg">
</ui-slice>
```

區域 1 右上、2 左、3 右下。`divisions="12"` 時等分點是 1 到 11，可以切得更細；`cutN:k` 的 k 也跟著是 1 到 11。

## 外觀變化

以下都用「兩張：斜切左右」的分割示範，只改 `<ui-slice>` 的屬性。

### 純拼接：沒有間隙也沒有線

```html
<ui-slice ratio="16/9" gap="0" stroke-width="0">
  <ui-cut from="top:6" to="bottom:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

### 只畫線，不留間隙

```html
<ui-slice ratio="16/9" gap="0" stroke="#E3D322" stroke-width="3">
  <ui-cut from="top:6" to="bottom:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

### 看起來像鏤空

把 `gap-color` 設成和頁面背景同色，再加上同寬的 `frame`，圖片就像一塊塊浮在頁面上。

```html
<ui-slice ratio="16/9" gap="16" frame="16" stroke-width="0" gap-color="#0C0D0C">
  <ui-cut from="top:6" to="bottom:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

### 速寫風：狂野手繪線加外框

```html
<ui-slice ratio="16/9" line="sketch" sketch-level="wild" seed="21"
          gap="10" frame="10" gap-color="#2D2D2D" stroke="#FF91D7" stroke-width="2.5">
  <ui-cut from="top:6" to="bottom:3"></ui-cut>
  <img src="a.jpg">
  <img src="b.jpg">
</ui-slice>
```

`seed` 換一個數字就換一種筆觸；同一個 `seed` 每次畫出來都一樣，適合錄影重來。

## 控制圖片位置

```html
<ui-slice ratio="16/9" gap="8" stroke-width="0">
  <ui-cut from="top:6" to="bottom:5"></ui-cut>
  <ui-cut from="cut1:5" to="right:5"></ui-cut>
  <img src="city.jpg" region="2" focus="50% 20%">
  <img src="sunset.jpg" focus="right center">
  <img src="dawn.jpg" zoom="1.6" focus="70% 30%">
</ui-slice>
```

- 第一張寫了 `region="2"`，放進左邊大區；沒寫 `region` 的兩張依序補進剩下的區域 1、3。
- `focus` 決定裁切時保留圖片的哪一部分，例如 `50% 20%` 保留偏上方的內容。
- `zoom="1.6"` 先放大再裁切，適合只想顯示圖片局部。

## 寬度與長寬比

`<ui-slice>` 的寬度跟著外層容器，高度由 `ratio` 算出。想限制大小就限制外層：

```html
<div style="max-width:380px">
  <ui-slice ratio="3:2">
    <ui-cut from="top:6" to="bottom:3"></ui-cut>
    <img src="a.jpg">
    <img src="b.jpg">
  </ui-slice>
</div>
```

容器寬度改變時會自動重畫，放在格線或卡片裡也不用另外處理。

## 排版流程：先 debug 再放圖

1. 先只寫 `<ui-cut>`，加上 `debug`，不放圖片：

```html
<ui-slice ratio="16/9" debug>
  <ui-cut from="top:6" to="bottom:5"></ui-cut>
  <ui-cut from="cut1:5" to="right:5"></ui-cut>
</ui-slice>
```

2. 看畫面上的藍綠色外框等分點、粉紅色分割線等分點和黃色區域編號，調整 `from`、`to`。
3. 線條確定後拿掉 `debug`，依區域編號放入 `<img>`，需要時用 `region` 指定。

## 常見錯誤

每一種錯誤都會在元件裡顯示紅色說明框，不會畫出錯亂的圖。

| 寫法 | 錯誤訊息 | 改法 |
|---|---|---|
| `<ui-cut from="cut1:3" to="right:5">` 寫在第一條 | 第一條分割線只能接在外框上 | 第一條線的兩端都要在 `top`、`right`、`bottom`、`left` 上 |
| `<ui-cut from="top:10" to="bottom:3">` | 等分點必須介於 1 到 9 | 預設 `divisions="10"`，k 只能是 1 到 9；要更細就加大 `divisions` |
| 先 `top:6`→`bottom:3`，再 `left:2`→`right:8` | 兩端沒有落在同一個區域的邊界上 | 第二條線會穿過第一條，要拆成兩段，參考「四張：斜十字」 |
| 兩個區域只放一張 `<img>` | 黃色提醒：缺少 1 張圖片 | 圖片數量要等於區域數量；缺圖的區域顯示底色 |

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
