import { useState } from 'react'
import type { CategoryId, FacetCount, SearchParams, SearchResult } from '../types'
import { Button } from '../../../shared/ui/Button'

function FacetRow({ label, facets, selected, onPick }: {
  label: string
  facets: FacetCount[] | undefined
  selected: string | undefined
  onPick: (value: string | undefined) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-100 py-2 text-sm last:border-b-0">
      <span className="w-10 shrink-0 font-bold text-gray-500">{label}</span>
      <button onClick={() => onPick(undefined)} className={!selected ? 'font-bold text-momo' : 'hover:text-momo'}>全部</button>
      {facets?.map(f => (
        <button key={f.value} onClick={() => onPick(f.value)}
          className={selected === f.value ? 'font-bold text-momo' : 'hover:text-momo'}>
          {f.label}({f.count})
        </button>
      ))}
    </div>
  )
}

export function FilterPanel({ params, facets, onChange }: {
  params: SearchParams
  facets: SearchResult['facets'] | undefined
  onChange: (patch: Partial<SearchParams>) => void
}) {
  const [min, setMin] = useState(params.minPrice?.toString() ?? '')
  const [max, setMax] = useState(params.maxPrice?.toString() ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-white px-3 py-1">
      <button className="w-full py-2 text-left font-bold text-momo sm:hidden" onClick={() => setOpen(o => !o)}>
        篩選 {open ? '▲' : '▼'}
      </button>
      <div className={`${open ? 'block' : 'hidden'} sm:block`}>
        <FacetRow label="分類" facets={facets?.categories} selected={params.category}
          onPick={v => onChange({ category: v as CategoryId | undefined })} />
        <FacetRow label="品牌" facets={facets?.brands} selected={params.brand}
          onPick={v => onChange({ brand: v })} />
        <FacetRow label="優惠" facets={facets?.tags} selected={params.tag}
          onPick={v => onChange({ tag: v })} />
        <div className="flex items-center gap-2 py-2 text-sm">
          <span className="w-10 shrink-0 font-bold text-gray-500">價格</span>
          <input value={min} onChange={e => setMin(e.target.value)} placeholder="最低" inputMode="numeric"
            className="w-20 rounded border px-2 py-1" />
          <span>–</span>
          <input value={max} onChange={e => setMax(e.target.value)} placeholder="最高" inputMode="numeric"
            className="w-20 rounded border px-2 py-1" />
          <Button variant="outline" className="!px-3 !py-1 text-sm"
            onClick={() => onChange({ minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined })}>
            確認
          </Button>
        </div>
      </div>
    </div>
  )
}
