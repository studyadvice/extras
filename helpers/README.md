# component-check 元件載入檢查

錄影前用書籤檢查教材頁：哪些元件應載入卻沒載入、哪些載入了卻沒用到。結果顯示在頁面最頂端，不寫入主控台。頁面本身不需要加任何程式碼，檢查完按「關閉」，頁面不會留下任何東西。

單一檔案 `component-check.js`，不使用 Shadow DOM。範例頁：[`component-check-demo-11-27-26.html`](component-check-demo-11-27-26.html)。

## 目錄

- [加入書籤](#加入書籤)
- [檢查項目](#檢查項目)
- [對照表](#對照表)
- [限制](#限制)
- [更新後立即生效](#更新後立即生效)
- [授權](#授權)

## 加入書籤

在瀏覽器書籤列新增一個書籤，名稱填「檢查元件」，網址貼上：

```
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/studyadvice/extras@main/helpers/component-check.js?t='+Date.now();document.body.appendChild(s);})();
```

也可以打開範例頁，把「檢查元件」按鈕直接拖到書籤列。

使用方式：打開教材頁，點書籤。修改頁面後，按頂端的「重新檢查」。

## 檢查項目

| 顏色 | 項目 | 說明 |
| --- | --- | --- |
| urgent | 應載入卻沒載入 | 頁面用到某個元件的標籤，卻沒有載入它的 js。提示會附上可以直接複製的 `<script>`，網址沿用頁面上同一個 repo 的其他 script。 |
| urgent | 載入了卻沒用到 | 載入的 js 負責的標籤，頁面上一個都沒有。 |
| urgent | 重複載入 | 同一個 js 寫了不只一次。 |
| urgent | 載入失敗 | script 有寫，但元件沒有成功執行。通常是網址錯誤，或新元件還沒從 UIWorld 同步到 workforce。 |
| urgent | 載入順序 | 例如 `ui-repeat.js` 要放在其他元件前面。 |
| yellow | 對照表裡沒有 | 找不到的標籤或 studyadvice 的檔案。可能拼錯，或是對照表需要更新。 |
| green | 全部通過 | 一行綠字，不會自動消失。 |

除了標籤，也會檢查以下情況：

- 寫了 `frame` 的 `<template>`、`<card-detail>`、`<card-back>`，外框由 `ui-frame.js` 繪製，需要載入它。
- `toast`、`data-popover-*` 等靠屬性啟動的功能，以及 `*-beyond.js` 這類附加檔。
- 頁面用到 `bp-` 開頭的 class 時，需要載入 `bp-styles.css`。
- `<template>` 裡的標籤也會檢查。

## 對照表

對照表寫在 `component-check.js` 開頭，由 UIWorld 與 extras 的原始碼掃描產生，記錄每個 js 檔負責哪些標籤、哪些標籤可以由多個檔案處理。workforce 是 UIWorld 的複本，提示裡的路徑以 UIWorld 為準。

元件新增、改名或刪除後，請 Claude「重新掃描對照表」，不要手改。

## 限制

- 讀得到頁面原始碼時（http、https 開啟），以原始碼和目前畫面一起檢查，最準確。
- 直接用 `file://` 開啟時讀不到原始碼，只能以目前畫面檢查。部分元件執行後會改寫標籤，可能誤報「沒用到」或漏掉拼錯的標籤；頂端會顯示一行說明。建議用本機伺服器開啟再檢查一次。
- 由頁面程式動態產生的內容，要等它出現在畫面上之後再按「重新檢查」。

## 更新後立即生效

書籤指向 `@main`，推送新版後，jsDelivr 的快取可能要等一段時間才更新。要立即生效，在瀏覽器打開：

```
https://purge.jsdelivr.net/gh/studyadvice/extras@main/helpers/component-check.js
```

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
