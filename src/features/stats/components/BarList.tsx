import type { Bar } from '../aggregate'

/**
 * 單一序列的水平長條清單：不需圖例（標題即序列名）、細長條＋圓角端點、
 * 單一色相（momo 桃紅），標籤與數值用文字色而非序列色，hover 以 title 顯示數值。
 */
export function BarList({ title, bars, emptyText = '尚無資料' }: { title: string; bars: Bar[]; emptyText?: string }) {
  const max = Math.max(0, ...bars.map(b => b.value))
  return (
    <section className="rounded-lg bg-white p-4">
      <h2 className="mb-3 border-l-4 border-momo pl-2 font-bold">{title}</h2>
      {max === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bars.map(b => (
            <li key={b.label} title={`${b.label}：${b.value}`}
              className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm">
              <span className="truncate text-gray-700">{b.label}</span>
              <span className="h-2 rounded-full bg-gray-100">
                <span data-testid={`bar-${b.label}`} className="block h-2 rounded-full bg-momo"
                  style={{ width: `${(b.value / max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-gray-500">{b.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
