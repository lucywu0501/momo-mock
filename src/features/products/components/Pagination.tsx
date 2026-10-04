export function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4 text-sm">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">上一頁</button>
      <span>頁數 {page}/{totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="rounded border px-3 py-1 disabled:opacity-30">下一頁</button>
    </div>
  )
}
