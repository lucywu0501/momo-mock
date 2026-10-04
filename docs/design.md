# Momo Mock — 設計文件（Phase 1 Design / Planning）

> Frontend Take-Home Evaluation・題目 A「Mocking momoshop」
> 日期：2026-10-04
> 本文件為 Phase 1 產出：架構決策、tradeoff 分析與實作計畫。
> 全程與 AI Agent（Claude Code）協作完成，協作紀錄見 git history 與 `docs/worklog.md`。

---

## 1. 目標與定位

參考 momo 購物網建立純前端 mock（無任何真實 API 呼叫）。本次評估重視**架構與可維護性、tradeoff 思維、AI/Agent 協作**，而非功能完成度，因此所有決策以下列原則排序：

1. **可演進性**：把自己當長期維護者——每個 mock 的邊界都要能無痛換成真實實作
2. **決策可說明**：做與不做都有明確理由，記錄在本文件與 README
3. **限時取捨**：Phase 2 實作以第一個 commit 起算約 120 分鐘，功能寬度讓位給架構深度

## 2. 功能範圍

### 要做（核心）

| 路由 | 內容 |
|---|---|
| `/` | 首頁：分類入口、商品區塊（精選卡片列表）、共用 Header/Footer |
| `/search/:keyword` | 搜尋結果：商品列表、分類＋價格篩選、排序（3 種）、分頁 |
| `/goods/:goodsId` | 商品詳情：圖片 gallery、價格、單一維度規格選擇、加入購物車、not-found 處理 |
| `/cart` | 購物車：增刪改數量、總額計算、localStorage 持久化 |
| `*` | 404 頁 |

基礎品質項：Error Boundary、路由層級 code splitting、loading skeleton、RWD（見 §7）。

### 延伸目標（核心完成且有餘裕才做）

- `/discover`：內容導購 feed。價值在於**示範架構可擴充性**——僅新增 `features/discover/`，重用 ProductCard 與 service layer，不動既有程式碼。

### 刻意不做（理由見 §9 Tradeoff 總表）

- `/live` 直播、結帳流程、金流、會員登入
- SSR/SEO、MSW、E2E 測試、snapshot 測試、元件庫

## 3. 技術選型

| 項目 | 選擇 | 一句話理由 |
|---|---|---|
| 建置 | Vite + React 19 + TypeScript | 純前端 SPA 的標準組合；TS 是可維護性的基本盤。React 19：ref 即 prop（shared/ui 免 forwardRef）、`useOptimistic` 用於加入購物車的樂觀更新 |
| 路由 | React Router（createBrowserRouter） | 巢狀 layout、lazy loading、errorElement 齊備 |
| Server state | TanStack Query | 快取讓「返回列表不重載」自然成立；loading/error 狀態標準化 |
| Client state | Context + useReducer（購物車） | 單一領域的全域狀態，零依賴、好測試、面試好解釋 |
| Styling | Tailwind CSS | RWD 斷點成本最低，限時下開發速度最快 |
| 元件 | 自製 `shared/ui`（不用元件庫） | 核心元件皆為電商領域元件，庫給不了；通用原語需求趨近零 |
| Icon | lucide-react | tree-shakable，比手畫 SVG 省時 |
| 測試 | Vitest + React Testing Library | 見 §8 測試策略 |

## 4. 架構決策

### 4.1 資料層：Service Layer 作為 mock 邊界（本專案最重要的決策）

```
UI 元件 → hooks（useProducts / useGoodsDetail / useSearch）
        → services/api.ts（介面與真實後端一致：async、Promise、分頁、錯誤）
        → services/mock/（mock data、模擬延遲、模擬篩選/分頁邏輯）
```

- UI 與 hooks **完全不知道**資料來自 mock。要接真實後端，只改 `services/` 一層。
- mock 刻意模擬真實特性：隨機延遲（200–600ms，讓 loading 狀態真實可見）、伺服器端分頁/篩選語意、商品不存在回 404 錯誤。
- **放棄的替代方案**：
  - 直接 import JSON → UI 與資料耦合，演進成本高，否決。
  - MSW（網路層攔截）→ 更擬真且測試可共用，但設定成本在限時內不划算；列入演進方向，屆時 service layer 介面不變、僅底層換掉。

### 4.2 狀態管理：三層歸屬，各有其家

| 狀態類型 | 歸屬 | 範例 |
|---|---|---|
| URL state | 路由（path + query string） | 搜尋關鍵字（path）、篩選/排序/頁碼（query） |
| Server state | TanStack Query 快取 | 商品列表、商品詳情 |
| Client state | Context + useReducer ＋ localStorage | 購物車 |

