import { useAnalyticsEvents } from '../features/stats/hooks/useAnalyticsEvents'
import { countByType, countOf, recentErrors, topAddedProducts, topSearches, zeroResultSearches } from '../features/stats/aggregate'
import { BarList } from '../features/stats/components/BarList'
import { Button } from '../shared/ui/Button'
import { MAX_EVENTS } from '../services/analytics'

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('zh-TW')}</p>
    </div>
  )
}

export default function StatsPage() {
  const { events, clear } = useAnalyticsEvents()
  const byType = countByType(events)
  const errors = recentErrors(events)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="border-l-4 border-momo pl-2 text-xl font-bold">站內統計</h1>
          <p className="mt-1 text-xs text-gray-500">
            Analytics Event 的 mock sink：資料只存於此瀏覽器 localStorage，保留最近 {MAX_EVENTS} 筆。接真 SDK 時只需替換 services/analytics.ts。
          </p>
        </div>
        <Button variant="outline" onClick={clear}>清除紀錄</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="事件總數" value={events.length} />
        <Tile label="搜尋次數" value={countOf(events, 'search')} />
        <Tile label="加入購物車" value={countOf(events, 'add_to_cart')} />
        <Tile label="前端錯誤" value={countOf(events, 'error')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BarList title="事件類型分布" bars={byType} />
        <BarList title="熱門搜尋詞" bars={topSearches(events)} />
        <BarList title="零結果搜尋詞" bars={zeroResultSearches(events)} emptyText="沒有零結果的搜尋，太好了" />
        <BarList title="加購最多的商品（件數）" bars={topAddedProducts(events)} />
      </div>

      <section className="rounded-lg bg-white p-4">
        <h2 className="mb-3 border-l-4 border-momo pl-2 font-bold">最近錯誤</h2>
        {errors.length === 0 ? (
          <p className="text-sm text-gray-400">尚無錯誤</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500"><tr><th className="py-1">時間</th><th>路徑</th><th>訊息</th></tr></thead>
            <tbody>
              {errors.map((e, i) => (
                <tr key={`${e.timestamp}-${i}`} className="border-t">
                  <td className="py-1 tabular-nums">{new Date(e.timestamp).toLocaleString('zh-TW')}</td>
                  <td className="font-mono text-xs">{e.path}</td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
