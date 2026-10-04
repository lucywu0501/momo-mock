# Momo Mock — 實作計畫（Phase 2 Implementation Plan）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依 `docs/design.md` 在約 120 分鐘的 commit 視窗內建出 momo 購物網的純前端 mock（首頁／搜尋／商品詳情／購物車）。

**Architecture:** Feature-based 結構；service layer 隔離 mock 資料；狀態三層歸屬（URL＝搜尋條件、TanStack Query＝server state、Context+useReducer＋localStorage＝購物車）。pages 為薄組裝層。

**Tech Stack:** Vite・React 19・TypeScript・React Router v7・TanStack Query v5・Tailwind CSS v4・lucide-react・Vitest・React Testing Library

## Global Constraints

- TypeScript strict mode（Vite 模板預設即開）
- feature 之間不得互相 import；只能經 `shared/` 與 `app/`；`pages/` 單向依賴 `features/`
- 不使用元件庫；不呼叫任何真實 momo API
- 主色 momo 桃紅 `#d4007f`；價格紅 `#e60012`
- Commit：Conventional Commits＋結尾 `Co-Authored-By: Claude <noreply@anthropic.com>`
- **計時**：Task 0 的第一個 commit 啟動約 120 分鐘視窗；每個 Task 結尾必 commit
- 每個 UI Task 結尾：Agent 以 Chrome DevTools 截圖與 `docs/momo-ref/` 對照，結果記入 `docs/worklog.md`
- 驗證指令（每 Task 收尾跑）：`npx tsc -b && npx vitest run`
- 時間不足時的棄守順序（後棄先保）：篩選面板收合 RWD → 分頁 → Gallery 縮圖列 → 排序。架構層不可棄。
- 若 Task 0–7 提前完成且視窗有餘裕：加做延伸目標 `/discover`（新增 `features/discover/`＋路由，重用 ProductCard 與 service layer，證明架構可擴充；獨立 commit）。

---

### Task 0: Scaffold 與文件入庫

**Files:**
- Create: 專案根（Vite 模板）、`src/` 資料夾骨架、`src/index.css`、`vite.config.ts`（加 tailwind plugin）
- Already exist: `docs/design.md`、`docs/plan.md`、`docs/momo-ref/*.jpeg`

**Interfaces:**
- Produces: 可啟動的空專案；路徑別名不使用（相對 import）；Tailwind `@theme` 內 `--color-momo: #d4007f`、`--color-price: #e60012`

- [ ] **Step 1: 建立 Vite 專案與依賴**

```bash
cd /Users/lucywu/Documents/momo-mock
npm create vite@latest . -- --template react-ts   # 既有 docs/ 不衝突，選擇保留檔案繼續
npm i react-router @tanstack/react-query lucide-react tailwindcss @tailwindcss/vite
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Tailwind v4 接上 Vite**

`vite.config.ts`：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test-setup.ts' },
})
```

`src/index.css` 全檔替換為：

```css
@import "tailwindcss";

@theme {
  --color-momo: #d4007f;
  --color-price: #e60012;
}
```

`src/test-setup.ts`：

```ts
import '@testing-library/jest-dom/vitest'
```

`vite.config.ts` 頂端加 `/// <reference types="vitest/config" />` 以通過型別檢查。`package.json` scripts 加 `"test": "vitest run"`。

- [ ] **Step 3: 資料夾骨架與模板清理**

```bash
mkdir -p src/app src/pages src/features/products/{components,hooks} \
         src/features/cart/{components,store,hooks} src/services/mock src/shared/{ui,utils}
rm -f src/App.css src/assets/react.svg public/vite.svg
```

刪除 Vite 模板的 `src/App.tsx` 示範內容（Task 3 會重寫 entry）。暫時讓 `src/App.tsx` 為：

```tsx
export default function App() {
  return <div className="text-momo p-8 text-2xl font-bold">momo mock — scaffold OK</div>
}
```

- [ ] **Step 4: 驗證 dev server 與型別**

Run: `npx tsc -b && npm run dev -- --port 5173`（背景啟動，開 `http://localhost:5173` 應見桃紅字樣）
Expected: 編譯無錯、頁面顯示桃紅文字（確認 Tailwind theme 色生效）

- [ ] **Step 5: git init 與頭兩個 commit（⏱ 計時開始）**

```bash
git init -b main
printf 'node_modules\ndist\n' > .gitignore
git add .gitignore package.json package-lock.json vite.config.ts tsconfig*.json index.html src/ public/ eslint.config.js
git commit -m "chore: scaffold Vite + React 19 + TS + Tailwind with feature-based skeleton

Co-Authored-By: Claude <noreply@anthropic.com>"
git add docs/
git commit -m "docs: add Phase 1 design doc, implementation plan and momo reference screenshots

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 1: 型別、Mock Data 與 Service Layer

**Files:**
- Create: `src/features/products/types.ts`、`src/services/mock/data.ts`、`src/services/mock/delay.ts`、`src/services/api.ts`
- Test: `src/services/api.test.ts`

**Interfaces:**
- Produces（後續所有 Task 依賴，簽名如下，不可改名）:
  - `types.ts`：`ProductSummary`、`Product`、`Category`、`CategoryId`、`SortKey`、`SearchParams`、`Page<T>`、`HomeSection`
  - `api.ts`：`api.getHomeSections(): Promise<HomeSection[]>`、`api.searchProducts(p: SearchParams): Promise<Page<ProductSummary>>`、`api.getProduct(id: string): Promise<Product>`、`api.getCategories(): Promise<Category[]>`、`class NotFoundError extends Error`

- [ ] **Step 1: 寫型別**

`src/features/products/types.ts`：

```ts
export type CategoryId = '3c' | 'appliance' | 'beauty' | 'food' | 'fashion' | 'sports' | 'home' | 'baby'

export interface Category { id: CategoryId; name: string }

export interface ProductSummary {
  id: string
  name: string
  brand: string
  price: number        // 促銷價
  listPrice?: number   // 原價（有促銷時才有）
  image: string
  category: CategoryId
  inStock: boolean
  tags: string[]       // 促銷 badge，如「限時下殺」
}

export interface Product extends ProductSummary {
  images: string[]
  specs: string[]                                    // bullet 規格
  variant?: { label: string; options: string[] }     // 單一維度規格（如顏色）
}

export type SortKey = 'relevance' | 'priceAsc' | 'priceDesc'

