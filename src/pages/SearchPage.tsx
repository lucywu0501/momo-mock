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
