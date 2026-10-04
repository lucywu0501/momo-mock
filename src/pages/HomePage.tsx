import { Link } from 'react-router'
import { useHomeSections } from '../features/products/hooks/useHomeSections'
import { ProductCard } from '../features/products/components/ProductCard'
import { HeroCarousel } from '../features/products/components/HeroCarousel'
import { Skeleton } from '../shared/ui/Skeleton'
import { PriceTag } from '../shared/ui/PriceTag'

const QUICK_CATES = [
  { kw: '3C', label: '3C 達人' }, { kw: '家電', label: '家電館' },
  { kw: '美妝', label: '美妝保養' }, { kw: '食品', label: '美食搶購' },
  { kw: '時尚', label: '流行時尚' }, { kw: '運動', label: '運動戶外' },
  { kw: '居家', label: '居家生活' }, { kw: '母嬰', label: '日用婦幼' },
]

export default function HomePage() {
  const { data, isPending } = useHomeSections()
  const brandDay = data?.find(s => s.id === 'beauty')?.products.slice(0, 2)

  return (
    <div className="flex flex-col gap-8">
      {/* Hero 區：輪播 gallery ＋ 右側品牌日卡片（對齊真站版面） */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <HeroCarousel />
        <aside className="hidden flex-col gap-2 rounded-xl border-2 border-amber-400 bg-white p-3 lg:flex">
          <p className="flex items-center justify-between">
            <span className="font-bold text-amber-600">超級品牌日</span>
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">今日限定</span>
          </p>
          {brandDay?.map(p => (
            <Link key={p.id} to={`/goods/${p.id}`} className="flex items-center gap-2 rounded p-1 hover:bg-gray-50">
              <img src={p.image} alt="" className="h-14 w-14 rounded object-cover" />
              <span className="min-w-0">
                <span className="line-clamp-1 text-xs">{p.name}</span>
                <PriceTag price={p.price} listPrice={p.listPrice} />
              </span>
            </Link>
          )) ?? <Skeleton className="h-32" />}
        </aside>
      </div>

      {/* 分類入口：圓圖 gallery 列（窄螢幕可橫向捲動） */}
      <nav className="flex gap-4 overflow-x-auto pb-1">
        {QUICK_CATES.map(c => (
          <Link key={c.kw} to={`/search/${c.kw}`} className="group flex w-16 shrink-0 flex-col items-center gap-1">
            <img src={`https://picsum.photos/seed/cate-${c.kw}/96/96`} alt=""
              className="h-14 w-14 rounded-full border-2 border-transparent object-cover transition group-hover:border-momo" />
            <span className="text-xs text-gray-600 group-hover:text-momo">{c.label}</span>
          </Link>
        ))}
      </nav>

      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      )}
      {data?.map(section => (
        <section key={section.id}>
          <h2 className="mb-3 border-l-4 border-momo pl-2 text-xl font-bold">{section.title}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {section.products.slice(0, 10).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