- **URL 是搜尋頁狀態的單一來源**：`/search/耳機?sort=priceAsc&cate=3C&page=2` 可分享、可書籤、重整不丟——不需要額外的 filter store。
- 購物車以 reducer 集中變更邏輯（純函式、可單元測試），localStorage 同步持久化。
- **放棄的替代方案**：Zustand/Redux——本專案 client state 只有購物車一個領域，引入全域狀態庫是過度設計；規模擴大（會員、追蹤清單、多賣場）時再評估。

### 4.3 資料夾結構：Feature-based

```
src/
  app/                  # 應用層：router、全域 providers、RootLayout（Header/Footer/MiniCart）
  pages/                # 路由入口，薄組裝層（準則：>100 行即該下沉邏輯）
    HomePage.tsx  SearchPage.tsx  GoodsPage.tsx  CartPage.tsx  NotFoundPage.tsx
  features/
    products/           # 商品瀏覽領域
      components/       # ProductCard, FilterPanel, SortToolbar, ProductGrid, Gallery...
      hooks/            # useProducts, useGoodsDetail, useSearch
      types.ts
    cart/               # 購物車領域
      components/       # CartItem, CartSummary, MiniCart, QuantityCell
      store/            # CartContext + reducer + localStorage 同步
      hooks/            # useCart
  services/             # API 抽象層（§4.1）
    api.ts
    mock/               # data.ts、延遲與分頁模擬
  shared/
    ui/                 # Button, Badge, PriceTag, Skeleton, QuantityStepper（各 10–30 行）
    utils/              # formatPrice 等純函式
```

**邊界規則**：feature 之間不互相 import，只能經由 `shared/` 與 `app/`；`pages/` 單向依賴 `features/`。規模成長後可用 ESLint boundary rule 強制。

**pages vs features 的職責**：pages = URL 的入口（易變），features = 業務能力的家（穩定）。一個 feature 服務多個 page（ProductCard 用於首頁/搜尋/discover；MiniCart 掛在 RootLayout 出現於所有頁面）。

- **放棄的替代方案**：type-based（components/containers/hooks/utils）——相關程式碼按技術角色拆散、改一個功能橫跨四個資料夾；containers/components 區分源自 2015 年 presentational/container pattern，Hooks 後已非必要。誠實代價：本專案僅四頁，feature-based 初期儀式感較重，此為「為系統演進付的小額保險費」。

### 4.4 Rendering：CSR

純 CSR（Vite SPA）。真實電商需要 SSR/SSG 保 SEO 與首屏效能（momo 真站亦然），本次為 mock 且限時，**刻意**選 CSR；演進路徑為遷移 Next.js（feature-based 結構與 service layer 皆可平移）。

### 4.5 路由細節

- 巢狀路由：`RootLayout`（Header 含搜尋框與購物車 badge、Footer、右側 sticky MiniCart）包 `<Outlet>`。
- 每頁 `React.lazy` code splitting；路由掛 `errorElement`。
- 商品不存在：service 回 404 錯誤 → Query error → 顯示專屬 not-found 畫面（非白屏、非全域 500）。
- 資料載入採「元件內 TanStack Query」而非 router loader：快取與心智模型單純；loader 方案貼近 SSR 架構，列入演進方向。

## 5. Mock Data 設計

- 商品約 40–60 筆、6–8 個分類，涵蓋：多圖商品、有/無促銷價、單一規格維度（如顏色）、缺貨商品（驗證邊界 UI）。
- 型別單一來源：`features/products/types.ts` 定義 `Product`、`ProductSummary`（列表用輕量版）、`SearchParams`、`Page<T>`。
- 搜尋/篩選/分頁語意在 mock service 內實作（模擬伺服器端行為），而非前端拿全量再過濾——與真實 API 的互動模式一致。

## 6. UI 參考（真站觀察紀錄）

參考截圖存於 `docs/momo-ref/`（首頁、搜尋頁、商品頁），作為實作時的對照基準。

重現的骨架：utility bar＋桃紅 logo 與大搜尋框、分類導覽列（active 桃紅底線）、右側 sticky 迷你購物車欄、搜尋頁篩選面板與排序工具列、商品頁雙欄（gallery 左、資訊右）、紅色促銷價。

簡化：篩選僅分類＋價格區間、排序 3 種、規格選擇單一維度、Hero 輪播以靜態 banner 替代。視覺識別抓主色（桃紅 magenta、紅價格字）即可達成辨識度；UI 精緻度刻意讓位給架構（spec 原文明示不追求）。

## 7. RWD 策略

真站為 Adaptive（桌面固定寬＋獨立 mobile 站，歷史包袱）；本專案**刻意選單一 codebase RWD**，不複製包袱。

桌面優先＋低成本降級，優先使用 CSS 原生流動（grid `auto-fill minmax`、flex-wrap），避免需要 JS 的 mobile 專屬模式：

