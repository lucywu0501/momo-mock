import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex items-center rounded border">
      <button aria-label="減少數量" disabled={value <= 1} onClick={() => onChange(value - 1)}
        className="p-1.5 disabled:opacity-30"><Minus size={14} /></button>
      <span className="w-10 text-center text-sm">{value}</span>
      <button aria-label="增加數量" onClick={() => onChange(value + 1)}
        className="p-1.5"><Plus size={14} /></button>
    </span>
  )
}
