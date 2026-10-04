# Validation / Observability（CI、GitHub Pages、站內分析）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓每次 push 都在 GitHub Actions 跑 tsc／lint／vitest／build／Playwright E2E，main 綠燈後自動部署到 GitHub Pages，並在站內記錄 Analytics Event 且提供 `/stats` 統計頁。

**Architecture:** 分析事件走與 `services/api.ts` 相同的 service-layer 邊界：`services/analytics.ts` 定義型別化事件與 localStorage ring-buffer sink，由 hooks／store／app 層發出，UI 元件不知情。`features/stats/` 以純函式彙總事件、純 CSS 畫長條圖。E2E 放在根目錄 `e2e/`，對 production build 的 `vite preview` 跑；CI 拆 `check`／`e2e` 兩個 job，deploy workflow 以 `workflow_run` 接在 CI 成功之後。

**Tech Stack:** Vite 8、React 19、TypeScript 6、React Router v8、TanStack Query v5、Tailwind v4、Vitest 5＋RTL、oxlint、@playwright/test 1.63、GitHub Actions（checkout v7、setup-node v7、upload-artifact v7、configure-pages v6、upload-pages-artifact v5、deploy-pages v5）。

**Spec:** `docs/superpowers/specs/2026-10-04-ci-pages-analytics.md`

## Global Constraints

- 無任何真實 API 呼叫；分析 sink 只寫 localStorage。
- feature 之間不互相 import；`features/stats/` 只能 import `services/` 與 `shared/`。
- UI 元件不直接呼叫 `analytics`；事件只從 hooks、store、`app/` 發出。
- 詞彙依 `CONTEXT.md`：Product、Category、Promotion、Variant、Cart Item、Analytics Event。
- 文案為繁體中文；程式識別字為英文。
- Node 24（`.nvmrc`），CI 用 `node-version-file: .nvmrc`。
- E2E 只斷言行為（文字、數量、URL、localStorage），不做 `toHaveScreenshot`；selector 以 role／文字為主，只有購物車 badge 用 `data-testid="cart-badge"`。
- Commit 用 Conventional Commits，結尾加 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。
- 每個 task 結束前 `npm run typecheck && npm run lint && npm test` 必須全綠。

## Review Focus

1. localStorage 內的分析資料損毀（非 JSON 或非陣列）→ `list()` 回 `[]`，`track()` 照常寫入；不得拋錯讓頁面白屏。（Task 1 測試）
2. `localStorage.setItem` 拋錯（配額滿、隱私模式）→ `track()` 靜默吞掉，加入購物車仍成功。（Task 1 測試）
3. `/stats` 在零事件或所有值為 0 時 → 顯示「尚無資料」，長條寬度不會出現 `NaN%`／除以零。（Task 3、Task 4 測試）
4. 搜尋零結果（`resultCount: 0`）→ 出現在「零結果搜尋詞」而不計入「熱門搜尋詞」以外的統計；同一關鍵字多次零結果累計次數。（Task 3 測試）
5. GitHub Pages 深連結重整（`/momo-mock/cart`）→ 由 `404.html` 載入 SPA 後 router 接手，不是 GitHub 預設 404 頁。（Task 7 以 curl 驗證 body 含 `id="root"`）

---

### Task 1: Analytics service（型別＋ring-buffer sink）

**Files:**
- Create: `src/services/analytics.ts`
- Test: `src/services/analytics.test.ts`

**Interfaces:**
- Consumes: 無。
- Produces:
  - `type AnalyticsEvent`（七種事件的 discriminated union，見下方程式碼）
  - `type AnalyticsEventType = AnalyticsEvent['type']`
  - `type RecordedEvent = AnalyticsEvent & { timestamp: number }`
  - `interface AnalyticsSink { track(event: AnalyticsEvent): void; list(): RecordedEvent[]; clear(): void }`
  - `const ANALYTICS_STORAGE_KEY = 'momo-mock.analytics.v1'`、`const MAX_EVENTS = 500`
  - `function appendEvent(events: RecordedEvent[], event: RecordedEvent, max?: number): RecordedEvent[]`
  - `function createLocalStorageSink(storage: Storage, options?: { now?: () => number; debug?: boolean }): AnalyticsSink`
  - `const analytics: AnalyticsSink`（綁定 `window.localStorage` 的單例，後續 task 都 import 這個）

- [ ] **Step 1: 寫失敗測試**

```ts
// src/services/analytics.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ANALYTICS_STORAGE_KEY, MAX_EVENTS, appendEvent, createLocalStorageSink, type RecordedEvent,
} from './analytics'

const ev = (i: number): RecordedEvent => ({ type: 'page_view', path: `/p${i}`, timestamp: i })

describe('appendEvent（ring buffer）', () => {
  it('未滿時直接附加', () => {
    expect(appendEvent([ev(1)], ev(2), 3)).toEqual([ev(1), ev(2)])
  })
  it('超過上限時丟掉最舊的', () => {
    expect(appendEvent([ev(1), ev(2), ev(3)], ev(4), 3)).toEqual([ev(2), ev(3), ev(4)])
  })
})

describe('createLocalStorageSink', () => {
  beforeEach(() => localStorage.clear())

  it('track 後 list 回傳帶 timestamp 的事件', () => {
    const sink = createLocalStorageSink(localStorage, { now: () => 1234 })
    sink.track({ type: 'search', keyword: '耳機', sort: 'relevance', resultCount: 6 })
    expect(sink.list()).toEqual([{ type: 'search', keyword: '耳機', sort: 'relevance', resultCount: 6, timestamp: 1234 }])
  })

  it('只保留最新 MAX_EVENTS 筆', () => {
    const sink = createLocalStorageSink(localStorage)
    for (let i = 0; i < MAX_EVENTS + 1; i++) sink.track({ type: 'page_view', path: `/p${i}` })
    const list = sink.list()
    expect(list).toHaveLength(MAX_EVENTS)
    expect(list[0]).toMatchObject({ path: '/p1' })
  })

  it('儲存內容損毀時 list 回空陣列，track 仍可寫入', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, '{not json')
    const sink = createLocalStorageSink(localStorage)
    expect(sink.list()).toEqual([])
    sink.track({ type: 'page_view', path: '/' })
    expect(sink.list()).toHaveLength(1)
  })

  it('儲存內容不是陣列時視為空', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, '{"a":1}')
    expect(createLocalStorageSink(localStorage).list()).toEqual([])
  })

  it('setItem 拋錯時 track 不拋錯', () => {
    const broken = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
      removeItem: () => {},
    } as unknown as Storage
    const sink = createLocalStorageSink(broken)
    expect(() => sink.track({ type: 'page_view', path: '/' })).not.toThrow()
  })

  it('clear 清空所有事件', () => {
    const sink = createLocalStorageSink(localStorage)
    sink.track({ type: 'page_view', path: '/' })
    sink.clear()
    expect(sink.list()).toEqual([])
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/services/analytics.test.ts`
Expected: FAIL，錯誤為找不到模組 `./analytics`。

