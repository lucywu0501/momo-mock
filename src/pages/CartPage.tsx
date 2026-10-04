import { Link } from 'react-router'
import { useCart } from '../features/cart/hooks/useCart'
import { CartItemRow } from '../features/cart/components/CartItemRow'
import { formatPrice } from '../shared/utils/formatPrice'
import { Button } from '../shared/ui/Button'

export default function CartPage() {
  const { items, total, setQty, remove, clear, checkout } = useCart()
  if (!items.length) return (
    <div className="py-24 text-center">
      <p className="text-gray-500">購物車是空的</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">去逛逛</Link>
    </div>
  )
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-lg bg-white p-4">
        <div className="mb-2 flex justify-between">
          <h1 className="text-lg font-bold">購物車（{items.length} 項）</h1>
          <button onClick={clear} className="text-sm text-gray-400 hover:text-price">清空</button>
        </div>
        {items.map(i => (
          <CartItemRow key={`${i.productId}-${i.variant ?? ''}`} item={i}
            onQty={q => setQty(i.productId, q, i.variant)}
            onRemove={() => remove(i.productId, i.variant)} />
        ))}
      </div>
      <aside className="rounded-lg bg-white p-4 lg:sticky lg:top-24">
        <div className="flex justify-between border-b pb-3 text-sm">
          <span>商品總計</span><b className="text-price">${formatPrice(total)}</b>
        </div>
        <Button className="mt-4 w-full" onClick={() => { checkout(); alert('mock：結帳流程刻意不在本次範圍（見 README tradeoff）') }}>
          前往結帳
        </Button>
      </aside>
    </div>
  )
}
