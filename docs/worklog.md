# Worklog — Phase 2 實作紀錄

> 每個 Task 完成後記錄：做了什麼、取捨、驗證結果（含 Agent 視覺對照）。

## Task 0 — Scaffold
- Vite 8 + React 19.2 + TS 6 + Tailwind 4（@tailwindcss/vite）；react-router 實裝為 v8（計畫寫 v7，API 相同）；lint 工具為模板預設 oxlint。
- Tailwind `@theme` 定義 `--color-momo: #d4007f`、`--color-price: #e60012`，dev server 視覺確認生效（docs/checks/task0-scaffold.jpeg）。
- 本機 5173 被其他專案佔用，dev server 跑 5174。

## Task 1 — Service Layer
- types + 確定性 mock data（8 分類 × 7 筆，含缺貨/無促銷邊界）＋ api.ts（模擬延遲、伺服器端 filter/sort/分頁語意）。
- TDD：7 個 service 測試先紅後綠。

## Task 2 — Cart Store
- cartReducer 純函式（6 個單元測試先紅後綠）＋ CartProvider（localStorage `momo-mock.cart.v1`）＋ useCart。

## Task 3 — Layout／shared/ui／首頁
- 自製 shared/ui 五元件；RootLayout（utility bar、桃紅 logo、搜尋框、購物車 badge、sticky MiniCart）；lazy 路由＋errorElement。
- Lint 決策：留用模板的 oxlint 取代 ESLint（規則相容、快、零設定）；5 個 fast-refresh 建議警告（lazy route/context 慣用寫法）接受。
- Agent 視覺對照 momo-home.jpeg：骨架一致（docs/checks/task3-home.jpeg）；400px RWD 驗證通過（utility 隱藏、2 欄、MiniCart 隱藏，task3-home-mobile.jpeg）。

## Task 4 — 搜尋頁
- useSearch：URL（path keyword＋query cate/min/max/sort/page）為狀態單一來源；任何篩選/排序變更自動回第 1 頁。
- Agent 驗證：關鍵字過濾（耳機→2 件）、`?sort=priceAsc` 直連還原排序狀態且結果遞增、超範圍頁碼顯示空狀態（與 service 語意一致）；截圖 docs/checks/task4-search.jpeg。

## Task 5 — 商品詳情頁
- Gallery（縮圖切換）＋變體選擇＋數量＋加入購物車（badge/MiniCart/localStorage 三處同步、按鈕 1.5s 回饋）。
- NotFoundError 顯示「此商品目前無展售」（對齊真站錯誤頁文案）；缺貨商品 CTA disabled。
- Agent 驗證截圖 docs/checks/task5-goods.jpeg；與 momo-goods.jpeg 對照雙欄骨架一致。

## Task 6 — 購物車頁
- CartItemRow（數量 stepper、移除）＋總計側欄（sticky）＋空車狀態；結帳按鈕以 mock 提示標明刻意不做。
- RTL 互動測試 2 支鎖行為（加入→badge+1、stepper 下限 disabled）。
- Agent 驗證：調數量 MiniCart 即時同步（2 件 $3,380）、重整後購物車持久（localStorage）；截圖 docs/checks/task6-cart.jpeg。

## Task 7a — 延伸目標 /discover（架構可擴充性驗證）
- 核心 9 分鐘內完成、視窗充裕 → 執行延伸目標：新增 features/discover/＋DiscoverPage＋一條路由，既有程式碼零修改（僅 router 加 2 行）。
- 邊界規則實踐：discover 需要 ProductSummary 型別時，不直接 import features/products——改由 services/api 把共用領域型別 re-export，feature 間依然零相互依賴。
- 截圖 docs/checks/task7-discover.jpeg。

## 總結
- 計時：first commit 15:06 → 最後 commit 15:17，核心四路由＋購物車＋延伸 /discover 全數完成，無棄守項目。
- 測試：15 passed（7 service＋6 reducer＋2 互動）；tsc、oxlint、production build 全綠。
- 與真站差異分析見 README「與真實網站的主要差異」。

## Task 8 — 使用者驗收回饋修正（round 1）
- Breadcrumb 改為可點的共用元件（shared/ui/Breadcrumb）；商品頁品牌 crumb 連到品牌搜尋。
- 新增 momo 式類別導覽列（app/CategoryNav，NavLink active 桃紅底線、窄螢幕橫向捲動）。
- 商品卡向真站看齊：星數評價（確定性 mock）＋折數 badge；卡片加 CSS content-visibility:auto（離屏卡片跳過 render，56 筆規模下比引入 react-window 划算——windowing 列入演進方向）。
- 分頁維持與真站桌面版一致（使用者確認網站版做分頁；mobile 無限捲動列入演進方向）。

## Task 9 — 使用者驗收回饋修正（round 2）
- 以 DevTools 實地檢查真站 attributesListArea：分類/品牌/類型/尺寸/功能（帶連動數量）。對應實作 faceted search：mock service 計算 facets（每個 facet 忽略自身已選、受其他條件連動——與真站行為一致），FilterPanel 呈現分類/品牌/優惠三列＋價格。
- Mock data 擴充 56 → 168 筆（每分類三代 ''/Pro/Plus），讓分頁實際出現；Pagination 改為永遠顯示（單頁時按鈕 disabled，與真站一致）。
- Header 對齊真站：灰底搜尋框＋深灰「搜尋」按鈕、logo 加 tagline「全站超取$290免運」。
- 新增 facet 單元測試（16 tests 全綠）；Agent 驗證分頁 URL 同步與 facet 連動（docs/checks/task9-search-facets.jpeg）。