- [ ] **Step 3: 寫最小實作**

```ts
// src/services/analytics.ts
/**
 * Analytics Event 的 service 邊界（與 api.ts 同一原則）：
 * UI／hooks 只呼叫 analytics.track()，不知道事件寫到哪。
 * 現在是 localStorage ring buffer 的 mock sink；接真 SDK（GA4／PostHog）時只改這一檔。
 */
export type AnalyticsEvent =
  | { type: 'page_view'; path: string }
  | {
      type: 'search'; keyword: string
      category?: string; brand?: string; tag?: string; minPrice?: number; maxPrice?: number
      sort: string; resultCount: number
    }
  | { type: 'view_product'; productId: string; category: string }
  | { type: 'add_to_cart'; productId: string; variant?: string; qty: number }
  | { type: 'remove_from_cart'; productId: string; variant?: string }
  | { type: 'checkout_click'; cartTotal: number; itemCount: number }
  | { type: 'error'; message: string; path: string }

export type AnalyticsEventType = AnalyticsEvent['type']
export type RecordedEvent = AnalyticsEvent & { timestamp: number }

export interface AnalyticsSink {
  track(event: AnalyticsEvent): void
  list(): RecordedEvent[]
  clear(): void
}

export const ANALYTICS_STORAGE_KEY = 'momo-mock.analytics.v1'
export const MAX_EVENTS = 500

/** 純函式：附加一筆並維持上限（丟最舊） */
export function appendEvent(events: RecordedEvent[], event: RecordedEvent, max = MAX_EVENTS): RecordedEvent[] {
  const next = [...events, event]
  return next.length > max ? next.slice(next.length - max) : next
}

export function createLocalStorageSink(
  storage: Storage,
  { now = Date.now, debug = false }: { now?: () => number; debug?: boolean } = {},
): AnalyticsSink {
  const read = (): RecordedEvent[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(ANALYTICS_STORAGE_KEY) ?? '[]')
      return Array.isArray(parsed) ? (parsed as RecordedEvent[]) : []
    } catch {
      return []
    }
  }
  const write = (events: RecordedEvent[]) => {
    try { storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events)) } catch { /* 配額滿／隱私模式：分析不得影響購物流程 */ }
  }
  return {
    track(event) {
      const recorded: RecordedEvent = { ...event, timestamp: now() }
      if (debug) console.debug('[analytics]', recorded)
      write(appendEvent(read(), recorded))
    },
    list: read,
    clear() {
      try { storage.removeItem(ANALYTICS_STORAGE_KEY) } catch { /* 同上 */ }
    },
  }
}

// 只在 vite dev 印 console（vitest 的 MODE 是 'test'，不會洗版）
export const analytics: AnalyticsSink = createLocalStorageSink(localStorage, { debug: import.meta.env.MODE === 'development' })
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/services/analytics.test.ts`
Expected: PASS，8 tests。

- [ ] **Step 5: 全量檢查並 commit**

```bash
npx tsc -b && npm run lint && npm test
git add src/services/analytics.ts src/services/analytics.test.ts
git commit -m "feat(services): analytics event sink with localStorage ring buffer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

> `npm run typecheck` 在 Task 5 才加進 package.json，Task 1–4 用 `npx tsc -b`。

---

### Task 2: 從 hooks／store／app 層發出事件

**Files:**
- Modify: `src/features/products/hooks/useSearch.ts`
- Modify: `src/features/products/hooks/useGoodsDetail.ts`
- Modify: `src/features/cart/hooks/useCart.ts`
- Modify: `src/pages/CartPage.tsx:32`
- Modify: `src/app/RootLayout.tsx`
- Create: `src/app/RouteError.tsx`
- Modify: `src/app/router.tsx:15`
- Test: `src/features/cart/cart.integration.test.tsx`
- Test: `src/app/RouteError.test.tsx`

**Interfaces:**
- Consumes: `analytics` from `src/services/analytics.ts`（Task 1）。
- Produces: `useCart()` 多回傳 `checkout: () => void`；`RouteError` 元件（default export 無，named export `RouteError`）。

- [ ] **Step 1: 擴充 cart 互動測試（失敗）**

把 `src/features/cart/cart.integration.test.tsx` 的第一個 describe 改成：

```tsx
import { analytics } from '../../services/analytics'
// ...（其餘 import 不變）

describe('cart 互動', () => {
  it('點加入購物車 → badge 數量 +1，並記錄 add_to_cart 事件', async () => {
    localStorage.clear()
    analytics.clear()
    render(<CartProvider><Harness /></CartProvider>)
    expect(screen.getByTestId('badge')).toHaveTextContent('0')
    await userEvent.click(screen.getByText('加入購物車'))
    expect(screen.getByTestId('badge')).toHaveTextContent('1')
    const added = analytics.list().filter(e => e.type === 'add_to_cart')
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ productId: 'x', qty: 1 })
  })
})
```

- [ ] **Step 2: 新增 RouteError 測試（失敗）**

```tsx
// src/app/RouteError.test.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { RouteError } from './RouteError'
import { analytics } from '../services/analytics'

function Boom(): never { throw new Error('render exploded') }

