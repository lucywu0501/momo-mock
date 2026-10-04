/**
 * Analytics Event 的 service 邊界（與 api.ts 同一原則）：
 * UI／hooks 只呼叫 analytics.track()，不知道事件寫到哪。
 * 現在是 localStorage ring buffer 的 mock sink；接真 SDK（GA4／PostHog）時只改這一檔。
 */
export type AnalyticsEvent =
  | { type: 'page_view'; path: string }
  | {
      type: 'search'; keyword: string
      category?: string; brand?: string; tag?: string; minPrice?: number; maxPrice?: number
      sort: string; resultCount: number
    }
  | { type: 'view_product'; productId: string; category: string }
  | { type: 'add_to_cart'; productId: string; variant?: string; qty: number }
  | { type: 'remove_from_cart'; productId: string; variant?: string }
  | { type: 'checkout_click'; cartTotal: number; itemCount: number }
  | { type: 'error'; message: string; path: string }

export type AnalyticsEventType = AnalyticsEvent['type']
export type RecordedEvent = AnalyticsEvent & { timestamp: number }

export interface AnalyticsSink {
  track(event: AnalyticsEvent): void
  list(): RecordedEvent[]
  clear(): void
}

export const ANALYTICS_STORAGE_KEY = 'momo-mock.analytics.v1'
export const MAX_EVENTS = 500

/** 純函式：附加一筆並維持上限（丟最舊） */
export function appendEvent(events: RecordedEvent[], event: RecordedEvent, max = MAX_EVENTS): RecordedEvent[] {
  const next = [...events, event]
  return next.length > max ? next.slice(next.length - max) : next
}

export function createLocalStorageSink(
  storage: Storage,
  { now = Date.now, debug = false }: { now?: () => number; debug?: boolean } = {},
): AnalyticsSink {
  const read = (): RecordedEvent[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(ANALYTICS_STORAGE_KEY) ?? '[]')
      return Array.isArray(parsed) ? (parsed as RecordedEvent[]) : []
    } catch {
      return []
    }
  }
  const write = (events: RecordedEvent[]) => {
    try { storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events)) } catch { /* 配額滿／隱私模式：分析不得影響購物流程 */ }
  }
  return {
    track(event) {
      const recorded: RecordedEvent = { ...event, timestamp: now() }
      if (debug) console.debug('[analytics]', recorded)
      write(appendEvent(read(), recorded))
    },
    list: read,
    clear() {
      try { storage.removeItem(ANALYTICS_STORAGE_KEY) } catch { /* 同上 */ }
    },
  }
}

// 只在 vite dev 印 console（vitest 的 MODE 是 'test'，不會洗版）
export const analytics: AnalyticsSink = createLocalStorageSink(localStorage, { debug: import.meta.env.MODE === 'development' })
