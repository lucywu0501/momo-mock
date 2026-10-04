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
