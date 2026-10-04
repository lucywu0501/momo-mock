import { useDiscoverFeed } from '../features/discover/hooks/useDiscoverFeed'
import { ProductCard } from '../features/products/components/ProductCard'
import { Skeleton } from '../shared/ui/Skeleton'

export default function DiscoverPage() {
  const { data, isPending } = useDiscoverFeed()
  return (
    <div className="flex flex-col gap-8">
      <h1 className="border-l-4 border-momo pl-2 text-xl font-bold">發現好物</h1>
      {isPending && <Skeleton className="h-64" />}
      {data?.map(entry => (
        <article key={entry.id} className="rounded-lg bg-white p-4">
          <h2 className="text-lg font-bold">{entry.title}</h2>
          <p className="mb-3 text-sm text-gray-500">{entry.intro}</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {entry.products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </article>
      ))}
    </div>
  )
}
