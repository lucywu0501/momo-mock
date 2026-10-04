import { Link } from 'react-router'
import { useHomeSections } from '../features/products/hooks/useHomeSections'
import { ProductCard } from '../features/products/components/ProductCard'
import { Skeleton } from '../shared/ui/Skeleton'

const QUICK_CATES = [
  { kw: '3C', label: '3C 達人' }, { kw: '家電', label: '家電館' },
  { kw: '美妝', label: '美妝保養' }, { kw: '食品', label: '美食搶購' },
  { kw: '時尚', label: '流行時尚' }, { kw: '運動', label: '運動戶外' },
]

export default function HomePage() {
  const { data, isPending } = useHomeSections()
  return (
    <div className="flex flex-col gap-8">
      <div className="grid h-40 place-items-center rounded-xl bg-gradient-to-r from-momo to-pink-400 text-2xl font-black text-white sm:h-56 sm:text-4xl">
        全站超取 $290 免運
      </div>
      <nav className="flex flex-wrap gap-3">
        {QUICK_CATES.map(c => (
          <Link key={c.kw} to={`/search/${c.kw}`}
            className="rounded-full border border-momo px-4 py-1.5 text-sm text-momo hover:bg-momo hover:text-white">
            {c.label}
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
            {section.products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
