# momo mock — Frontend Take-home（題目 A：Mocking momoshop）

純前端模擬 momo 購物網：首頁、搜尋（篩選/排序/分頁）、商品詳情、購物車、發現頁。無任何真實 API 呼叫。

**Stack**：Vite 8・React 19・TypeScript・React Router v8・TanStack Query v5・Tailwind CSS v4・Vitest + React Testing Library・oxlint

## 快速開始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 15 個單元＋互動測試
npm run lint     # oxlint
npm run build    # tsc -b && vite build
```

## 架構總覽

```
src/
  app/        # router、RootLayout（Header/Footer/MiniCart）、全域 providers
  pages/      # 路由入口，薄組裝層（>100 行即該下沉邏輯）
  features/   # 業務領域：products / cart / discover —— 彼此不相互 import
  services/   # API 抽象層；mock 實作（延遲、伺服器端 filter/sort/分頁語意）全部收在這層
  shared/     # 無業務含義的 ui 元件與 utils
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
| 測試 | 邏輯單測＋行為測試＋Agent 視覺對照 | snapshot／Playwright E2E | snapshot 只報「變了」不報「壞了」；E2E 列入演進（CI 跑購物流程） |

## 刻意不做

結帳/金流、會員登入、`/live` 直播、mobile 抽屜導覽、SSR。各項的「如果要做會怎麼接」見 `docs/design.md` §11。

## 驗證策略（三層）

1. **純邏輯單測**：cart reducer、mock service 的 filter/sort/分頁語意（先紅後綠，TDD）
2. **元件行為測試**：加入購物車 → badge +1、數量 stepper 下限保護
3. **Agent 視覺驗證迴圈**：每階段由 Claude Code 以 Chrome DevTools 開 dev server 截圖，與 `docs/momo-ref/` 真站截圖對照（版面骨架、RWD 斷點、互動流程），紀錄於 `docs/worklog.md`、截圖存 `docs/checks/`

## AI/Agent 協作

- **Phase 1（設計）**：與 Claude Code 對話完成需求釐清、2–3 方案比較與取捨（全文 `docs/design.md`）；真站 UI 由 Agent 以 Chrome DevTools 實地勘查截圖。
- **Phase 2（實作）**：人監督、Agent 實作；固定循環「實作 → tsc+lint+vitest+Agent 截圖對照 → 更新 worklog → commit」。所有 commit 含 `Co-Authored-By: Claude`。
- 完整時間軸與每階段紀錄：`docs/worklog.md`；實作計畫：`docs/plan.md`。

## 與真實網站的主要差異

- 篩選面板僅分類＋價格區間（真站有品牌/規格/多維度 facet 與數量統計）
- 排序 3 種（真站 6+ 種含銷量/評價）；無 Hero 輪播（靜態 banner 替代）
- 商品圖為 picsum 佔位圖；詳情頁無分期/配送選項/評價區
- 真站為 Adaptive 雙站；本專案為單一 codebase RWD（刻意決策，見 Tradeoff）

## 演進方向

MSW 取代手寫 mock → Next.js SSR/SSG（SEO/LCP）→ Radix/Headless UI 補 a11y 複雜元件 → Playwright E2E 進 CI → ESLint/oxlint boundary rule 強制 feature 邊界 → `/live`（WebSocket mock＋隔離的 video feature）→ 會員與訂單領域。
