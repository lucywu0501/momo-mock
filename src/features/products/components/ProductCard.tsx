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
