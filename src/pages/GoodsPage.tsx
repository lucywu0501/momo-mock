import { Link, useParams } from 'react-router'
import { useState } from 'react'
import { useGoodsDetail } from '../features/products/hooks/useGoodsDetail'
import { Gallery } from '../features/products/components/Gallery'
import { useCart } from '../features/cart/hooks/useCart'
import { NotFoundError } from '../services/api'
import { Badge } from '../shared/ui/Badge'
import { Button } from '../shared/ui/Button'
import { PriceTag } from '../shared/ui/PriceTag'
import { Skeleton } from '../shared/ui/Skeleton'
import { QuantityStepper } from '../shared/ui/QuantityStepper'
import { Breadcrumb } from '../shared/ui/Breadcrumb'

export default function GoodsPage() {
  const { goodsId = '' } = useParams()
  const { data: p, isPending, error } = useGoodsDetail(goodsId)
  const { add } = useCart()
  const [variant, setVariant] = useState<string>()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (error instanceof NotFoundError) return (
    <div className="py-24 text-center">
      <p className="text-xl font-bold">很抱歉！此商品目前無展售</p>
      <Link to="/" className="mt-4 inline-block text-momo underline">回首頁逛逛</Link>
    </div>
  )
  if (isPending || !p) return (
    <div className="grid gap-8 md:grid-cols-2"><Skeleton className="aspect-square" /><Skeleton className="h-80" /></div>
  )

  const chosenVariant = variant ?? p.variant?.options[0]
  const handleAdd = () => {
    add({ productId: p.id, name: p.name, price: p.price, image: p.image, variant: chosenVariant }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: '首頁', to: '/' }, { label: p.brand, to: `/search/${p.brand}` }, { label: p.name }]} />
      <div className="grid gap-8 rounded-lg bg-white p-4 md:grid-cols-2 md:p-6">
        <Gallery images={p.images} alt={p.name} />
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">{p.name}</h1>
          <div className="flex gap-1">{p.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
          <ul className="list-inside list-disc text-sm text-gray-600">
            {p.specs.map(s => <li key={s}>{s}</li>)}
          </ul>
          <div className="border-y py-4"><PriceTag size="lg" price={p.price} listPrice={p.listPrice} /></div>
          {p.variant && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{p.variant.label}</span>
              {p.variant.options.map(o => (
                <button key={o} onClick={() => setVariant(o)}
                  className={`rounded border px-3 py-1 ${chosenVariant === o ? 'border-momo text-momo' : ''}`}>{o}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">數量</span>
            <QuantityStepper value={qty} onChange={setQty} />
          </div>
          <Button onClick={handleAdd} disabled={!p.inStock} className="mt-auto">
            {!p.inStock ? '補貨中' : added ? '✓ 已加入' : '加入購物車'}
          </Button>
        </div>
      </div>
    </div>
  )
}