export interface SearchParams {
  keyword: string
  category?: CategoryId
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
  page?: number        // 1-based，預設 1
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface HomeSection { id: string; title: string; products: ProductSummary[] }
```

- [ ] **Step 2: 寫 mock data（確定性生成，8 分類 × 7 筆 = 56 筆）**

`src/services/mock/data.ts`：

```ts
import type { Category, CategoryId, Product } from '../../features/products/types'

export const CATEGORIES: Category[] = [
  { id: '3c', name: '3C' }, { id: 'appliance', name: '家電' },
  { id: 'beauty', name: '美妝保養' }, { id: 'food', name: '食品/飲料' },
  { id: 'fashion', name: '流行時尚' }, { id: 'sports', name: '運動戶外' },
  { id: 'home', name: '居家生活' }, { id: 'baby', name: '母嬰用品' },
]

const NAMES: Record<CategoryId, string[]> = {
  '3c': ['真無線藍牙耳機', '降噪耳罩式耳機', '4K 行動螢幕', 'Type-C 100W 快充線', '電競滑鼠', '機械式鍵盤', '1TB 行動固態硬碟'],
  appliance: ['變頻空氣清淨機', '不鏽鋼快煮壺', '蒸氣掛燙機', '美型電暖器', '超靜音循環扇', '智慧電子鍋', '手持無線吸塵器'],
  beauty: ['保濕精華液 30ml', '防曬乳 SPF50+', '胺基酸洗面乳', '玻尿酸面膜 10 片', '霧面唇釉', '眼部修護霜', '護色洗髮精'],
  food: ['掛耳咖啡 30 入', '綜合堅果 500g', '即食雞胸肉 10 包', '黑豆茶 60 包', '燕麥餅乾禮盒', '冷凍藍莓 1kg', '蜂蜜檸檬醋'],
  fashion: ['oversize 落肩 T 恤', '高腰直筒牛仔褲', '輕量羽絨外套', '帆布托特包', '彈力休閒西裝褲', '針織開襟外套', '經典小白鞋'],
  sports: ['瑜珈墊 8mm', '可調式啞鈴 24kg', '運動緊身褲', '登山防水外套', '摺疊跑步機', '保冷水壺 1L', '羽球拍對拍組'],
  home: ['天絲四件式床包', '香氛擴香瓶', '整理收納箱 3 入', '記憶棉枕頭', '浴室置物架', '遮光窗簾', '原木餐桌墊'],
  baby: ['嬰兒紗布浴巾', '副食品調理機', '幼兒積木桌', '防脹氣奶瓶 3 入', '嬰兒推車', '寶寶爬行墊', '兒童安全座椅'],
}

const BRANDS: Record<CategoryId, string[]> = {
  '3c': ['SOUNDX', 'TechOne', 'AVIO'], appliance: ['HOMEPRO', '禾聯', 'AirMate'],
  beauty: ['LUMI', '雪肌坊', 'Dr.Pure'], food: ['山丘食研', 'Nutri+', '果然選'],
  fashion: ['UNITE', '植村衣所', 'MODA'], sports: ['FITLAB', '峰行', 'RUNUP'],
  home: ['好室集', 'NITORI 風', '木質研'], baby: ['mamaCare', '貝親選', 'KIDDO'],
}

function makeProduct(cat: CategoryId, i: number): Product {
  const id = `${cat}-${i + 1}`
  const brand = BRANDS[cat][i % 3]
  const name = NAMES[cat][i]
  const price = 290 + ((i * 97 + cat.length * 31) % 48) * 100   // 確定性價格 290–4990
  const hasPromo = i % 3 !== 0
  const image = `https://picsum.photos/seed/${id}/400/400`
  return {
    id, brand, name: `【${brand}】${name}`, category: cat,
    price, listPrice: hasPromo ? Math.round(price * 1.25) : undefined,
    image, images: [image, `https://picsum.photos/seed/${id}-b/400/400`, `https://picsum.photos/seed/${id}-c/400/400`],
    inStock: i !== 5,                                            // 每分類第 6 筆缺貨（驗證邊界 UI）
    tags: hasPromo ? (i % 2 === 0 ? ['限時下殺'] : ['免運']) : [],
    specs: [`${brand} 原廠公司貨`, '7 天鑑賞期', '保固一年', '台灣出貨'],
    variant: i % 2 === 0 ? { label: '顏色', options: ['白色', '黑色', '粉色'] } : undefined,
  }
}

export const PRODUCTS: Product[] = CATEGORIES.flatMap(c =>
  Array.from({ length: 7 }, (_, i) => makeProduct(c.id, i)),
)
```

`src/services/mock/delay.ts`：

```ts
export const delay = (ms = 200 + Math.random() * 400) => new Promise<void>(r => setTimeout(r, ms))
```

- [ ] **Step 3: 寫 service 的失敗測試**

`src/services/api.test.ts`：

```ts
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { api, NotFoundError, PAGE_SIZE } from './api'

beforeAll(() => { vi.mock('./mock/delay', () => ({ delay: () => Promise.resolve() })) })

describe('searchProducts', () => {
  it('依關鍵字過濾並分頁', async () => {
    const page = await api.searchProducts({ keyword: '耳機' })
    expect(page.total).toBeGreaterThan(0)
    expect(page.items.length).toBeLessThanOrEqual(PAGE_SIZE)
    expect(page.items.every(p => p.name.includes('耳機'))).toBe(true)
  })
  it('空關鍵字回傳全部商品', async () => {
    const page = await api.searchProducts({ keyword: '' })
    expect(page.total).toBe(56)
    expect(page.totalPages).toBe(Math.ceil(56 / PAGE_SIZE))
  })
  it('支援分類與價格區間過濾', async () => {
    const page = await api.searchProducts({ keyword: '', category: '3c', maxPrice: 2000 })
    expect(page.items.every(p => p.category === '3c' && p.price <= 2000)).toBe(true)
  })
  it('priceAsc 排序正確', async () => {
    const { items } = await api.searchProducts({ keyword: '', sort: 'priceAsc' })
    const prices = items.map(p => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })
  it('超出範圍的頁碼回空陣列但 total 不變', async () => {
    const page = await api.searchProducts({ keyword: '', page: 999 })
    expect(page.items).toEqual([])
    expect(page.total).toBe(56)
  })
})

describe('getProduct', () => {
  it('回傳完整商品', async () => {
    const p = await api.getProduct('3c-1')
    expect(p.images.length).toBeGreaterThan(1)
  })
  it('不存在的 id 丟 NotFoundError', async () => {
    await expect(api.getProduct('nope')).rejects.toBeInstanceOf(NotFoundError)
  })
})
```

- [ ] **Step 4: 跑測試確認失敗**

Run: `npx vitest run src/services/api.test.ts`
Expected: FAIL（`./api` 不存在）

- [ ] **Step 5: 實作 service layer**

`src/services/api.ts`：

```ts
import type { HomeSection, Page, Product, ProductSummary, SearchParams, Category } from '../features/products/types'
import { CATEGORIES, PRODUCTS } from './mock/data'
import { delay } from './mock/delay'

export const PAGE_SIZE = 20

export class NotFoundError extends Error {
  constructor(id: string) { super(`product ${id} not found`) }
}

const toSummary = ({ images: _i, specs: _s, variant: _v, ...summary }: Product): ProductSummary => summary

function matches(p: Product, { keyword, category, minPrice, maxPrice }: SearchParams): boolean {
  const kw = keyword.trim()
  const catName = CATEGORIES.find(c => c.id === p.category)?.name ?? ''
  if (kw && !(p.name.includes(kw) || p.brand.includes(kw) || catName.includes(kw))) return false
  if (category && p.category !== category) return false
  if (minPrice != null && p.price < minPrice) return false
  if (maxPrice != null && p.price > maxPrice) return false
  return true
}

export const api = {
  async searchProducts(params: SearchParams): Promise<Page<ProductSummary>> {
    await delay()
    let hits = PRODUCTS.filter(p => matches(p, params))
    if (params.sort === 'priceAsc') hits = [...hits].sort((a, b) => a.price - b.price)
    if (params.sort === 'priceDesc') hits = [...hits].sort((a, b) => b.price - a.price)
    const page = params.page ?? 1
    const start = (page - 1) * PAGE_SIZE
    return {
      items: hits.slice(start, start + PAGE_SIZE).map(toSummary),
      total: hits.length, page, pageSize: PAGE_SIZE,
      totalPages: Math.ceil(hits.length / PAGE_SIZE),
    }
  },

  async getProduct(id: string): Promise<Product> {
    await delay()
    const p = PRODUCTS.find(p => p.id === id)
    if (!p) throw new NotFoundError(id)
    return p
  },

  async getCategories(): Promise<Category[]> {
    await delay(100)
    return CATEGORIES
  },

  async getHomeSections(): Promise<HomeSection[]> {
    await delay()
    return [
      { id: 'hot', title: '限時下殺', products: PRODUCTS.filter(p => p.tags.includes('限時下殺')).slice(0, 10).map(toSummary) },
      { id: '3c', title: '3C 達人', products: PRODUCTS.filter(p => p.category === '3c').map(toSummary) },
      { id: 'beauty', title: '美妝保養', products: PRODUCTS.filter(p => p.category === 'beauty').map(toSummary) },
    ]
  },
}
```

- [ ] **Step 6: 跑測試確認通過＋commit**

Run: `npx tsc -b && npx vitest run`
Expected: PASS（7 tests）

```bash
git add src/features/products/types.ts src/services/
git commit -m "feat(services): mock data layer with simulated latency, server-side filter/sort/pagination semantics

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 購物車 Store（reducer＋localStorage）

**Files:**
- Create: `src/features/cart/store/cartReducer.ts`、`src/features/cart/store/CartContext.tsx`、`src/features/cart/hooks/useCart.ts`、`src/shared/utils/formatPrice.ts`
- Test: `src/features/cart/store/cartReducer.test.ts`

**Interfaces:**
- Consumes: `ProductSummary`（Task 1）
- Produces:
  - `CartItem { productId: string; name: string; price: number; image: string; variant?: string; qty: number }`
  - `cartReducer(state: CartItem[], action: CartAction): CartItem[]`；`CartAction = {type:'add'; item: Omit<CartItem,'qty'>; qty?: number} | {type:'remove'; productId: string; variant?: string} | {type:'setQty'; productId: string; variant?: string; qty: number} | {type:'clear'}`
  - `cartTotal(items): number`、`cartCount(items): number`
  - `useCart(): { items: CartItem[]; add: (item: Omit<CartItem,'qty'>, qty?: number) => void; remove: (productId: string, variant?: string) => void; setQty: (productId: string, qty: number, variant?: string) => void; clear: () => void; total: number; count: number }`
  - `<CartProvider>`（localStorage key `momo-mock.cart.v1`）
  - `formatPrice(n: number): string`（`5190` → `"5,190"`）

- [ ] **Step 1: 寫 reducer 失敗測試**

`src/features/cart/store/cartReducer.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { cartReducer, cartTotal, cartCount, type CartItem } from './cartReducer'

const base = { productId: '3c-1', name: '耳機', price: 1000, image: 'x.jpg' }

describe('cartReducer', () => {
  it('add 新商品 → qty 1', () => {
    const s = cartReducer([], { type: 'add', item: base })
    expect(s).toEqual([{ ...base, qty: 1 }])
  })
  it('add 既有商品（同 variant）→ 合併數量', () => {
    const s0: CartItem[] = [{ ...base, variant: '白色', qty: 1 }]
    const s = cartReducer(s0, { type: 'add', item: { ...base, variant: '白色' }, qty: 2 })
    expect(s).toEqual([{ ...base, variant: '白色', qty: 3 }])
  })
  it('同商品不同 variant 視為不同列', () => {
    const s0: CartItem[] = [{ ...base, variant: '白色', qty: 1 }]
    const s = cartReducer(s0, { type: 'add', item: { ...base, variant: '黑色' } })
    expect(s).toHaveLength(2)
  })
  it('setQty 下限為 1', () => {
    const s0: CartItem[] = [{ ...base, qty: 2 }]
    const s = cartReducer(s0, { type: 'setQty', productId: '3c-1', qty: 0 })
    expect(s[0].qty).toBe(1)
  })
  it('remove 與 clear', () => {
    const s0: CartItem[] = [{ ...base, qty: 2 }]
    expect(cartReducer(s0, { type: 'remove', productId: '3c-1' })).toEqual([])
    expect(cartReducer(s0, { type: 'clear' })).toEqual([])
  })
  it('total 與 count', () => {
    const s: CartItem[] = [{ ...base, qty: 2 }, { ...base, productId: 'b', price: 500, qty: 1 }]
    expect(cartTotal(s)).toBe(2500)
    expect(cartCount(s)).toBe(3)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/features/cart`
Expected: FAIL（`./cartReducer` 不存在）

- [ ] **Step 3: 實作 reducer 與工具函式**

`src/features/cart/store/cartReducer.ts`：

```ts
export interface CartItem {
  productId: string; name: string; price: number; image: string; variant?: string; qty: number
}

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'remove'; productId: string; variant?: string }
  | { type: 'setQty'; productId: string; variant?: string; qty: number }
  | { type: 'clear' }

const sameLine = (i: CartItem, productId: string, variant?: string) =>
  i.productId === productId && i.variant === variant

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const qty = action.qty ?? 1
      const hit = state.find(i => sameLine(i, action.item.productId, action.item.variant))
      return hit
        ? state.map(i => (i === hit ? { ...i, qty: i.qty + qty } : i))
        : [...state, { ...action.item, qty }]
    }
    case 'setQty':
      return state.map(i =>
        sameLine(i, action.productId, action.variant) ? { ...i, qty: Math.max(1, action.qty) } : i)
    case 'remove':
      return state.filter(i => !sameLine(i, action.productId, action.variant))
    case 'clear':
      return []
  }
}

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
```

`src/shared/utils/formatPrice.ts`：

```ts
export const formatPrice = (n: number) => n.toLocaleString('zh-TW')
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/features/cart`
Expected: PASS（6 tests）

- [ ] **Step 5: Provider 與 hook（localStorage 同步）**

`src/features/cart/store/CartContext.tsx`：

```tsx
import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { cartCount, cartReducer, cartTotal, type CartAction, type CartItem } from './cartReducer'

const STORAGE_KEY = 'momo-mock.cart.v1'

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export interface CartValue {
  items: CartItem[]; total: number; count: number
  dispatch: React.Dispatch<CartAction>
}

export const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, load)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }, [items])
  const value = useMemo(
    () => ({ items, dispatch, total: cartTotal(items), count: cartCount(items) }), [items])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
```

`src/features/cart/hooks/useCart.ts`：

```ts
import { useContext } from 'react'
import { CartContext } from '../store/CartContext'
import type { CartItem } from '../store/cartReducer'

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  const { items, total, count, dispatch } = ctx
  return {
    items, total, count,
    add: (item: Omit<CartItem, 'qty'>, qty?: number) => dispatch({ type: 'add', item, qty }),
    remove: (productId: string, variant?: string) => dispatch({ type: 'remove', productId, variant }),
    setQty: (productId: string, qty: number, variant?: string) => dispatch({ type: 'setQty', productId, qty, variant }),
    clear: () => dispatch({ type: 'clear' }),
  }
}
```

- [ ] **Step 6: 驗證＋commit**

Run: `npx tsc -b && npx vitest run`
Expected: 全數 PASS

```bash
git add src/features/cart src/shared/utils
git commit -m "feat(cart): cart store with pure reducer, localStorage persistence and unit tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: shared/ui、RootLayout、Router 與首頁

**Files:**
- Create: `src/shared/ui/Button.tsx`、`Badge.tsx`、`PriceTag.tsx`、`Skeleton.tsx`、`QuantityStepper.tsx`
- Create: `src/app/RootLayout.tsx`、`src/app/router.tsx`、`src/features/cart/components/MiniCart.tsx`
- Create: `src/features/products/components/ProductCard.tsx`、`src/features/products/hooks/useHomeSections.ts`、`src/pages/HomePage.tsx`、`src/pages/NotFoundPage.tsx`
- Modify: `src/main.tsx`（RouterProvider＋QueryClientProvider＋CartProvider）；刪除 `src/App.tsx`

**Interfaces:**
- Consumes: `api.getHomeSections`、`useCart`、`formatPrice`
- Produces:
  - `<Button variant?: 'primary' | 'outline'>`（原生 button props 透傳）
  - `<Badge>`（桃紅底白字小標）、`<PriceTag price listPrice? size?: 'md' | 'lg'>`、`<Skeleton className?>`、
    `<QuantityStepper value onChange(min 1)>`
  - `<ProductCard product: ProductSummary>`（整卡連到 `/goods/:id`，含圖、tags Badge、名稱兩行截斷、PriceTag）
  - 路由：`/`、`/search/:keyword`、`/goods/:goodsId`、`/cart`、`*`，皆 lazy＋`errorElement`

- [ ] **Step 1: shared/ui 五元件**

`src/shared/ui/Button.tsx`：

```tsx
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const style = variant === 'primary'
    ? 'bg-momo text-white hover:opacity-90'
    : 'border border-momo text-momo hover:bg-momo/5'
  return <button className={`rounded px-4 py-2 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${style} ${className}`} {...rest} />
}
```

`src/shared/ui/Badge.tsx`：

```tsx
import type { ReactNode } from 'react'
export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-sm bg-momo px-1.5 py-0.5 text-xs text-white">{children}</span>
}
```

`src/shared/ui/PriceTag.tsx`：

```tsx
import { formatPrice } from '../utils/formatPrice'

