import { describe, expect, it, vi } from 'vitest'
import { api, NotFoundError, PAGE_SIZE } from './api'

vi.mock('./mock/delay', () => ({ delay: () => Promise.resolve() }))

describe('searchProducts', () => {
  it('依關鍵字過濾並分頁', async () => {
    const page = await api.searchProducts({ keyword: '耳機' })
    expect(page.total).toBeGreaterThan(0)
    expect(page.items.length).toBeLessThanOrEqual(PAGE_SIZE)
    expect(page.items.every(p => p.name.includes('耳機'))).toBe(true)
  })
  it('空關鍵字回傳全部商品', async () => {
    const page = await api.searchProducts({ keyword: '' })
    expect(page.total).toBe(168)
    expect(page.totalPages).toBe(Math.ceil(168 / PAGE_SIZE))
  })
  it('支援分類與價格區間過濾', async () => {
    const page = await api.searchProducts({ keyword: '', category: '3c', maxPrice: 2000 })
    expect(page.items.length).toBeGreaterThan(0)
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
    expect(page.total).toBe(168)
  })
})

describe('facets', () => {
  it('facet 數量忽略自身已選、受其他條件影響', async () => {
    const r = await api.searchProducts({ keyword: '', category: '3c' })
    expect(r.facets.brands.reduce((s, b) => s + b.count, 0)).toBe(21) // 3c 分類共 21 筆
    expect(r.facets.categories.length).toBe(8)                        // 分類 facet 忽略自身選擇
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
