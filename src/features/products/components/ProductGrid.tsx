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