export function PriceTag({ price, listPrice, size = 'md' }: { price: number; listPrice?: number; size?: 'md' | 'lg' }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`font-bold text-price ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>
        ${formatPrice(price)}
      </span>
      {listPrice && <del className="text-sm text-gray-400">${formatPrice(listPrice)}</del>}
    </span>
  )
}
```

`src/shared/ui/Skeleton.tsx`：

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
}
```

`src/shared/ui/QuantityStepper.tsx`：

```tsx
import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex items-center rounded border">
      <button aria-label="減少數量" disabled={value <= 1} onClick={() => onChange(value - 1)}
        className="p-1.5 disabled:opacity-30"><Minus size={14} /></button>
      <span className="w-10 text-center text-sm">{value}</span>
      <button aria-label="增加數量" onClick={() => onChange(value + 1)}
        className="p-1.5"><Plus size={14} /></button>
    </span>
  )
}
```

- [ ] **Step 2: ProductCard 與 MiniCart**

`src/features/products/components/ProductCard.tsx`：

```tsx
import { Link } from 'react-router'
import type { ProductSummary } from '../types'
import { Badge } from '../../../shared/ui/Badge'
import { PriceTag } from '../../../shared/ui/PriceTag'

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link to={`/goods/${product.id}`}
      className="group flex flex-col gap-2 rounded-lg border border-gray-100 bg-white p-3 transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded bg-gray-50">
        <img src={product.image} alt={product.name} loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105" />
        {!product.inStock && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 font-bold text-gray-500">補貨中</span>
        )}
      </div>
      <div className="flex gap-1">{product.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
      <p className="line-clamp-2 min-h-10 text-sm">{product.name}</p>
      <PriceTag price={product.price} listPrice={product.listPrice} />
    </Link>
  )
}
```

`src/features/cart/components/MiniCart.tsx`（桌面右側 sticky 欄，`hidden xl:flex`）：

```tsx
import { Link } from 'react-router'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../../../shared/utils/formatPrice'

