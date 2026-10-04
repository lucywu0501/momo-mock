import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { SearchParams } from '../types'
import { Button } from '../../../shared/ui/Button'

export function FilterPanel({ params, onChange }: {
  params: SearchParams
  onChange: (patch: Partial<SearchParams>) => void
}) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  const [min, setMin] = useState(params.minPrice?.toString() ?? '')
  const [max, setMax] = useState(params.maxPrice?.toString() ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-white p-3">
      <button className="w-full text-left font-bold text-momo sm:hidden" onClick={() => setOpen(o => !o)}>
        篩選 {open ? '▲' : '▼'}
      </button>
      <div className={`${open ? 'flex' : 'hidden'} flex-col gap-3 sm:flex`}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-gray-500">分類</span>
          <button onClick={() => onChange({ category: undefined })}
            className={!params.category ? 'font-bold text-momo' : ''}>全部</button>
          {categories?.map(c => (
            <button key={c.id} onClick={() => onChange({ category: c.id })}
              className={params.category === c.id ? 'font-bold text-momo' : ''}>{c.name}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-gray-500">價格</span>
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
