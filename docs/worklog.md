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

## Task 10 — 使用者驗收回饋修正（round 3）：首頁 gallery
- Hero 輪播：4 張 banner（自動輪播 4s、hover 暫停、左右箭頭、圓點指示、點擊導向對應搜尋）；banner 資料走 api.getHeroBanners() 維持 service 層一致性。
- 右側「超級品牌日」卡片欄（lg 以上顯示）、分類入口改為圓圖 gallery 列（窄螢幕橫向捲動）。
- favicon 換成 momo 風格桃紅圓角「m」SVG。
- Agent 驗證：輪播自動轉動與圓點同步（docs/checks/task10-home-gallery.jpeg）。

## Task 11 — 使用者驗收回饋修正（round 4）：輪播無限循環
- Hero 輪播改為 circular：軌道頭尾各放複製 slide，transitionend 時關閉動畫瞬跳回真實 slide——最後一張按「下一張」持續向右滑，不再倒帶。
- Agent 以 transform 數值驗證：-4w →（過渡中 -4.73w，方向向右）→ 瞬跳 -1w，圓點同步。

## Task 12 — Bug fix：搜尋大小寫敏感
- 使用者回報：搜尋框輸入「3c」查無商品、點分類「3C」正常。根因：matches() 以 String.includes 直接比對（大小寫敏感）；分類點擊走 category id 所以不受影響。
- 修法：關鍵字與 name/brand/分類名正規化為小寫後比對。TDD：先加失敗測試（3c 應等同 3C）再修，17 tests 全綠；瀏覽器實測 /search/3c → 共 21 件。

## Task 13 — 真站對照評估（parity matrix）
- 問題：README「與真實網站的主要差異」已過時（寫無輪播、僅分類＋價格篩選），且沒有結構化判準說明 mock 與真站「像」在哪。先以 grill-me 釐清範圍：四軸（功能／版面／互動流程／RWD）、三頁＋加入購物車、桌機 1280 與手機 390、視覺與資料真實度為非目標、缺口只記錄不補。
- Agent 以 Playwright 開真站首頁／搜尋／商品／逛逛四頁（1280 與 390 各一輪，約 9 分鐘，未被反爬擋下），讀 DOM 結構與互動狀態；截圖存 `docs/momo-ref/*-20261004.jpeg`，同日 mock 截圖存 `docs/checks/task13-*.jpeg`。
- 發現並修正兩個既有認知：(1) 真站**有** `/discover`（手機底部 tab「逛逛」，6 欄瀑布流商品卡），mock 的「發現好物」不是超出而是簡化；(2) 真站現為單一 RWD 站而非 Adaptive 雙站，但商品頁在 390 仍是 1220px 固定桌機版——mock 商品頁 RWD 反而是「超出」。
- 其他關鍵觀察：真站搜尋 URL 已是 `/search/:keyword`（與 mock 一致）、商品頁已是 `/product/:id`（mock 的 `/goods` 對齊的是舊路徑）；未選規格按「放入購物車」會被「請選擇商品規格」阻擋，mock 預設第一個規格；手機搜尋頁為無限捲動且卡片改橫式。
- 產出：`docs/parity.md`（區塊表 36 列＋流程表 20 列，五種狀態）、`docs/adr/0001-parity-scope-and-baseline.md`（四軸、非目標、一次性基準）、README 差異章節改為摘要＋連結。缺口四項（底部 tab bar、搜尋頁手機無限捲動、hero 觸控滑動、header 收合）記入「未來工作」，不開 issue、不實作。

## Task 14 — Validation / Observability：CI E2E、Pages 驗證、站內分析
- 設計：`/grill-with-docs` 三輪 24 題定案（spec：docs/superpowers/specs/2026-10-04-ci-pages-analytics.md）；建立 CONTEXT.md 詞彙表（Product／Category／Promotion／Variant／Facet／Cart Item／Analytics Event）。計畫經 Plannotator 審閱核准後逐 task 執行。
- 分析事件：services/analytics.ts（型別化七種事件、localStorage ring buffer 500 筆、儲存失敗／內容損毀靜默）；由 useSearch／useGoodsDetail／useCart／RootLayout／RouteError 發出，UI 元件零修改。TDD：sink 8、aggregate 7、BarList 3、RouteError 1、cart 互動事件斷言，先紅後綠；36 tests 全綠。
- `/stats`：純 CSS 長條圖（單一色相、文字用文字色、hover 顯示數值），四個 tile＋四張圖＋錯誤表；Footer「站內統計」連結。live 截圖 docs/checks/task14-stats.jpeg。
- E2E：Playwright 5 tests（購物主流程含 localStorage 事件斷言、URL 即狀態×2、錯誤路徑×2），對 production preview 跑；selector 走 role／文字，只有 cart badge 用 data-testid。不做視覺快照（維持 README 立場）。本機 5/5，CI 模式 5/5。
- CI：既有 ci.yml 新增 `e2e` job，`release` 與 `deploy` 改為 needs [check, e2e]。第一次 CI 在 `npm ci` 失敗——macOS 安裝 Playwright 時 lockfile 掉了 @tailwindcss/oxide wasm fallback 的巢狀 @emnapi 項目（linux 需要）；以前一版 lock＋playwright 三筆重建後全綠（docs/checks/task14-ci.jpeg）。semantic-release 自動發 v1.2.0。
- 驗證 live：根路徑 200、`/cart` 深連結回 404 狀態但 body 為 SPA shell、重整後購物車仍在；Footer → `/stats` 可見五種事件。
- 取捨：不設 coverage 門檻、不做 Lighthouse CI、不開 branch protection（solo）；分析走 mock sink 而非真 SDK（零真實 API 前提）；觸發維持 main＋PR（沿用既有 workflow）。