export function MiniCart() {
  const { count, total } = useCart()
  return (
    <aside className="fixed right-0 top-32 z-10 hidden w-24 flex-col items-center gap-2 rounded-l-lg bg-momo p-3 text-white shadow-lg xl:flex">
      <ShoppingCart size={20} />
      <p className="text-sm">購物車 ({count})</p>
      <p className="text-xs">${formatPrice(total)}</p>
      <Link to="/cart" className="w-full rounded bg-white py-1 text-center text-sm font-bold text-momo">結帳</Link>
    </aside>
  )
}
```

- [ ] **Step 3: RootLayout（Header 搜尋框＋badge、Footer、MiniCart、Outlet）**

`src/app/RootLayout.tsx`：

```tsx
import { Link, Outlet, useNavigate } from 'react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useCart } from '../features/cart/hooks/useCart'
import { MiniCart } from '../features/cart/components/MiniCart'

export default function RootLayout() {
  const { count } = useCart()
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (kw.trim()) navigate(`/search/${encodeURIComponent(kw.trim())}`)
  }
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="hidden bg-gray-100 text-xs text-gray-500 sm:block">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-1">
          <span>回首頁｜APP下載｜書店</span><span>登入｜註冊｜會員中心｜查訂單</span>
        </div>
      </div>
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="shrink-0 text-3xl font-black italic text-momo">momo</Link>
          <form onSubmit={submit} className="flex max-w-xl flex-1 overflow-hidden rounded-full border-2 border-momo">
            <input value={kw} onChange={e => setKw(e.target.value)} placeholder="請輸入關鍵字"
              className="min-w-0 flex-1 px-4 py-1.5 outline-none" />
            <button aria-label="搜尋" className="bg-momo px-5 text-white"><Search size={18} /></button>
          </form>
          <Link to="/cart" aria-label="購物車" className="relative shrink-0 text-gray-600">
            <ShoppingCart />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-momo px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <MiniCart />
      <footer className="mt-12 border-t bg-white py-6 text-center text-xs text-gray-400">
        momo mock — Frontend take-home（純前端練習，非商業用途）
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Router 與 main.tsx**

