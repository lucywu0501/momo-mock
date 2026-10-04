import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { analytics } from '../../../services/analytics'
import type { CategoryId, SearchParams, SortKey } from '../types'

export function useSearch() {
  const { keyword = '' } = useParams()
  const [sp, setSp] = useSearchParams()

  const params: SearchParams = {
    keyword: decodeURIComponent(keyword),
    category: (sp.get('cate') as CategoryId) ?? undefined,
    brand: sp.get('brand') ?? undefined,
    tag: sp.get('tag') ?? undefined,
    minPrice: sp.get('min') ? Number(sp.get('min')) : undefined,
    maxPrice: sp.get('max') ? Number(sp.get('max')) : undefined,
    sort: (sp.get('sort') as SortKey) ?? 'relevance',
    page: sp.get('page') ? Number(sp.get('page')) : 1,
  }

  const { data: page, isPending } = useQuery({
    queryKey: ['search', params],
    queryFn: () => api.searchProducts(params),
  })

  // page 物件由 TanStack Query 結構共享，只有結果真的改變才會觸發；回上一頁拿快取不重複記
  useEffect(() => {
    if (!page) return
    analytics.track({
      type: 'search', keyword: params.keyword,
      category: params.category, brand: params.brand, tag: params.tag,
      minPrice: params.minPrice, maxPrice: params.maxPrice,
      sort: params.sort ?? 'relevance', resultCount: page.total,
    })
  }, [page, params.keyword, params.category, params.brand, params.tag, params.minPrice, params.maxPrice, params.sort])

  const setParam = (patch: Partial<Omit<SearchParams, 'keyword'>>) => {
    const next = new URLSearchParams(sp)
    if ('category' in patch) { if (patch.category) next.set('cate', patch.category); else next.delete('cate') }
    if ('brand' in patch) { if (patch.brand) next.set('brand', patch.brand); else next.delete('brand') }
    if ('tag' in patch) { if (patch.tag) next.set('tag', patch.tag); else next.delete('tag') }
    if ('minPrice' in patch) { if (patch.minPrice != null) next.set('min', String(patch.minPrice)); else next.delete('min') }
    if ('maxPrice' in patch) { if (patch.maxPrice != null) next.set('max', String(patch.maxPrice)); else next.delete('max') }
    if ('sort' in patch) { if (patch.sort && patch.sort !== 'relevance') next.set('sort', patch.sort); else next.delete('sort') }
    if ('page' in patch && patch.page && patch.page > 1) next.set('page', String(patch.page))
    else next.delete('page') // 任何篩選/排序變更 → 回第 1 頁
    setSp(next)
  }

  return { params, page, isPending, setParam }
}