describe('RouteError', () => {
  beforeEach(() => { analytics.clear(); vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => vi.restoreAllMocks())

  it('顯示錯誤畫面並記錄 error 事件（含路徑）', async () => {
    const router = createMemoryRouter(
      [{ path: '/boom', element: <Boom />, errorElement: <RouteError /> }],
      { initialEntries: ['/boom'] },
    )
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('頁面發生錯誤，請重新整理。')).toBeInTheDocument()
    const errors = analytics.list().filter(e => e.type === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ message: 'render exploded', path: '/boom' })
  })
})
```

- [ ] **Step 3: 執行確認失敗**

Run: `npx vitest run src/features/cart src/app`
Expected: cart 測試在 `analytics.list().filter(...)` 長度斷言失敗（0 ≠ 1）；RouteError 測試找不到模組。

- [ ] **Step 4: 實作 useCart 事件與 checkout**

```ts
// src/features/cart/hooks/useCart.ts
import { useContext } from 'react'
import { CartContext } from '../store/CartContext'
import type { CartItem } from '../store/cartReducer'
import { analytics } from '../../../services/analytics'

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  const { items, total, count, dispatch } = ctx
  return {
    items, total, count,
    add: (item: Omit<CartItem, 'qty'>, qty = 1) => {
      dispatch({ type: 'add', item, qty })
      analytics.track({ type: 'add_to_cart', productId: item.productId, variant: item.variant, qty })
    },
    remove: (productId: string, variant?: string) => {
      dispatch({ type: 'remove', productId, variant })
      analytics.track({ type: 'remove_from_cart', productId, variant })
    },
    setQty: (productId: string, qty: number, variant?: string) => dispatch({ type: 'setQty', productId, qty, variant }),
    clear: () => dispatch({ type: 'clear' }),
    /** 結帳刻意不實作；只記錄意圖供統計 */
    checkout: () => analytics.track({ type: 'checkout_click', cartTotal: total, itemCount: count }),
  }
}
```

- [ ] **Step 5: CartPage 結帳按鈕改呼叫 checkout**

`src/pages/CartPage.tsx` 第 8 行解構加入 `checkout`，第 32 行改為：

```tsx
  const { items, total, setQty, remove, clear, checkout } = useCart()
  // ...
        <Button className="mt-4 w-full" onClick={() => { checkout(); alert('mock：結帳流程刻意不在本次範圍（見 README tradeoff）') }}>
```

- [ ] **Step 6: 建立 RouteError 並掛到 router**

```tsx
// src/app/RouteError.tsx
import { useEffect } from 'react'
import { Link, useLocation, useRouteError } from 'react-router'
import { analytics } from '../services/analytics'

/** router 層級的錯誤畫面：顯示友善訊息並記錄 error 事件（runtime observability 的 mock 實作） */
export function RouteError() {
  const error = useRouteError()
  const { pathname } = useLocation()
  useEffect(() => {
    analytics.track({ type: 'error', message: error instanceof Error ? error.message : String(error), path: pathname })
  }, [error, pathname])
  return (
    <div className="py-24 text-center">
      <p className="text-xl font-bold">頁面發生錯誤，請重新整理。</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁</Link>
    </div>
  )
}
```

`src/app/router.tsx`：

```tsx
import { RouteError } from './RouteError'
// ...
    path: '/', element: <RootLayout />,
    errorElement: <RouteError />,
```

- [ ] **Step 7: useSearch 記錄 search 事件**

在 `src/features/products/hooks/useSearch.ts`：

```ts
import { useEffect } from 'react'
import { analytics } from '../../../services/analytics'
// ...（在 useQuery 之後、setParam 之前）
  // page 物件由 TanStack Query 結構共享，只有結果真的改變才會觸發；回上一頁拿快取不重複記
  useEffect(() => {
    if (!page) return
    analytics.track({
      type: 'search', keyword: params.keyword,
      category: params.category, brand: params.brand, tag: params.tag,
      minPrice: params.minPrice, maxPrice: params.maxPrice,
      sort: params.sort ?? 'relevance', resultCount: page.total,
    })
  }, [page]) // 只依賴 page：params 與 page 同源（同一個 queryKey），不需重複列入
```

- [ ] **Step 8: useGoodsDetail 記錄 view_product**

```ts
// src/features/products/hooks/useGoodsDetail.ts
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, NotFoundError } from '../../../services/api'
import { analytics } from '../../../services/analytics'

export function useGoodsDetail(id: string) {
  const query = useQuery({
    queryKey: ['goods', id],
    queryFn: () => api.getProduct(id),
    retry: (count, err) => !(err instanceof NotFoundError) && count < 1,
  })
  useEffect(() => {
    if (query.data) analytics.track({ type: 'view_product', productId: query.data.id, category: query.data.category })
  }, [query.data])
  return query
}
```

- [ ] **Step 9: RootLayout 記錄 page_view，badge 加 data-testid**

`src/app/RootLayout.tsx`：

```tsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { analytics } from '../services/analytics'
// ...
export default function RootLayout() {
  const { count } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => { analytics.track({ type: 'page_view', path: pathname }) }, [pathname])
  // ...
              <span data-testid="cart-badge" className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-momo px-1 text-xs text-white">
```

> 已知：dev 模式下 StrictMode 會讓 `page_view` 重複一次；production build（E2E 與 Pages 用的）不受影響。

- [ ] **Step 10: 執行確認通過**

Run: `npx vitest run`
Expected: PASS，26 tests（原 17 ＋ analytics 8 ＋ RouteError 1）。

- [ ] **Step 11: 手動確認**

Run: `npm run dev`，瀏覽首頁 → 搜尋 → 商品 → 加購 → 購物車 → 結帳按鈕。DevTools Console 應看到 `[analytics]` 五種事件；Application → Local Storage 的 `momo-mock.analytics.v1` 為陣列。

- [ ] **Step 12: 全量檢查並 commit**

```bash
npx tsc -b && npm run lint && npm test
git add src/features/products/hooks/useSearch.ts src/features/products/hooks/useGoodsDetail.ts src/features/cart/hooks/useCart.ts src/features/cart/cart.integration.test.tsx src/pages/CartPage.tsx src/app/RootLayout.tsx src/app/RouteError.tsx src/app/RouteError.test.tsx src/app/router.tsx
git commit -m "feat(analytics): emit page_view/search/view_product/cart/error events from hooks and router layer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 統計彙總純函式

**Files:**
- Create: `src/features/stats/aggregate.ts`
- Test: `src/features/stats/aggregate.test.ts`

**Interfaces:**
- Consumes: `RecordedEvent`、`AnalyticsEventType` from `src/services/analytics.ts`。
- Produces:
  - `interface Bar { label: string; value: number }`
  - `const EVENT_LABELS: Record<AnalyticsEventType, string>`
  - `countByType(events: RecordedEvent[]): Bar[]`（七種固定順序，含 0）
  - `topSearches(events, limit = 5): Bar[]`
  - `zeroResultSearches(events, limit = 5): Bar[]`
  - `topAddedProducts(events, limit = 5): Bar[]`（依 qty 加總，label 為 productId）
  - `recentErrors(events, limit = 10): { message: string; path: string; timestamp: number }[]`（新到舊）