`src/app/router.tsx`：

```tsx
import { createBrowserRouter } from 'react-router'
import { lazy } from 'react'
import RootLayout from './RootLayout'

const HomePage = lazy(() => import('../pages/HomePage'))
const SearchPage = lazy(() => import('../pages/SearchPage'))
const GoodsPage = lazy(() => import('../pages/GoodsPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export const router = createBrowserRouter([
  {
    path: '/', element: <RootLayout />,
    errorElement: <div className="p-12 text-center">頁面發生錯誤，請重新整理。</div>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search/:keyword', element: <SearchPage /> },
      { path: 'goods/:goodsId', element: <GoodsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
```

（Task 3 先建 `SearchPage`、`GoodsPage`、`CartPage` 的最小占位：`export default function SearchPage() { return <p>搜尋頁施工中</p> }`，Task 4–6 逐一替換——讓每個 Task 結束時整個 app 都可執行。）

`src/main.tsx` 全檔替換：

```tsx
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from './features/cart/store/CartContext'
import { router } from './app/router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Suspense fallback={<div className="p-12 text-center text-gray-400">載入中…</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </CartProvider>
    </QueryClientProvider>
  </StrictMode>,
)
```

刪除 `src/App.tsx`。`index.html` 的 `<title>` 改為 `momo mock`、`lang` 改 `zh-Hant`。

- [ ] **Step 5: 首頁**

`src/features/products/hooks/useHomeSections.ts`：

```ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'

export const useHomeSections = () =>
  useQuery({ queryKey: ['home'], queryFn: api.getHomeSections })
```

`src/pages/HomePage.tsx`：

```tsx
import { Link } from 'react-router'
import { useHomeSections } from '../features/products/hooks/useHomeSections'
import { ProductCard } from '../features/products/components/ProductCard'
import { Skeleton } from '../shared/ui/Skeleton'

const QUICK_CATES = [
  { kw: '3C', label: '3C 達人' }, { kw: '家電', label: '家電館' },
  { kw: '美妝', label: '美妝保養' }, { kw: '食品', label: '美食搶購' },
  { kw: '時尚', label: '流行時尚' }, { kw: '運動', label: '運動戶外' },
]

export default function HomePage() {
  const { data, isPending } = useHomeSections()
  return (
    <div className="flex flex-col gap-8">
      <div className="grid h-40 place-items-center rounded-xl bg-gradient-to-r from-momo to-pink-400 text-2xl font-black text-white sm:h-56 sm:text-4xl">
        全站超取 $290 免運
      </div>
      <nav className="flex flex-wrap gap-3">
        {QUICK_CATES.map(c => (
          <Link key={c.kw} to={`/search/${c.kw}`}
            className="rounded-full border border-momo px-4 py-1.5 text-sm text-momo hover:bg-momo hover:text-white">
            {c.label}
          </Link>
        ))}
      </nav>
      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      )}
      {data?.map(section => (
        <section key={section.id}>
          <h2 className="mb-3 border-l-4 border-momo pl-2 text-xl font-bold">{section.title}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {section.products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
```

`src/pages/NotFoundPage.tsx`：

```tsx
import { Link } from 'react-router'
export default function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black text-momo">404</p>
      <p className="mt-2 text-gray-500">找不到這個頁面</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁</Link>
    </div>
  )
}
```

- [ ] **Step 6: 驗證（含 Agent 視覺對照）＋commit**

Run: `npx tsc -b && npx vitest run`，dev server 開 `/`
Agent 檢查項：桃紅 Header＋搜尋框、首頁三個商品區塊、卡片 hover、RWD（縮窗至 400px 商品格降 2 欄、MiniCart 隱藏）；與 `docs/momo-ref/momo-home.jpeg` 對照版面骨架。結果一行記入 `docs/worklog.md`。

