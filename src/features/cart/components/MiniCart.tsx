import { Link } from 'react-router'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../../../shared/utils/formatPrice'

export function MiniCart() {
  const { count, total } = useCart()
  return (
    <aside className="fixed right-0 top-32 z-10 hidden w-24 flex-col items-center gap-2 rounded-l-lg bg-momo p-3 text-white shadow-lg xl:flex">
      <ShoppingCart size={20} />
      <p className="text-sm">購物車 ({count})</p>
      <p className="text-xs">${formatPrice(total)}</p>
      <Link to="/cart" className="w-full rounded bg-white py-1 text-center text-sm font-bold text-momo">結帳</Link>
    </aside>
  )
}
