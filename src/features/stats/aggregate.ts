import type { AnalyticsEventType, RecordedEvent } from '../../services/analytics'

export interface Bar { label: string; value: number }

/** 固定順序：決定 countByType 的輸出順序（單一色相，順序只影響閱讀） */
export const EVENT_LABELS: Record<AnalyticsEventType, string> = {
  page_view: '頁面瀏覽',
  search: '搜尋',
  view_product: '瀏覽商品',
  add_to_cart: '加入購物車',
  remove_from_cart: '移出購物車',
  checkout_click: '點擊結帳',
  error: '前端錯誤',
}

/** 累加並排序：value 遞減、同分 label 遞增（zh-TW 排序），再截斷 */
function tally(entries: Iterable<[string, number]>, limit: number): Bar[] {
  const m = new Map<string, number>()
  for (const [k, v] of entries) m.set(k, (m.get(k) ?? 0) + v)
  return [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-TW'))
    .slice(0, limit)
}

export function countByType(events: RecordedEvent[]): Bar[] {
  const counts = new Map<AnalyticsEventType, number>()
  for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
  return (Object.keys(EVENT_LABELS) as AnalyticsEventType[]).map(type => ({ label: EVENT_LABELS[type], value: counts.get(type) ?? 0 }))
}

export function topSearches(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'search' ? [[e.keyword, 1] as [string, number]] : [])), limit)
}

export function zeroResultSearches(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'search' && e.resultCount === 0 ? [[e.keyword, 1] as [string, number]] : [])), limit)
}

export function topAddedProducts(events: RecordedEvent[], limit = 5): Bar[] {
  return tally(events.flatMap(e => (e.type === 'add_to_cart' ? [[e.productId, e.qty] as [string, number]] : [])), limit)
}

export function recentErrors(events: RecordedEvent[], limit = 10) {
  return events
    .flatMap(e => (e.type === 'error' ? [{ message: e.message, path: e.path, timestamp: e.timestamp }] : []))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}