```bash
git add src/ index.html docs/worklog.md
git commit -m "feat(products): home page with root layout, shared ui kit and mini cart rail

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 搜尋結果頁（URL 為狀態單一來源）

**Files:**
- Create: `src/features/products/hooks/useSearch.ts`、`src/features/products/components/FilterPanel.tsx`、`SortToolbar.tsx`、`ProductGrid.tsx`、`Pagination.tsx`
- Modify: `src/pages/SearchPage.tsx`（替換占位）

**Interfaces:**
- Consumes: `api.searchProducts`、`api.getCategories`、`SearchParams`、`SortKey`、`ProductCard`
- Produces: `useSearch(): { params: SearchParams; page: Page<ProductSummary> | undefined; isPending: boolean; setParam: (patch: Partial<Omit<SearchParams,'keyword'>>) => void }`
  - `setParam` 寫回 query string（`cate`/`min`/`max`/`sort`/`page`）；改篩選或排序時自動把 `page` 重設為 1

- [ ] **Step 1: useSearch hook**

`src/features/products/hooks/useSearch.ts`：

```ts
import { useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { CategoryId, SearchParams, SortKey } from '../types'

export function useSearch() {
  const { keyword = '' } = useParams()
  const [sp, setSp] = useSearchParams()

  const params: SearchParams = {
    keyword: decodeURIComponent(keyword),
    category: (sp.get('cate') as CategoryId) ?? undefined,
    minPrice: sp.get('min') ? Number(sp.get('min')) : undefined,
    maxPrice: sp.get('max') ? Number(sp.get('max')) : undefined,
    sort: (sp.get('sort') as SortKey) ?? 'relevance',
    page: sp.get('page') ? Number(sp.get('page')) : 1,
  }

  const { data: page, isPending } = useQuery({
    queryKey: ['search', params],
    queryFn: () => api.searchProducts(params),
  })

  const setParam = (patch: Partial<Omit<SearchParams, 'keyword'>>) => {
    const next = new URLSearchParams(sp)
    if ('category' in patch) { patch.category ? next.set('cate', patch.category) : next.delete('cate') }
    if ('minPrice' in patch) { patch.minPrice != null ? next.set('min', String(patch.minPrice)) : next.delete('min') }
    if ('maxPrice' in patch) { patch.maxPrice != null ? next.set('max', String(patch.maxPrice)) : next.delete('max') }
    if ('sort' in patch) { patch.sort && patch.sort !== 'relevance' ? next.set('sort', patch.sort) : next.delete('sort') }
    if ('page' in patch && patch.page && patch.page > 1) next.set('page', String(patch.page))
    else next.delete('page')   // 任何篩選/排序變更 → 回第 1 頁
    setSp(next)
  }

  return { params, page, isPending, setParam }
}
```

- [ ] **Step 2: FilterPanel / SortToolbar / ProductGrid / Pagination**

`src/features/products/components/FilterPanel.tsx`：

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { SearchParams } from '../types'
import { Button } from '../../../shared/ui/Button'

export function FilterPanel({ params, onChange }: {
  params: SearchParams
  onChange: (patch: Partial<SearchParams>) => void
}) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  const [min, setMin] = useState(params.minPrice?.toString() ?? '')
  const [max, setMax] = useState(params.maxPrice?.toString() ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-white p-3">
      <button className="w-full text-left font-bold text-momo sm:hidden" onClick={() => setOpen(o => !o)}>
        篩選 {open ? '▲' : '▼'}
      </button>
      <div className={`${open ? 'flex' : 'hidden'} flex-col gap-3 sm:flex`}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-gray-500">分類</span>
          <button onClick={() => onChange({ category: undefined })}
            className={!params.category ? 'font-bold text-momo' : ''}>全部</button>
          {categories?.map(c => (
            <button key={c.id} onClick={() => onChange({ category: c.id })}
              className={params.category === c.id ? 'font-bold text-momo' : ''}>{c.name}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-gray-500">價格</span>
          <input value={min} onChange={e => setMin(e.target.value)} placeholder="最低" inputMode="numeric"
            className="w-20 rounded border px-2 py-1" />
          <span>–</span>
          <input value={max} onChange={e => setMax(e.target.value)} placeholder="最高" inputMode="numeric"
            className="w-20 rounded border px-2 py-1" />
          <Button variant="outline" className="!px-3 !py-1 text-sm"
            onClick={() => onChange({ minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined })}>
            確認
          </Button>
        </div>
      </div>
    </div>
  )
}
```

`src/features/products/components/SortToolbar.tsx`：

```tsx
import type { SortKey } from '../types'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: '綜合推薦' },
  { key: 'priceAsc', label: '價格由低到高' },
  { key: 'priceDesc', label: '價格由高到低' },
]

export function SortToolbar({ sort, total, onChange }: {
  sort: SortKey; total: number; onChange: (s: SortKey) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-white p-2 text-sm">
      {SORTS.map(s => (
        <button key={s.key} onClick={() => onChange(s.key)}
          className={`rounded px-3 py-1 ${sort === s.key ? 'bg-momo text-white' : 'hover:bg-gray-100'}`}>
          {s.label}
        </button>
      ))}
      <span className="ml-auto text-gray-400">共 {total} 件商品</span>
    </div>
  )
}
```

`src/features/products/components/ProductGrid.tsx`：

```tsx
import type { ProductSummary } from '../types'
import { ProductCard } from './ProductCard'
import { Skeleton } from '../../../shared/ui/Skeleton'

export function ProductGrid({ items, isPending }: { items: ProductSummary[] | undefined; isPending: boolean }) {
  if (isPending) return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
    </div>
  )
  if (!items?.length) return <p className="py-16 text-center text-gray-400">沒有符合條件的商品，試試其他關鍵字。</p>
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
```

`src/features/products/components/Pagination.tsx`：

```tsx
export function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">上一頁</button>
      <span>頁數 {page}/{totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">下一頁</button>
    </div>
  )
}
```

- [ ] **Step 3: SearchPage 組裝**

`src/pages/SearchPage.tsx` 全檔替換：

```tsx
import { useSearch } from '../features/products/hooks/useSearch'
import { FilterPanel } from '../features/products/components/FilterPanel'
import { SortToolbar } from '../features/products/components/SortToolbar'
import { ProductGrid } from '../features/products/components/ProductGrid'
import { Pagination } from '../features/products/components/Pagination'

export default function SearchPage() {
  const { params, page, isPending, setParam } = useSearch()
  return (
    <div className="flex flex-col gap-4">
      <nav className="text-sm text-gray-400">首頁 \ 搜尋結果：<b className="text-gray-700">{params.keyword}</b></nav>
      <FilterPanel key={params.keyword} params={params} onChange={setParam} />
      <SortToolbar sort={params.sort ?? 'relevance'} total={page?.total ?? 0} onChange={s => setParam({ sort: s })} />
      <ProductGrid items={page?.items} isPending={isPending} />
      <Pagination page={params.page ?? 1} totalPages={page?.totalPages ?? 0} onChange={p => setParam({ page: p })} />
    </div>
  )
}
```

- [ ] **Step 4: 驗證（含 Agent 視覺與 URL 行為對照）＋commit**

Run: `npx tsc -b && npx vitest run`
Agent 檢查項：Header 搜尋導向 `/search/耳機`；點分類/排序 → URL query 更新且回第 1 頁；直接貼 `/search/耳機?sort=priceAsc&page=2` 重整後狀態還原；空結果文案；與 `momo-search.jpeg` 對照骨架；400px 寬篩選面板收合。記入 worklog。

```bash
git add src/features/products src/pages/SearchPage.tsx docs/worklog.md
git commit -m "feat(products): search page with URL-as-single-source filter/sort/pagination

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 商品詳情頁

**Files:**
- Create: `src/features/products/hooks/useGoodsDetail.ts`、`src/features/products/components/Gallery.tsx`
- Modify: `src/pages/GoodsPage.tsx`（替換占位）

**Interfaces:**
- Consumes: `api.getProduct`、`NotFoundError`、`useCart().add`、`QuantityStepper`、`PriceTag`、`Button`
- Produces: 無（葉子頁面）

- [ ] **Step 1: hook 與 Gallery**

`src/features/products/hooks/useGoodsDetail.ts`：

```ts
import { useQuery } from '@tanstack/react-query'
import { api, NotFoundError } from '../../../services/api'

export function useGoodsDetail(id: string) {
  return useQuery({
    queryKey: ['goods', id],
    queryFn: () => api.getProduct(id),
    retry: (count, err) => !(err instanceof NotFoundError) && count < 1,
  })
}
```

`src/features/products/components/Gallery.tsx`：

```tsx
import { useState } from 'react'

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <img src={images[active]} alt={alt} className="aspect-square w-full rounded-lg object-cover" />
      <div className="flex gap-2">
        {images.map((src, i) => (
          <button key={src} onClick={() => setActive(i)}
            className={`h-16 w-16 overflow-hidden rounded border-2 ${i === active ? 'border-momo' : 'border-transparent'}`}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: GoodsPage 組裝（含 not-found 與缺貨狀態）**

`src/pages/GoodsPage.tsx` 全檔替換：

```tsx
import { Link, useParams } from 'react-router'
import { useState } from 'react'
import { useGoodsDetail } from '../features/products/hooks/useGoodsDetail'
import { Gallery } from '../features/products/components/Gallery'
import { useCart } from '../features/cart/hooks/useCart'
import { NotFoundError } from '../services/api'
import { Badge } from '../shared/ui/Badge'
import { Button } from '../shared/ui/Button'
import { PriceTag } from '../shared/ui/PriceTag'
import { Skeleton } from '../shared/ui/Skeleton'
import { QuantityStepper } from '../shared/ui/QuantityStepper'

export default function GoodsPage() {
  const { goodsId = '' } = useParams()
  const { data: p, isPending, error } = useGoodsDetail(goodsId)
  const { add } = useCart()
  const [variant, setVariant] = useState<string>()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (error instanceof NotFoundError) return (
    <div className="py-24 text-center">
      <p className="text-xl font-bold">很抱歉！此商品目前無展售</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁逛逛</Link>
    </div>
  )
  if (isPending || !p) return (
    <div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square" /><Skeleton className="h-80" /></div>
  )

  const chosenVariant = variant ?? p.variant?.options[0]
  const handleAdd = () => {
    add({ productId: p.id, name: p.name, price: p.price, image: p.image, variant: chosenVariant }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="text-sm text-gray-400">首頁 \ {p.brand} \ <span className="text-gray-700">{p.name}</span></nav>
      <div className="grid gap-8 rounded-lg bg-white p-4 md:grid-cols-2 md:p-6">
        <Gallery images={p.images} alt={p.name} />
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{p.name}</h1>
          <div className="flex gap-1">{p.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
          <ul className="list-inside list-disc text-sm text-gray-600">
            {p.specs.map(s => <li key={s}>{s}</li>)}
          </ul>
          <div className="border-y py-4"><PriceTag size="lg" price={p.price} listPrice={p.listPrice} /></div>
          {p.variant && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{p.variant.label}</span>
              {p.variant.options.map(o => (
                <button key={o} onClick={() => setVariant(o)}
                  className={`rounded border px-3 py-1 ${chosenVariant === o ? 'border-momo text-momo' : ''}`}>{o}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">數量</span>
            <QuantityStepper value={qty} onChange={setQty} />
          </div>
          <Button onClick={handleAdd} disabled={!p.inStock} className="mt-auto">
            {!p.inStock ? '補貨中' : added ? '✓ 已加入' : '加入購物車'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 驗證＋commit**

Run: `npx tsc -b && npx vitest run`
Agent 檢查項：`/goods/3c-1` 完整呈現（gallery 切換、規格選擇、加入後 badge +1 且按鈕短暫顯示「已加入」）；`/goods/3c-6`（缺貨）按鈕 disabled；`/goods/nope` 顯示無展售文案（對照真站同款錯誤頁行為）；與 `momo-goods.jpeg` 對照雙欄骨架；窄螢幕上下堆疊。記入 worklog。

```bash
git add src/features/products src/pages/GoodsPage.tsx docs/worklog.md
git commit -m "feat(products): goods detail page with gallery, variant picker and not-found state

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 購物車頁與互動測試

**Files:**
- Create: `src/features/cart/components/CartItemRow.tsx`
- Modify: `src/pages/CartPage.tsx`（替換占位）
- Test: `src/features/cart/cart.integration.test.tsx`

**Interfaces:**
- Consumes: `useCart`、`QuantityStepper`、`PriceTag`、`formatPrice`、`Button`

- [ ] **Step 1: 寫互動失敗測試（加入購物車 → badge +1；數量下限）**

`src/features/cart/cart.integration.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider } from './store/CartContext'
import { useCart } from './hooks/useCart'
import { QuantityStepper } from '../../shared/ui/QuantityStepper'
import { useState } from 'react'

function Harness() {
  const { add, count } = useCart()
  return (
    <>
      <span data-testid="badge">{count}</span>
      <button onClick={() => add({ productId: 'x', name: 'n', price: 100, image: 'i' })}>加入購物車</button>
    </>
  )
}

describe('cart 互動', () => {
  it('點加入購物車 → badge 數量 +1', async () => {
    localStorage.clear()
    render(<CartProvider><Harness /></CartProvider>)
    expect(screen.getByTestId('badge')).toHaveTextContent('0')
    await userEvent.click(screen.getByText('加入購物車'))
    expect(screen.getByTestId('badge')).toHaveTextContent('1')
  })
})

function StepperHarness() {
  const [v, setV] = useState(1)
  return <QuantityStepper value={v} onChange={setV} />
}

describe('QuantityStepper', () => {
  it('數量為 1 時減號 disabled', () => {
    render(<StepperHarness />)
    expect(screen.getByLabelText('減少數量')).toBeDisabled()
  })
})
```

- [ ] **Step 2: 跑測試確認目前狀態**

Run: `npx vitest run src/features/cart`
Expected: 兩個新測試 PASS（元件已存在——此測試鎖住行為防回歸；若 FAIL 則修實作）

- [ ] **Step 3: CartItemRow 與 CartPage**

`src/features/cart/components/CartItemRow.tsx`：

```tsx
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { CartItem } from '../store/cartReducer'
import { QuantityStepper } from '../../../shared/ui/QuantityStepper'
import { formatPrice } from '../../../shared/utils/formatPrice'

export function CartItemRow({ item, onQty, onRemove }: {
  item: CartItem; onQty: (qty: number) => void; onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 border-b py-3">
      <img src={item.image} alt="" className="h-16 w-16 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <Link to={`/goods/${item.productId}`} className="line-clamp-1 text-sm hover:text-momo">{item.name}</Link>
        {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
        <p className="text-sm font-bold text-price">${formatPrice(item.price)}</p>
      </div>
      <QuantityStepper value={item.qty} onChange={onQty} />
      <button aria-label="移除商品" onClick={onRemove} className="p-2 text-gray-400 hover:text-price">
        <Trash2 size={16} />
      </button>
    </div>
  )
}
```

`src/pages/CartPage.tsx` 全檔替換：

```tsx
import { Link } from 'react-router'
import { useCart } from '../features/cart/hooks/useCart'
import { CartItemRow } from '../features/cart/components/CartItemRow'
import { formatPrice } from '../shared/utils/formatPrice'
import { Button } from '../shared/ui/Button'

export default function CartPage() {
  const { items, total, setQty, remove, clear } = useCart()
  if (!items.length) return (
    <div className="py-24 text-center">
      <p className="text-gray-500">購物車是空的</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">去逛逛</Link>
    </div>
  )
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-lg bg-white p-4">
        <div className="mb-2 flex justify-between">
          <h1 className="text-lg font-bold">購物車（{items.length} 項）</h1>
          <button onClick={clear} className="text-sm text-gray-400 hover:text-price">清空</button>
        </div>
        {items.map(i => (
          <CartItemRow key={`${i.productId}-${i.variant ?? ''}`} item={i}
            onQty={q => setQty(i.productId, q, i.variant)}
            onRemove={() => remove(i.productId, i.variant)} />
        ))}
      </div>
      <aside className="rounded-lg bg-white p-4 lg:sticky lg:top-24">
        <div className="flex justify-between border-b pb-3 text-sm">
          <span>商品總計</span><b className="text-price">${formatPrice(total)}</b>
        </div>
        <Button className="mt-4 w-full" onClick={() => alert('mock：結帳流程刻意不在本次範圍（見 README tradeoff）')}>
          前往結帳
        </Button>
      </aside>
    </div>
  )
}
```

- [ ] **Step 4: 驗證＋commit**

Run: `npx tsc -b && npx vitest run`
Agent 檢查項：加入多商品→ `/cart` 列表正確、調數量總額即時變、移除/清空、重新整理購物車仍在（localStorage）、空車文案、MiniCart 數字同步；窄螢幕單欄。記入 worklog。

```bash
git add src/features/cart src/pages/CartPage.tsx docs/worklog.md
git commit -m "feat(cart): cart page with quantity editing, removal and persistent state; interaction tests

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: README、worklog 收尾與 GitHub 發佈

**Files:**
- Create: `README.md`
- Modify: `docs/worklog.md`（補完各階段紀錄與總結）

- [ ] **Step 1: 寫 README**

`README.md` 章節結構（內容依實作結果具體撰寫，每節 3–10 行）：

```markdown
# momo mock — Frontend Take-home（題目 A）

純前端模擬 momo 購物網。Vite・React 19・TS・React Router v7・TanStack Query・Tailwind v4。

## 快速開始
npm install && npm run dev    # http://localhost:5173
npm test                      # Vitest 單元＋互動測試

## 架構總覽
（feature-based 結構圖＋三層狀態歸屬表，自 docs/design.md §4 精簡）

## 關鍵 Tradeoff（表格，自 design.md §9 複製並依實際結果校正）

## 驗證策略
（三層測試＋Agent 視覺對照流程，連到 docs/worklog.md 的對照紀錄）

## AI/Agent 協作
（Phase 1 設計對談、Phase 2 每階段 Agent 實作與視覺驗證；commit 皆含 Co-Authored-By）

## 刻意不做與演進方向
（自 design.md §2、§11，依實際完成度更新）

## 文件
- docs/design.md — Phase 1 設計與決策全文
- docs/plan.md — 實作計畫
- docs/worklog.md — 各階段紀錄與驗證結果
```

- [ ] **Step 2: 補完 worklog 總結（實際時間軸、棄守了什麼、差異分析）**

`docs/worklog.md` 結尾加「總結」節：first commit 至 last commit 實際耗時、與真站的主要差異清單（對照三張截圖逐條列）、若有棄守項目記錄原因。

- [ ] **Step 3: 最後驗證＋commit**

Run: `npx tsc -b && npx vitest run && npm run build`
Expected: 全綠、build 成功

```bash
git add README.md docs/worklog.md
git commit -m "docs: README with architecture overview, tradeoffs and agent collaboration notes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 4: 建立 GitHub repo 並推送**

```bash
gh auth status || gh auth login   # 未登入時由使用者以 `! gh auth login` 互動完成
gh repo create momo-mock --public --source . --push
```

Expected: repo 建立成功、`main` 推上；回報 repo URL 給使用者。