- [ ] **Step 1: 寫失敗測試**

```ts
// src/features/stats/aggregate.test.ts
import { describe, expect, it } from 'vitest'
import type { RecordedEvent } from '../../services/analytics'
import { EVENT_LABELS, countByType, recentErrors, topAddedProducts, topSearches, zeroResultSearches } from './aggregate'

const t = (i: number) => 1_000 + i
const events: RecordedEvent[] = [
  { type: 'page_view', path: '/', timestamp: t(1) },
  { type: 'search', keyword: '耳機', sort: 'relevance', resultCount: 6, timestamp: t(2) },
  { type: 'search', keyword: '耳機', sort: 'priceAsc', resultCount: 6, timestamp: t(3) },
  { type: 'search', keyword: '鍵盤', sort: 'relevance', resultCount: 3, timestamp: t(4) },
  { type: 'search', keyword: '飛碟', sort: 'relevance', resultCount: 0, timestamp: t(5) },
  { type: 'search', keyword: '飛碟', sort: 'relevance', resultCount: 0, timestamp: t(6) },
  { type: 'view_product', productId: '3c-1', category: '3c', timestamp: t(7) },
  { type: 'add_to_cart', productId: '3c-1', qty: 2, variant: '黑色', timestamp: t(8) },
  { type: 'add_to_cart', productId: '3c-1', qty: 1, timestamp: t(9) },
  { type: 'add_to_cart', productId: 'food-2', qty: 1, timestamp: t(10) },
  { type: 'remove_from_cart', productId: 'food-2', timestamp: t(11) },
  { type: 'checkout_click', cartTotal: 5070, itemCount: 3, timestamp: t(12) },
  { type: 'error', message: 'boom', path: '/x', timestamp: t(13) },
  { type: 'error', message: 'later', path: '/y', timestamp: t(14) },
]

describe('countByType', () => {
  it('七種事件固定順序，含 0 的類型', () => {
    expect(countByType([])).toEqual(Object.values(EVENT_LABELS).map(label => ({ label, value: 0 })))
  })
  it('依類型計數', () => {
    const m = Object.fromEntries(countByType(events).map(b => [b.label, b.value]))
    expect(m).toMatchObject({ 頁面瀏覽: 1, 搜尋: 5, 瀏覽商品: 1, 加入購物車: 2, 移出購物車: 1, 點擊結帳: 1, 前端錯誤: 2 })
  })
})

describe('topSearches', () => {
  it('依次數遞減，同分依字串遞增，受 limit 限制', () => {
    expect(topSearches(events)).toEqual([
      { label: '耳機', value: 2 }, { label: '飛碟', value: 2 }, { label: '鍵盤', value: 1 },
    ])
    expect(topSearches(events, 1)).toEqual([{ label: '耳機', value: 2 }])
  })
  it('空事件回空陣列', () => expect(topSearches([])).toEqual([]))
})

describe('zeroResultSearches', () => {
  it('只收 resultCount 為 0 的關鍵字並計次', () => {
    expect(zeroResultSearches(events)).toEqual([{ label: '飛碟', value: 2 }])
  })
})

describe('topAddedProducts', () => {
  it('依 qty 加總', () => {
    expect(topAddedProducts(events)).toEqual([{ label: '3c-1', value: 3 }, { label: 'food-2', value: 1 }])
  })
})

describe('recentErrors', () => {
  it('新到舊，受 limit 限制', () => {
    expect(recentErrors(events)).toEqual([
      { message: 'later', path: '/y', timestamp: t(14) },
      { message: 'boom', path: '/x', timestamp: t(13) },
    ])
    expect(recentErrors(events, 1)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/features/stats`
Expected: FAIL，找不到模組 `./aggregate`。

- [ ] **Step 3: 寫最小實作**

```ts
// src/features/stats/aggregate.ts
import type { AnalyticsEventType, RecordedEvent } from '../../services/analytics'

export interface Bar { label: string; value: number }

/** 固定順序：決定 countByType 的輸出順序與圖表色序（單一色相，順序只影響閱讀） */
export const EVENT_LABELS: Record<AnalyticsEventType, string> = {
  page_view: '頁面瀏覽',
  search: '搜尋',
  view_product: '瀏覽商品',
  add_to_cart: '加入購物車',
  remove_from_cart: '移出購物車',
  checkout_click: '點擊結帳',
  error: '前端錯誤',
}

/** 累加並排序：value 遞減、同分 label 遞增（zh-TW 排序），再截斷 */
function tally(entries: Iterable<[string, number]>, limit: number): Bar[] {
  const m = new Map<string, number>()
  for (const [k, v] of entries) m.set(k, (m.get(k) ?? 0) + v)
  return [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-TW'))
    .slice(0, limit)
}

export function countByType(events: RecordedEvent[]): Bar[] {
  const counts = new Map<AnalyticsEventType, number>()
  for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
  return (Object.keys(EVENT_LABELS) as AnalyticsEventType[]).map(type => ({ label: EVENT_LABELS[type], value: counts.get(type) ?? 0 }))
}

export function topSearches(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'search' ? [[e.keyword, 1] as [string, number]] : [])), limit)
}

export function zeroResultSearches(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'search' && e.resultCount === 0 ? [[e.keyword, 1] as [string, number]] : [])), limit)
}

export function topAddedProducts(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'add_to_cart' ? [[e.productId, e.qty] as [string, number]] : [])), limit)
}

export function recentErrors(events: RecordedEvent[], limit = 10) {
  return events
    .flatMap(e => (e.type === 'error' ? [{ message: e.message, path: e.path, timestamp: e.timestamp }] : []))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/features/stats`
Expected: PASS，7 tests。

- [ ] **Step 5: 全量檢查並 commit**

