# momo mock — Frontend Take-home（題目 A：Mocking momoshop）

[![CI](https://github.com/lucywu0501/momo-mock/actions/workflows/ci.yml/badge.svg)](https://github.com/lucywu0501/momo-mock/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/lucywu0501/momo-mock?label=release)](https://github.com/lucywu0501/momo-mock/releases)
[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-ec008c)](https://lucywu0501.github.io/momo-mock/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![semantic-release](https://img.shields.io/badge/semantic--release-conventional%20commits-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

純前端模擬 momo 購物網：首頁、搜尋（篩選/排序/分頁）、商品詳情、購物車、發現頁。無任何真實 API 呼叫。

## 線上 Demo

**👉 https://lucywu0501.github.io/momo-mock/**

每次 merge 到 `main` 並通過 CI 後，GitHub Actions 會自動重新部署，網址內容永遠對應 `main` 最新版。可直接試：

- 首頁：[`/`](https://lucywu0501.github.io/momo-mock/)
- 搜尋：[`/search/3c`](https://lucywu0501.github.io/momo-mock/search/3c)（篩選/排序/分頁都在 URL 上，可直接分享）
- 購物車：[`/cart`](https://lucywu0501.github.io/momo-mock/cart)（localStorage 持久化，重整不丟）
- 發現頁：[`/discover`](https://lucywu0501.github.io/momo-mock/discover)

版本紀錄見 [Releases](https://github.com/lucywu0501/momo-mock/releases) 與 [`CHANGELOG.md`](CHANGELOG.md)。

**Stack**：Vite 8・React 19・TypeScript・React Router v8・TanStack Query v5・Tailwind CSS v4・Vitest + React Testing Library・oxlint

## 快速開始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 36 個單元＋元件測試（vitest + RTL）
npm run e2e      # 5 個 Playwright E2E，對 production preview 跑
npm run lint     # oxlint
npm run typecheck
npm run build    # tsc -b && vite build
```

## CI / 發版 / 部署

全部由 [`.github/workflows/ci.yml`](.github/workflows/ci.yml) 一條 workflow 處理，四個 job：

| Job | 觸發 | 做什麼 |
|---|---|---|
| `check` | PR、push `main` | `npm run lint` → `npm test` → `npm run build`（含 `tsc -b`） |
| `e2e` | PR、push `main` | Playwright 對 production build 的 `vite preview` 跑購物主流程／URL 即狀態／錯誤路徑；失敗自動上傳 HTML report＋trace 為 artifact |
| `release` | push `main` 且 `check`＋`e2e` 通過 | [semantic-release](https://semantic-release.gitbook.io/) 依 Conventional Commits 算版號、寫 `CHANGELOG.md`、打 tag、建 GitHub Release |
| `deploy` | push `main` 且 `check`＋`e2e` 通過 | 以 `VITE_BASE=/momo-mock/` 建置、複製 `404.html` 作 SPA fallback，部署到 GitHub Pages——live URL 永遠是綠燈版本 |

版號由 commit 前綴決定（`feat` → minor、`fix` → patch、`BREAKING CHANGE` → major），不需手動改 version 或打 tag。commit 規範與貢獻流程見 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 架構總覽

```
src/
  app/        # router、RootLayout（Header/Footer/MiniCart）、全域 providers
  pages/      # 路由入口，薄組裝層（>100 行即該下沉邏輯）
  features/   # 業務領域：products / cart / discover / stats —— 彼此不相互 import
  services/   # API 與分析事件的抽象層；mock 實作（延遲、伺服器端 filter/sort/分頁語意、localStorage 事件 sink）全部收在這層
  shared/     # 無業務含義的 ui 元件與 utils
e2e/          # Playwright 跨 feature 流程測試（不屬於任何單一 feature）
```

**狀態三層歸屬**（本專案最核心的設計決策）：

| 狀態 | 歸屬 | 範例 |
|---|---|---|
| URL state | path + query string | 搜尋關鍵字、篩選/排序/頁碼（可分享、可書籤、重整不丟） |
| Server state | TanStack Query 快取 | 商品列表、詳情（返回列表不重載） |
| Client state | Context + useReducer + localStorage | 購物車（純函式 reducer，可單測） |

**Mock 邊界**：UI 與 hooks 完全不知道資料來自 mock。`services/api.ts` 的介面與真實後端一致（async、分頁、404 錯誤），要接真 API 只改這一層。跨 feature 共用的領域型別也由 service 邊界 re-export，維持 feature 間零依賴——新增 `/discover` 時既有程式碼零修改，即為此架構的實地驗證。

## 關鍵 Tradeoff

| 決策 | 選擇 | 放棄 | 理由 |
|---|---|---|---|
| Mock 邊界 | Service layer | 直接 import JSON／MSW | 演進成本 vs 限時設定成本的平衡；MSW 列入演進方向（介面不變、底層替換） |
| Server state | TanStack Query | router loader | 快取讓「返回列表不重載」免費拿到；loader 貼近 SSR，列入演進 |
| Client state | Context+useReducer | Zustand/Redux | 單一領域（購物車），狀態庫是過度設計 |
| 結構 | Feature-based | Type-based（components/containers/…） | 聚合性與擴充性；接受小規模時的儀式感成本 |
| Rendering | CSR | SSR（Next.js） | mock 無 SEO 需求；真實電商需 SSR，遷移路徑明確 |
| RWD | 單一 codebase RWD | 真站的 Adaptive 雙站 | 不複製歷史包袱；CSS 原生流動（grid auto-fill）優先，零 JS |
| 元件 | 自製 shared/ui（5 顆） | shadcn/Radix/MUI | 核心需求皆電商領域元件，庫給不了；中性風格改造成本反而高 |
| Lint | oxlint（模板預設） | ESLint | 規則相容、速度快、零設定 |
| 測試 | 邏輯單測＋元件行為測試＋Playwright E2E（CI）＋Agent 視覺對照 | snapshot／視覺快照 | snapshot 只報「變了」不報「壞了」；E2E 只斷言行為（文字、數量、URL、localStorage），視覺層交給 Agent 截圖對照真站 |
| CI／部署 | GitHub Actions（check＋e2e → release＋Pages） | Vercel／Netlify | 評估重點是善用 GitHub 功能；deploy 依賴 e2e 讓 live URL 永遠是綠燈版本 |
| 分析事件 | service-layer mock sink（localStorage）＋`/stats` | GA4／PostHog SDK | 專案前提是零真實 API；同一邊界模式讓換真 SDK 只改一檔，`/stats` 用零依賴 CSS 圖表展示 observability 思維 |

## 刻意不做

結帳/金流、會員登入、`/live` 直播、mobile 抽屜導覽、SSR。各項的「如果要做會怎麼接」見 `docs/design.md` §11。
驗證／可觀測性這一輪也刻意不做：coverage 門檻（36 個測試設門檻是數字遊戲）、Lighthouse CI（純 mock 的 LCP 沒有說服力）、視覺快照、branch protection（solo 專案；團隊化時以 `check`＋`e2e` 為 required checks）、真實分析 SDK（違反零真實 API 前提）。

## 驗證策略（四層）

1. **純邏輯單測**：cart reducer、mock service 的 filter/sort/分頁語意、analytics ring buffer、stats 彙總（先紅後綠，TDD）
2. **元件行為測試**：加入購物車 → badge +1 並記錄事件、數量 stepper 下限保護、router 錯誤畫面記錄 error 事件、長條圖等比與空狀態
3. **Agent 視覺驗證迴圈**：每階段由 Claude Code 開瀏覽器截圖，與 `docs/momo-ref/` 真站截圖對照（版面骨架、RWD 斷點、互動流程），紀錄於 `docs/worklog.md`、截圖存 `docs/checks/`
4. **CI 自動驗證**：每次 push 跑 `check`（oxlint＋vitest＋tsc＋build）與 `e2e`（Playwright 對 production preview 跑購物主流程、URL 即狀態、錯誤路徑，含 localStorage 事件斷言）；兩者綠燈後才 release 與部署 Pages。E2E 失敗自動上傳 trace／HTML report 供回放

## Observability

- **產品分析**：`services/analytics.ts` 定義七種型別化 Analytics Event（`page_view`／`search`／`view_product`／`add_to_cart`／`remove_from_cart`／`checkout_click`／`error`），由 hooks／store／router 層發出，UI 元件不知情。mock sink 存 localStorage ring buffer（500 筆），儲存失敗（配額滿、隱私模式、內容損毀）靜默處理，不影響購物流程。
- **統計頁 [`/stats`](https://lucywu0501.github.io/momo-mock/stats)**（Footer「站內統計」）：事件類型分布、熱門搜尋詞、零結果搜尋詞、加購最多商品、最近錯誤；純 CSS 長條圖、單一色相、數值 hover 可見；可清除紀錄。
- **錯誤監控**：router `errorElement` 把 render 錯誤記為 `error` 事件，於 `/stats` 可見；真實專案對應 Sentry。
- **Pipeline 可觀測性**：CI badge、Actions 失敗 artifact（Playwright trace）、Pages deployment 環境 URL、semantic-release 的 CHANGELOG。

## AI/Agent 協作

- **Phase 1（設計）**：與 Claude Code 對話完成需求釐清、2–3 方案比較與取捨（全文 `docs/design.md`）；真站 UI 由 Agent 以 Chrome DevTools 實地勘查截圖。
- **Phase 2（實作）**：人監督、Agent 實作；固定循環「實作 → tsc+lint+vitest+Agent 截圖對照 → 更新 worklog → commit」。所有 commit 含 `Co-Authored-By: Claude`。
- **Phase 3（Validation / Observability）**：以 `/grill-with-docs` 三輪 24 題定案（spec：`docs/superpowers/specs/`），建立 `CONTEXT.md` 詞彙表，再由 Agent 依實作計畫（`docs/superpowers/plans/`）逐 task TDD 執行、每 task 一個 commit。
- 完整時間軸與每階段紀錄：`docs/worklog.md`；實作計畫：`docs/plan.md`。

## 與真實網站的主要差異

完整對照矩陣見 [`docs/parity.md`](docs/parity.md)（2026-10-04 基準，區塊表 36 列＋流程表 20 列，每格標記一致／簡化／刻意省略／缺口／超出；範圍與基準決策見 [ADR-0001](docs/adr/0001-parity-scope-and-baseline.md)）。摘要：

- **一致**：搜尋 URL 形狀、facet 數量連動語意、hero 輪播操作、商品卡欄位、購物車 badge、分頁 URL 同步。
- **簡化**：facet 3 列 vs 真站 5+ 列且單選；排序 3 種 vs 5 種；分頁無數字跳頁；商品頁無分期／配送／評價區；未選規格不阻擋加入購物車。
- **刻意省略**：結帳、會員、直播、手機 drawer、廣告與行銷區塊（見「刻意不做」與 Tradeoff）。
- **缺口**（記錄不補）：手機底部 tab bar、搜尋頁手機無限捲動、hero 觸控滑動、捲動後 header 收合。
- **超出**：mock 商品頁在 390 寬為 RWD，真站商品頁仍是 1220px 固定桌機版。

## 演進方向

MSW 取代手寫 mock → Next.js SSR/SSG（SEO/LCP）→ Radix/Headless UI 補 a11y 複雜元件 → ESLint/oxlint boundary rule 強制 feature 邊界 → 真實分析 SDK（GA4／PostHog，只換 `services/analytics.ts`）與 Sentry → Lighthouse CI 效能預算 → mobile 無限捲動／react-window → `/live`（WebSocket mock＋隔離的 video feature）→ 會員與訂單領域。