| 元件 | 窄螢幕策略 | 成本 |
|---|---|---|
| 商品格 4–5 欄 | grid auto-fill 自動降 2 欄 | ~0 |
| Header | utility 連結收起、搜尋框滿版 | 低 |
| sticky MiniCart | 隱藏（Header badge 已涵蓋入口） | 低 |
| 篩選面板 | 收合為「篩選」按鈕＋展開區塊 | 中 |
| 商品頁雙欄 | 上下堆疊 | 低 |

不做：mobile 抽屜、底部導覽列（演進方向）。

## 8. 測試與驗證策略

按「單位成本的防護價值」分三層：

1. **純邏輯單元測試（Vitest）**：cart reducer（增刪改、總額）、formatPrice、mock service 篩選/分頁。最便宜、防護最高——購物車算錯錢是電商最嚴重的 bug。
2. **元件行為測試（RTL，2–3 個）**：加入購物車 → header badge +1；QuantityStepper 下限保護。測行為不測外觀。
3. **Agent 視覺驗證迴圈（不寫 E2E 程式碼）**：每階段完成後由 Agent 以 Chrome DevTools 開啟 dev server 截圖，與 `docs/momo-ref/` 真站截圖對照（版面、RWD 斷點、互動流程），問題當場修，結果記入 `docs/worklog.md`。此流程回應考核點「實作結果與真實網站的差異」與「Validation / Observability Thinking」。

**刻意不做**：snapshot 測試（只報「變了」不報「壞了」，維護成本＞防護價值）、Playwright E2E（演進方向：CI 跑關鍵購物流程）。

## 9. Tradeoff 總表

| 決策 | 選擇 | 放棄 | 關鍵理由 |
|---|---|---|---|
| Mock 邊界 | Service layer | 直接 import JSON／MSW | 演進成本 vs 限時設定成本的平衡點 |
| Server state | TanStack Query | router loader／手寫 useFetch | 快取體驗免費拿到 |
| Client state | Context+useReducer | Zustand/Redux | 單一領域，狀態庫是過度設計 |
| 結構 | Feature-based | Type-based | 聚合性與擴充性；接受小規模時的儀式感 |
| Rendering | CSR | SSR(Next.js) | mock 無 SEO 需求；演進路徑明確 |
| Styling | Tailwind | CSS Modules/CSS-in-JS | 限時下 RWD 與開發速度 |
| 元件 | 自製 shared/ui | shadcn/Radix/MUI | 需求皆領域元件；中性風格改造成本反而高 |
| 畫面驗證 | Agent 截圖對照 | Playwright E2E／snapshot | 零程式碼成本達成視覺驗證 |
| 範圍 | 4 核心路由 | /live、結帳、會員 | 功能寬度讓位架構深度 |

## 10. 實作階段規劃（Phase 2，~120 分鐘）

每階段固定循環：**實作 → 驗證（tsc＋lint＋vitest＋Agent 截圖對照）→ 更新 docs → commit**。

| # | 階段 | 預估 | Commit（Conventional Commits，含 Co-Authored-By: Claude） |
|---|---|---|---|
| 0 | Scaffold＋設計文件入庫 | 10m | `chore: scaffold ...`／`docs: add design doc` |
| 1 | Service layer＋mock data＋型別 | 15m | `feat(services): mock data layer ...` |
| 2 | 購物車 store（reducer＋localStorage）＋單元測試 | 15m | `feat(cart): cart store ...`／`test: cart reducer` |
| 3 | RootLayout＋shared/ui＋首頁 | 20m | `feat(products): home page ...` |
| 4 | 搜尋頁（篩選/排序/分頁） | 25m | `feat(products): search page ...` |
| 5 | 商品詳情頁 | 15m | `feat(products): goods detail ...` |
| 6 | 購物車頁＋MiniCart＋互動測試 | 15m | `feat(cart): cart page & mini-cart` |
| 7 | README＋worklog 收尾 | 10m | `docs: README with tradeoffs ...` |

時間不足時的棄守順序（後棄先保）：篩選面板收合 RWD → 分頁 → Gallery 縮圖列 → 排序。架構層（service/store/結構）不可棄。

## 11. 演進方向（README 將收錄）

- MSW 取代手寫 mock（service 介面不變）
- Next.js SSR/SSG（SEO、首屏 LCP）
- Radix/Headless UI 引入 a11y 複雜元件（Dialog、Combobox）
- Playwright E2E 於 CI 驗證購物流程
- ESLint boundary rules 強制 feature 邊界
- `/live`：WebSocket mock＋隔離的 video streaming feature
- 國際化（i18n）、會員與訂單領域

## 12. AI/Agent 協作紀錄（Phase 1）

本設計由人與 Claude Code 對話迭代產出：功能範圍（含 /discover、/live 的成本效益分析）、四大架構決策、RWD 策略、測試分層皆經過選項比較與取捨討論；真站 UI 結構由 Agent 以 Chrome DevTools 實地勘查截圖。Phase 2 將延續「人決策、Agent 實作與驗證、每階段留痕」的協作模式。
