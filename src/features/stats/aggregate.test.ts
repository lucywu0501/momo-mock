import { describe, expect, it } from 'vitest'
import type { RecordedEvent } from '../../services/analytics'
import { EVENT_LABELS, countByType, countOf, recentErrors, topAddedProducts, topSearches, zeroResultSearches } from './aggregate'

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
    expect(m).toMatchObject({ 頁面瀏覽: 1, 搜尋: 5, 瀏覽商品: 1, 加入購物車: 3, 移出購物車: 1, 點擊結帳: 1, 前端錯誤: 2 })
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

describe('countOf', () => {
  it('依事件型別計數，無資料為 0', () => {
    expect(countOf(events, 'add_to_cart')).toBe(3)
    expect(countOf(events, 'search')).toBe(5)
    expect(countOf([], 'error')).toBe(0)
  })
})
