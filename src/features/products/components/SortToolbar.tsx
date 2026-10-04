import type { SortKey } from '../types'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: '綜合推薦' },
  { key: 'priceAsc', label: '價格由低到高' },
  { key: 'priceDesc', label: '價格由高到低' },
]

export function SortToolbar({ sort, total, onChange }: {
  sort: SortKey; total: number; onChange: (s: SortKey) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-white p-2 text-sm">
      {SORTS.map(s => (
        <button key={s.key} onClick={() => onChange(s.key)} aria-pressed={sort === s.key}
          className={`rounded px-3 py-1 ${sort === s.key ? 'bg-momo text-white' : 'hover:bg-gray-100'}`}>
          {s.label}
        </button>
      ))}
      <span className="ml-auto text-gray-400">共 {total} 件商品</span>
    </div>
  )
}
