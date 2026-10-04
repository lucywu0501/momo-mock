import { useState } from 'react'
import { analytics } from '../../../services/analytics'

/** 讀一次快照；清除後立即反映。不做即時訂閱：統計頁是回顧工具，不需要 live。 */
export function useAnalyticsEvents() {
  const [events, setEvents] = useState(() => analytics.list())
  const clear = () => { analytics.clear(); setEvents([]) }
  const refresh = () => setEvents(analytics.list())
  return { events, clear, refresh }
}
