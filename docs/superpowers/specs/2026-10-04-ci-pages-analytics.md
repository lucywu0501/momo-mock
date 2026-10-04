# Validation / Observability：CI、GitHub Pages、站內分析 — 規格

> 日期：2026-10-04。由 `/grill-with-docs` 對談定案（Q1–Q24），本檔為 shared understanding 的正式版。
> 詞彙依 `CONTEXT.md`；實作計畫見 `docs/superpowers/plans/2026-10-04-ci-pages-analytics.md`。

## 目標

為 take-home 的「Validation / Observability Thinking」補上三件事：GitHub Actions 每次上版自動驗證、GitHub Pages 自動部署、站內 Analytics Event 的記錄與統計頁。全部沿用「service layer 為 mock 邊界」的既有原則：UI 不知道資料來自 mock，也不知道有分析存在。

## Validation（CI）

- `.github/workflows/ci.yml`，觸發 `push`（所有分支）＋ `pull_request` to main。兩個 job：
  - `check`：`npm ci` → `tsc -b` → `oxlint` → `vitest run` → `vite build`。
  - `e2e`：Playwright（僅 Chromium），對 `vite preview` 的 production build 跑 `e2e/` 下三支 spec。失敗時上傳 HTML report＋trace 為 artifact。
- 三支 E2E：
  1. 購物主流程：首頁搜尋「耳機」→ 點第一件商品 → 選規格、數量 2、加入購物車 → badge 顯示 2 → 購物車頁調量至 3 → 總計正確 → 重整後仍在 → localStorage 的分析事件含 `add_to_cart`。
  2. URL 即狀態：直連 `/search/3C?sort=priceAsc` 還原排序（按鈕 active、第一件為最低價）；按下一頁 URL 帶 `page=2` 且顯示「頁數 2/2」。
  3. 錯誤路徑：`/goods/nope` 顯示「很抱歉！此商品目前無展售」；未知路由顯示 404。
- Selector 以 role／可見文字為主；只有購物車 badge 加 `data-testid="cart-badge"`。
- 不做視覺快照；Agent 截圖對照保留為人工驗收層。
- Node 以 `.nvmrc` 釘 24，CI 用 `node-version-file`。不開 branch protection。

## Deployment（GitHub Pages）

- `.github/workflows/deploy.yml`：`workflow_run` 監聽 CI 在 main 成功後，`vite build --base=/momo-mock/`，複製 `dist/index.html` 為 `dist/404.html`（SPA fallback），部署至 GitHub Pages。
- router 已用 `import.meta.env.BASE_URL` 作 basename，應用程式碼不需改。
- Pages 來源設為 GitHub Actions（API `build_type=workflows`）。
- README 加 CI badge 與 live URL。

## Observability（站內分析）

- `src/services/analytics.ts`：型別化 Analytics Event 介面＋ mock sink（localStorage 單一 key `momo-mock.analytics.v1`、ring buffer 500 筆、dev 模式 console.debug）。七種事件，共用 `timestamp`：

| 事件 | 欄位 |
|---|---|
| `page_view` | path |
| `search` | keyword、category、brand、tag、minPrice、maxPrice、sort、resultCount |
| `view_product` | productId、category |
| `add_to_cart` | productId、variant、qty |
| `remove_from_cart` | productId、variant |
| `checkout_click` | cartTotal、itemCount |
| `error` | message、path |

- 事件由 hooks／store／app 層發出：`useSearch`（search）、`useGoodsDetail`（view_product）、`useCart`（add／remove／checkout）、`RootLayout`（page_view）、router `errorElement`（error）。元件不直接呼叫 analytics。
- 儲存失敗（配額滿、隱私模式）或內容損毀時，分析層靜默失敗，不影響購物流程。
- `features/stats/` ＋ `/stats` 路由：純 CSS 長條圖（單一色相 momo 桃紅、文字用文字色、hover 顯示數值），呈現事件次數、熱門搜尋詞、零結果搜尋詞、加購最多商品、最近錯誤；附「清除紀錄」按鈕。Footer 放「站內統計」連結，production 可見。

## 文件

- `CONTEXT.md` 已建立（含 Analytics Event）。
- README：tradeoff 表「測試」列更新（E2E 移至選擇、snapshot 留在放棄並說明為何 E2E 不含快照）；演進方向移除已完成項、新增 Sentry／Lighthouse CI／branch protection／真實分析 SDK；驗證策略加 CI 層；新增 Observability 段落。
- worklog 新增 Task 13。
- 不開 ADR（所有決策可逆，記在 README tradeoff 表）。

## 刻意不做

coverage 門檻、Lighthouse CI、`set_qty` 事件、事件匯出、真實分析 SDK、輪播與 RWD 的 E2E、視覺快照、branch protection。
