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
