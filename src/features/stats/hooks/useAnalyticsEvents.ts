import { useMemo, useSyncExternalStore } from 'react'
import { analytics } from '../../../services/analytics'

// 以版本號當 snapshot：sink 每次通知就 +1，list() 只在版本變動時重新解析，避免每次 render 產生新陣列
let version = 0
const subscribe = (onChange: () => void) => analytics.subscribe(() => { version += 1; onChange() })
const getVersion = () => version

/** 訂閱 Analytics Event 的即時快照；/stats 自己的 page_view 與後續事件都會立即反映 */
export function useAnalyticsEvents() {
  const v = useSyncExternalStore(subscribe, getVersion, getVersion)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- v 是觸發重新讀取的訊號
  const events = useMemo(() => analytics.list(), [v])
  return { events, clear: () => analytics.clear() }
}
