import { Link } from 'react-router'
import { Star } from 'lucide-react'
import type { ProductSummary } from '../types'
import { Badge } from '../../../shared/ui/Badge'
import { PriceTag } from '../../../shared/ui/PriceTag'

/** 折數：促銷價/原價，取到 1 位（如 79 折） */
const discountOf = (p: ProductSummary) =>
  p.listPrice ? Math.round((p.price / p.listPrice) * 100) : undefined

export function ProductCard({ product }: { product: ProductSummary }) {
  const discount = discountOf(product)
  return (
    <Link to={`/goods/${product.id}`}
      className="group flex flex-col gap-2 rounded-lg border border-gray-100 bg-white p-3 transition hover:shadow-md [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
      <div className="relative aspect-square overflow-hidden rounded bg-gray-50">
        <img src={product.image} alt={product.name} loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105" />
        {!product.inStock && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 font-bold text-gray-500">補貨中</span>
        )}
      </div>
      <div className="flex gap-1">
        {product.tags.map(t => <Badge key={t}>{t}</Badge>)}
        {discount != null && <Badge>下殺{discount >= 10 ? Math.round(discount / 10) : discount}折</Badge>}
      </div>
      <p className="line-clamp-2 min-h-10 text-sm">{product.name}</p>
      <p className="flex items-center gap-1 text-xs text-gray-400">
        <Star size={12} className="fill-amber-400 text-amber-400" />
        {product.rating}（{product.reviews.toLocaleString('zh-TW')}）
      </p>
      <PriceTag price={product.price} listPrice={product.listPrice} />
    </Link>
  )
}
