export function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void
}) {
  const tp = Math.max(1, totalPages)
  return (
    <div className="flex items-center justify-center gap-4 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">上一頁</button>
      <span>頁數 {page}/{tp}</span>
      <button disabled={page >= tp} onClick={() => onChange(page + 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">下一頁</button>
    </div>
  )
}
