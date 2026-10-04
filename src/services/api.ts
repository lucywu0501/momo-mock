import type { Category, FacetCount, HomeSection, Product, ProductSummary, SearchParams, SearchResult } from '../features/products/types'
import { CATEGORIES, PRODUCTS } from './mock/data'
import { delay } from './mock/delay'

export const PAGE_SIZE = 20

export class NotFoundError extends Error {
  constructor(id: string) { super(`product ${id} not found`) }
}

const toSummary = ({ images: _i, specs: _s, variant: _v, ...summary }: Product): ProductSummary => summary

function matches(p: Product, { keyword, category, brand, tag, minPrice, maxPrice }: SearchParams): boolean {
  const kw = keyword.trim()
  const catName = CATEGORIES.find(c => c.id === p.category)?.name ?? ''
  if (kw && !(p.name.includes(kw) || p.brand.includes(kw) || catName.includes(kw))) return false
  if (category && p.category !== category) return false
  if (brand && p.brand !== brand) return false
  if (tag && !p.tags.includes(tag)) return false
  if (minPrice != null && p.price < minPrice) return false
  if (maxPrice != null && p.price > maxPrice) return false
  return true
}

/** facet 數量計算：忽略該 facet 自身的已選值（與真站 attributesListArea 連動行為一致） */
function countBy(hits: Product[], keys: (p: Product) => string[], label: (v: string) => string): FacetCount[] {
  const m = new Map<string, number>()
  for (const p of hits) for (const k of keys(p)) m.set(k, (m.get(k) ?? 0) + 1)
  return [...m.entries()].map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count)
}

function buildFacets(params: SearchParams): SearchResult['facets'] {
  const omit = (key: 'category' | 'brand' | 'tag') => PRODUCTS.filter(p => matches(p, { ...params, [key]: undefined }))
  return {
    categories: countBy(omit('category'), p => [p.category], v => CATEGORIES.find(c => c.id === v)?.name ?? v),
    brands: countBy(omit('brand'), p => [p.brand], v => v),
    tags: countBy(omit('tag'), p => p.tags, v => v),
  }
}

export const api = {
  async searchProducts(params: SearchParams): Promise<SearchResult> {
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
      facets: buildFacets(params),
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

// 跨 feature 共用的領域型別由 service 邊界 re-export，維持「feature 之間不互相 import」規則
export type { Category, FacetCount, HomeSection, Page, Product, ProductSummary, SearchParams, SearchResult, SortKey } from '../features/products/types'