```bash
npx tsc -b && npm run lint && npm test
git add src/features/stats/aggregate.ts src/features/stats/aggregate.test.ts
git commit -m "feat(stats): pure aggregation functions for analytics events

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: `/stats` 統計頁（純 CSS 長條圖）

**Files:**
- Create: `src/features/stats/components/BarList.tsx`
- Create: `src/features/stats/hooks/useAnalyticsEvents.ts`
- Create: `src/pages/StatsPage.tsx`
- Modify: `src/app/router.tsx`（新增 lazy route）
- Modify: `src/app/RootLayout.tsx:51-53`（Footer 連結）
- Test: `src/features/stats/components/BarList.test.tsx`

**Interfaces:**
- Consumes: `Bar`、`countByType`、`topSearches`、`zeroResultSearches`、`topAddedProducts`、`recentErrors` from `src/features/stats/aggregate.ts`（Task 3）；`analytics` from Task 1。
- Produces: `BarList({ title, bars, emptyText? })`；`useAnalyticsEvents(): { events: RecordedEvent[]; clear: () => void; refresh: () => void }`；route `/stats`。

- [ ] **Step 1: 寫 BarList 失敗測試**

```tsx
// src/features/stats/components/BarList.test.tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarList } from './BarList'

describe('BarList', () => {
  it('沒有資料時顯示空狀態', () => {
    render(<BarList title="熱門搜尋" bars={[]} />)
    expect(screen.getByText('尚無資料')).toBeInTheDocument()
  })
  it('全為 0 時也顯示空狀態（避免除以零）', () => {
    render(<BarList title="x" bars={[{ label: 'a', value: 0 }]} />)
    expect(screen.getByText('尚無資料')).toBeInTheDocument()
  })
  it('長條寬度依最大值等比', () => {
    render(<BarList title="x" bars={[{ label: 'a', value: 4 }, { label: 'b', value: 2 }]} />)
    expect(screen.getByTestId('bar-a')).toHaveStyle({ width: '100%' })
    expect(screen.getByTestId('bar-b')).toHaveStyle({ width: '50%' })
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run src/features/stats/components`
Expected: FAIL，找不到模組 `./BarList`。

- [ ] **Step 3: 實作 BarList**

設計依 dataviz 原則：單一序列不需圖例；標題即序列名；長條細（8px）、端點圓角、單一色相（`bg-momo`）；數值與標籤用文字色不用序列色；hover 以 `title` 顯示數值。

```tsx
// src/features/stats/components/BarList.tsx
import type { Bar } from '../aggregate'

export function BarList({ title, bars, emptyText = '尚無資料' }: { title: string; bars: Bar[]; emptyText?: string }) {
  const max = Math.max(0, ...bars.map(b => b.value))
  return (
    <section className="rounded-lg bg-white p-4">
      <h2 className="mb-3 border-l-4 border-momo pl-2 font-bold">{title}</h2>
      {max === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bars.map(b => (
            <li key={b.label} title={`${b.label}：${b.value}`}
              className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm">
              <span className="truncate text-gray-700">{b.label}</span>
              <span className="h-2 rounded-full bg-gray-100">
                <span data-testid={`bar-${b.label}`} className="block h-2 rounded-full bg-momo"
                  style={{ width: `${(b.value / max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-gray-500">{b.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run src/features/stats/components`
Expected: PASS，3 tests。

- [ ] **Step 5: hook 與頁面**

```ts
// src/features/stats/hooks/useAnalyticsEvents.ts
import { useState } from 'react'
import { analytics } from '../../../services/analytics'

/** 讀一次快照；清除後立即反映。不做即時訂閱：統計頁是回顧工具，不需要 live。 */
export function useAnalyticsEvents() {
  const [events, setEvents] = useState(() => analytics.list())
  const clear = () => { analytics.clear(); setEvents([]) }
  const refresh = () => setEvents(analytics.list())
  return { events, clear, refresh }
}
```

```tsx
// src/pages/StatsPage.tsx
import { useAnalyticsEvents } from '../features/stats/hooks/useAnalyticsEvents'
import { countByType, recentErrors, topAddedProducts, topSearches, zeroResultSearches } from '../features/stats/aggregate'
import { BarList } from '../features/stats/components/BarList'
import { Button } from '../shared/ui/Button'
import { MAX_EVENTS } from '../services/analytics'

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('zh-TW')}</p>
    </div>
  )
}

export default function StatsPage() {
  const { events, clear, refresh } = useAnalyticsEvents()
  const byType = countByType(events)
  const get = (label: string) => byType.find(b => b.label === label)?.value ?? 0
  const errors = recentErrors(events)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="border-l-4 border-momo pl-2 text-xl font-bold">站內統計</h1>
          <p className="mt-1 text-xs text-gray-500">
            Analytics Event 的 mock sink：資料只存於此瀏覽器 localStorage，保留最近 {MAX_EVENTS} 筆。接真 SDK 時只需替換 services/analytics.ts。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>重新整理</Button>
          <Button variant="outline" onClick={clear}>清除紀錄</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="事件總數" value={events.length} />
        <Tile label="搜尋次數" value={get('搜尋')} />
        <Tile label="加入購物車" value={get('加入購物車')} />
        <Tile label="前端錯誤" value={get('前端錯誤')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarList title="事件類型分布" bars={byType} />
        <BarList title="熱門搜尋詞" bars={topSearches(events)} />
        <BarList title="零結果搜尋詞" bars={zeroResultSearches(events)} emptyText="沒有零結果的搜尋，太好了" />
        <BarList title="加購最多的商品（件數）" bars={topAddedProducts(events)} />
      </div>

      <section className="rounded-lg bg-white p-4">
        <h2 className="mb-3 border-l-4 border-momo pl-2 font-bold">最近錯誤</h2>
        {errors.length === 0 ? (
          <p className="text-sm text-gray-400">尚無錯誤</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500"><tr><th className="py-1">時間</th><th>路徑</th><th>訊息</th></tr></thead>
            <tbody>
              {errors.map(e => (
                <tr key={e.timestamp} className="border-t">
                  <td className="py-1 tabular-nums">{new Date(e.timestamp).toLocaleString('zh-TW')}</td>
                  <td className="font-mono text-xs">{e.path}</td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 6: 路由與 Footer 連結**

`src/app/router.tsx`：

```tsx
const StatsPage = lazy(() => import('../pages/StatsPage'))
// children 內、'*' 之前：
      { path: 'stats', element: <StatsPage /> },
```

`src/app/RootLayout.tsx` footer 改為：

```tsx
      <footer className="mt-12 border-t bg-white py-6 text-center text-xs text-gray-400">
        <p>momo mock — Frontend take-home（純前端練習，非商業用途）</p>
        <Link to="/stats" className="mt-1 inline-block underline hover:text-momo">站內統計</Link>
      </footer>
```

- [ ] **Step 7: 手動確認**

Run: `npm run dev`。先逛幾頁、搜尋一個不存在的詞（如「飛碟」）、加購兩件，再點 Footer「站內統計」。預期：四個 tile 有數字、四張長條圖有資料、零結果搜尋詞顯示「飛碟」、清除後全部變成空狀態。縮到 400px 寬確認 tile 兩欄、圖表單欄。

- [ ] **Step 8: 全量檢查並 commit**

```bash
npx tsc -b && npm run lint && npm test
git add src/features/stats src/pages/StatsPage.tsx src/app/router.tsx src/app/RootLayout.tsx
git commit -m "feat(stats): /stats page with CSS bar charts over analytics events; footer link

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Playwright E2E（三支 spec，對 production preview 跑）

**Files:**
- Modify: `package.json`（devDependency、scripts）
- Create: `playwright.config.ts`
- Create: `e2e/shopping-flow.spec.ts`
- Create: `e2e/url-state.spec.ts`
- Create: `e2e/error-paths.spec.ts`
- Modify: `vite.config.ts`（vitest 排除 `e2e/**`）
- Modify: `tsconfig.node.json`（include e2e 與 playwright.config.ts）
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `data-testid="cart-badge"`（Task 2）；analytics storage key `momo-mock.analytics.v1`（Task 1）。
- Produces: `npm run e2e`、`npm run typecheck`；CI（Task 6）直接呼叫。

- [ ] **Step 1: 安裝與腳本**

```bash
npm i -D @playwright/test@1.63.0
npx playwright install chromium
```

`package.json` scripts 改為：

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run",
    "e2e": "playwright test"
  },
```

- [ ] **Step 2: 設定檔**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    locale: 'zh-TW',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // 對 production build 的 preview 跑：才會抓到 lazy chunk／minify／purge 類問題，且與部署產物一致
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
```

`vite.config.ts`：

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom', globals: true, setupFiles: './src/test-setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
```

`tsconfig.node.json`：`lib` 加入 DOM（e2e 的 `page.evaluate` 回呼會用到 `localStorage`），include 加入 e2e 與 Playwright 設定：

```json
    "lib": ["ES2023", "DOM"],
```

```json
  "include": ["vite.config.ts", "playwright.config.ts", "e2e"]
```

`.gitignore` 追加：

```
test-results
playwright-report
playwright/.cache
```

- [ ] **Step 3: 購物主流程 spec**

```ts
// e2e/shopping-flow.spec.ts
import { expect, test } from '@playwright/test'

// 確定性 mock：搜尋「耳機」命中 6 件，第一件為 3c-1（有顏色規格、有庫存、$1,690）
test('搜尋 → 商品 → 加入購物車 → 購物車調量 → 重整後持久，且記錄 add_to_cart 事件', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('請輸入關鍵字或品號').fill('耳機')
  await page.getByRole('button', { name: '搜尋' }).click()

  await expect(page).toHaveURL(/\/search\//)
  await expect(page.getByText('共 6 件商品')).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: /耳機/ }).first().click()
  await expect(page).toHaveURL(/\/goods\/3c-1$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('真無線藍牙耳機')

  await page.getByRole('button', { name: '黑色' }).click()
  await page.getByRole('button', { name: '增加數量' }).click()
  await page.getByRole('button', { name: '加入購物車' }).click()
  await expect(page.getByRole('button', { name: '✓ 已加入' })).toBeVisible()
  await expect(page.getByTestId('cart-badge')).toHaveText('2')

  await page.getByRole('link', { name: '購物車' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('購物車（1 項）')
  await expect(page.getByText('黑色')).toBeVisible()

  await page.getByRole('button', { name: '增加數量' }).click()
  await expect(page.getByTestId('cart-badge')).toHaveText('3')
  // 3 × $1,690 = $5,070；MiniCart 也會顯示同一金額，所以限定在總計側欄內找
  await expect(page.locator('aside', { hasText: '商品總計' }).getByText('$5,070')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('購物車（1 項）')
  await expect(page.getByTestId('cart-badge')).toHaveText('3')

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem('momo-mock.analytics.v1') ?? '[]') as Array<Record<string, unknown>>)
  expect(events).toContainEqual(expect.objectContaining({ type: 'add_to_cart', productId: '3c-1', variant: '黑色', qty: 2 }))
})
```

- [ ] **Step 4: URL 即狀態 spec**

```ts
// e2e/url-state.spec.ts
import { expect, test } from '@playwright/test'

// 「3C」命中整個 3C 分類 21 件（PAGE_SIZE 20 → 2 頁）；priceAsc 最低價 $1,690、第 2 頁唯一一件 $3,690
test('直連帶 sort 的搜尋網址會還原排序，分頁與 URL 同步', async ({ page }) => {
  await page.goto('/search/3C?sort=priceAsc')
  await expect(page.getByText('共 21 件商品')).toBeVisible()
  await expect(page.getByRole('button', { name: '價格由低到高' })).toHaveClass(/bg-momo/)

  const grid = page.getByRole('main')
  const firstCard = grid.getByRole('link', { name: /【/ }).first()
  await expect(firstCard).toContainText('$1,690')

  await page.getByRole('button', { name: '下一頁' }).click()
  await expect(page).toHaveURL(/sort=priceAsc/)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('頁數 2/2')).toBeVisible()
  await expect(grid.getByRole('link', { name: /【/ })).toHaveCount(1)
  await expect(grid.getByRole('link', { name: /【/ })).toContainText('$3,690')
  await expect(page.getByRole('button', { name: '下一頁' })).toBeDisabled()
})

test('切換排序會回到第 1 頁', async ({ page }) => {
  await page.goto('/search/3C?sort=priceAsc&page=2')
  await expect(page.getByText('頁數 2/2')).toBeVisible()
  await page.getByRole('button', { name: '價格由高到低' }).click()
  await expect(page).toHaveURL(/sort=priceDesc/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByText('頁數 1/2')).toBeVisible()
})
```

- [ ] **Step 5: 錯誤路徑 spec**

```ts
// e2e/error-paths.spec.ts
import { expect, test } from '@playwright/test'

test('不存在的商品顯示無展售訊息，而非白屏或全域錯誤', async ({ page }) => {
  await page.goto('/goods/nope')
  await expect(page.getByText('很抱歉！此商品目前無展售')).toBeVisible()
  await page.getByRole('link', { name: '回首頁逛逛' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('未知路由顯示 404 頁', async ({ page }) => {
  await page.goto('/no/such/page')
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByText('找不到這個頁面')).toBeVisible()
})
```

- [ ] **Step 6: 執行 E2E**

Run: `npm run e2e`
Expected: 5 passed。webServer 會先 build 再 preview（首次約 20–40 秒）。

若 `getByRole('link', { name: /耳機/ })` 因 ProductCard 的 img alt 與文字重複而出現 strict mode 錯誤，已用 `.first()` 處理；若 `共 6 件商品` 數字不符，先跑 `npx vitest run src/services` 確認 mock data 沒被改過，不要直接改數字。

- [ ] **Step 7: 全量檢查並 commit**

```bash
npm run typecheck && npm run lint && npm test && npm run e2e
git add package.json package-lock.json playwright.config.ts e2e vite.config.ts tsconfig.node.json .gitignore
git commit -m "test(e2e): playwright specs for shopping flow, url-as-state and error paths against production preview

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: CI workflow（check ＋ e2e）

**Files:**
- Create: `.nvmrc`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`npm run e2e`（Task 5）。
- Produces: 名為 `CI` 的 workflow；Task 7 的 deploy 以 `workflow_run` 監聽此名稱。

- [ ] **Step 1: 釘 Node 版本**

```bash
echo 24 > .nvmrc
```

- [ ] **Step 2: 撰寫 workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: typecheck · lint · unit · build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build

  e2e:
    name: playwright e2e (production preview)
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npm run e2e
      - name: Upload Playwright report (on failure)
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

- [ ] **Step 3: 本機模擬 CI 條件**

Run: `CI=1 npm run e2e`
Expected: 5 passed；`forbidOnly`／retries 啟用，`playwright-report/` 產生。

- [ ] **Step 4: Commit 並推送，觀察 run**

```bash
git add .nvmrc .github/workflows/ci.yml
git commit -m "ci: github actions workflow with check (tsc/lint/vitest/build) and e2e (playwright) jobs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
gh run watch --exit-status
```

Expected: `CI` run 兩個 job 皆 ✓。若 `e2e` 失敗，`gh run download -n playwright-report` 取回報告，`npx playwright show-report playwright-report` 看 trace；修正後再 push。

---

### Task 7: GitHub Pages 部署 workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: 名為 `CI` 的 workflow（Task 6）。
- Produces: live URL `https://lucywu0501.github.io/momo-mock/`。

- [ ] **Step 1: 啟用 Pages（來源 = GitHub Actions）**

```bash
gh api -X POST repos/lucywu0501/momo-mock/pages -f build_type=workflows
gh api repos/lucywu0501/momo-mock/pages --jq '{build_type, html_url}'
```

Expected: `build_type: "workflows"`，`html_url: "https://lucywu0501.github.io/momo-mock/"`。若回 409（已存在），改用 `-X PUT` 同樣參數。

- [ ] **Step 2: 撰寫 workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    # 只在 CI（check + e2e）成功時部署，live URL 永遠是綠燈版本
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.workflow_run.head_sha }}
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      # tsc 已在 CI 跑過；這裡只產出帶 base 的靜態檔。router basename 讀 BASE_URL，程式碼不需改。
      - run: npx vite build --base=/momo-mock/
      - name: SPA fallback for deep links
        run: cp dist/index.html dist/404.html
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 3: 本機驗證帶 base 的 build 可開**

```bash
npx vite build --base=/momo-mock/ && cp dist/index.html dist/404.html
npx vite preview --port 4174 --strictPort &
sleep 2
curl -s http://localhost:4174/momo-mock/ | grep -c 'id="root"'
kill %1
```

Expected: `1`。

- [ ] **Step 4: Commit、推送、等兩段 run**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to github pages after CI succeeds on main (SPA 404 fallback, base /momo-mock/)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
gh run watch --exit-status            # CI
sleep 20
gh run list --workflow "Deploy to GitHub Pages" --limit 1
gh run watch --exit-status $(gh run list --workflow "Deploy to GitHub Pages" --limit 1 --json databaseId --jq '.[0].databaseId')
```

- [ ] **Step 5: 驗證 live URL 與深連結**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://lucywu0501.github.io/momo-mock/
curl -s https://lucywu0501.github.io/momo-mock/cart | grep -c 'id="root"'
```

Expected: 第一行 `200`；第二行 `1`（GitHub 對深連結回 404 狀態碼但 body 是 SPA，router 接手後畫面正確）。再用瀏覽器開 `https://lucywu0501.github.io/momo-mock/`，走一次搜尋 → 商品 → 加購 → 購物車 → `/stats`。

---

### Task 8: 文件更新與視覺紀錄

**Files:**
- Modify: `README.md`
- Modify: `docs/worklog.md`
- Create: `docs/checks/task13-stats.jpeg`
- Create: `docs/checks/task13-ci.jpeg`

- [ ] **Step 1: 截圖 `/stats` 與 CI**

```bash
npm run build && (npx vite preview --port 4173 --strictPort &) && sleep 2
# E2E 每個 test 用獨立 context，不會留下事件；改用一支 Playwright 腳本先逛幾頁製造事件，再截 /stats
SHOT="${TMPDIR:-/tmp}/stats-shot.mjs"
cat > "$SHOT" <<'EOF'
import { chromium } from '@playwright/test'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const go = async (u) => { await p.goto('http://localhost:4173' + u); await p.waitForTimeout(800) }
await go('/'); await go('/search/耳機'); await go('/search/飛碟'); await go('/goods/3c-1')
await p.getByRole('button', { name: '加入購物車' }).click(); await go('/cart'); await go('/goods/nope'); await go('/stats')
await p.screenshot({ path: 'docs/checks/task13-stats.jpeg', type: 'jpeg', quality: 80, fullPage: true })
await b.close()
EOF
node "$SHOT"
kill %1
```

CI 截圖：開 `https://github.com/lucywu0501/momo-mock/actions` 最新一次綠燈 run，用 Chrome DevTools MCP 或手動截圖存為 `docs/checks/task13-ci.jpeg`。

- [ ] **Step 2: README 更新**

在標題下方第一段後加 badge 與 live URL：

```markdown
[![CI](https://github.com/lucywu0501/momo-mock/actions/workflows/ci.yml/badge.svg)](https://github.com/lucywu0501/momo-mock/actions/workflows/ci.yml)
**Live demo**：https://lucywu0501.github.io/momo-mock/ （main 通過 CI 後自動部署）
```

「快速開始」加兩行：

```bash
npm run e2e      # Playwright E2E（對 production preview 跑，5 個流程測試）
npm run typecheck
```

「架構總覽」的 `services/` 註解改為：`# API 與分析事件的抽象層；mock 實作（延遲、伺服器端 filter/sort/分頁語意、localStorage 事件 sink）全部收在這層`。並新增一列：`  features/stats/  # 站內統計：彙總 Analytics Event、純 CSS 長條圖`。

「關鍵 Tradeoff」表的「測試」列改為：

```markdown
| 測試 | 邏輯單測＋行為測試＋Playwright E2E（CI）＋Agent 視覺對照 | snapshot／視覺快照 | snapshot 只報「變了」不報「壞了」；E2E 只斷言行為（文字、數量、URL、localStorage），視覺層交給 Agent 截圖對照真站 |
```

新增兩列：

```markdown
| CI／部署 | GitHub Actions（check＋e2e）→ Pages | Vercel／Netlify | 評估重點是「善用 GitHub 功能」；workflow_run 讓 live URL 永遠是綠燈版本 |
| 分析事件 | service-layer mock sink（localStorage）＋`/stats` | GA4／PostHog SDK | 專案前提是零真實 API；同一邊界模式讓換真 SDK 只改一檔，`/stats` 用零依賴 CSS 圖表展示 observability 思維 |
```

「驗證策略」改為四層，新增第 4 層：

```markdown
4. **CI 自動驗證**：每次 push 跑 `check`（tsc＋oxlint＋vitest＋build）與 `e2e`（Playwright 對 production preview 跑購物流程／URL 狀態／錯誤路徑）；main 綠燈後 `workflow_run` 觸發部署到 GitHub Pages。E2E 失敗自動上傳 trace／HTML report 供回放。
```

新增段落「## Observability」：

```markdown
## Observability

- **產品分析**：`services/analytics.ts` 定義七種型別化 Analytics Event（page_view／search／view_product／add_to_cart／remove_from_cart／checkout_click／error），由 hooks／store／router 層發出，UI 元件不知情。mock sink 存 localStorage ring buffer（500 筆），儲存失敗靜默不影響購物流程。
- **統計頁 `/stats`**（Footer 連結）：事件類型分布、熱門搜尋詞、零結果搜尋詞、加購最多商品、最近錯誤；純 CSS 長條圖、單一色相、數值 hover 可見。
- **錯誤監控**：router `errorElement` 把 render 錯誤記為 `error` 事件，於 `/stats` 可見；真實專案對應 Sentry。
- **Pipeline 可觀測性**：CI badge、Actions 失敗 artifact（Playwright trace）、Pages deployment 環境 URL。
```

「刻意不做」加上：`coverage 門檻、Lighthouse CI、branch protection（solo 專案；團隊化時以 check＋e2e 為 required checks）`。

「演進方向」改為：

```markdown
MSW 取代手寫 mock → Next.js SSR/SSG（SEO/LCP）→ Radix/Headless UI 補 a11y 複雜元件 → ESLint/oxlint boundary rule 強制 feature 邊界 → 真實分析 SDK（GA4／PostHog，只換 `services/analytics.ts`）與 Sentry → Lighthouse CI 效能預算 → mobile 無限捲動／react-window → `/live`（WebSocket mock＋隔離的 video feature）→ 會員與訂單領域。
```

「與真實網站的主要差異」維持；「AI/Agent 協作」加一句：`Phase 3（Validation / Observability）：以 /grill-with-docs 對談定案 24 個決策（docs/superpowers/specs/），建立 CONTEXT.md 詞彙表，再由 Agent 依實作計畫執行。`

- [ ] **Step 3: worklog 新增 Task 13**

```markdown
## Task 13 — Validation / Observability：CI、GitHub Pages、站內分析
- 設計：`/grill-with-docs` 三輪 24 題定案（spec：docs/superpowers/specs/2026-10-04-ci-pages-analytics.md）；建立 CONTEXT.md 詞彙表（Product／Category／Promotion／Variant／Facet／Cart Item／Analytics Event）。
- 分析事件：services/analytics.ts（型別化七種事件、localStorage ring buffer 500 筆、儲存失敗靜默）；由 useSearch／useGoodsDetail／useCart／RootLayout／RouteError 發出，UI 元件零修改。TDD：sink 8 tests、aggregate 8 tests、BarList 3 tests、RouteError 1 test 先紅後綠。
- `/stats`：純 CSS 長條圖（單一色相、文字用文字色、hover 顯示數值），四個 tile＋四張圖＋錯誤表；Footer 連結。截圖 docs/checks/task13-stats.jpeg。
- E2E：Playwright 5 tests（購物主流程含 localStorage 事件斷言、URL 即狀態×2、錯誤路徑×2），對 production preview 跑；selector 走 role／文字，只有 cart badge 用 data-testid。不做視覺快照（維持 README 立場）。
- CI：ci.yml 兩個 job（check／e2e），e2e 失敗上傳 trace；deploy.yml 以 workflow_run 接在 CI 成功之後，`--base=/momo-mock/` ＋ 404.html fallback 部署 Pages。Live：https://lucywu0501.github.io/momo-mock/ 。截圖 docs/checks/task13-ci.jpeg。
- 取捨：不設 coverage 門檻、不做 Lighthouse CI、不開 branch protection（solo）；分析走 mock sink 而非真 SDK（專案零真實 API 前提）。
```

- [ ] **Step 4: Commit 並推送**

```bash
npm run typecheck && npm run lint && npm test
git add README.md docs/worklog.md docs/checks/task13-stats.jpeg docs/checks/task13-ci.jpeg CONTEXT.md CLAUDE.md docs/agents docs/superpowers
git commit -m "docs: README observability/CI sections, worklog task 13, glossary and agent config

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push origin main
gh run watch --exit-status
```

Expected: CI 綠燈 → Deploy 綠燈 → live URL 更新（Footer 有「站內統計」）。
