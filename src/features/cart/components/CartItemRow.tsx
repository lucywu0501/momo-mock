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
