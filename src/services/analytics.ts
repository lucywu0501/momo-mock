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
  /** 事件新增或清除時通知；回傳取消訂閱函式 */
  subscribe(listener: () => void): () => void
}

export const ANALYTICS_STORAGE_KEY = 'momo-mock.analytics.v1'
export const MAX_EVENTS = 500

/** 純函式：附加一筆並維持上限（丟最舊） */
export function appendEvent(events: RecordedEvent[], event: RecordedEvent, max = MAX_EVENTS): RecordedEvent[] {
  const next = [...events, event]
  return next.length > max ? next.slice(next.length - max) : next
}

/** 只接受至少有 type 字串與 timestamp 數字的項目；其餘（手動竄改、舊格式）丟棄，避免 /stats 整頁崩潰 */
const isRecordedEvent = (e: unknown): e is RecordedEvent =>
  typeof e === 'object' && e !== null
  && typeof (e as { type?: unknown }).type === 'string'
  && typeof (e as { timestamp?: unknown }).timestamp === 'number'

/** 取得 localStorage；Safari「封鎖所有 cookie」等情境連 getter 都會拋錯，此時回 null 讓 sink 變成 no-op */
export function resolveStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

export function createLocalStorageSink(
  storage: Storage | null,
  { now = Date.now, debug = false }: { now?: () => number; debug?: boolean } = {},
): AnalyticsSink {
  const listeners = new Set<() => void>()
  const notify = () => { for (const l of listeners) l() }
  const read = (): RecordedEvent[] => {
    if (!storage) return []
    try {
      const parsed: unknown = JSON.parse(storage.getItem(ANALYTICS_STORAGE_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed.filter(isRecordedEvent) : []
    } catch {
      return []
    }
  }
  const write = (events: RecordedEvent[]) => {
    if (!storage) return
    try { storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events)) } catch { /* 配額滿／隱私模式：分析不得影響購物流程 */ }
  }
  return {
    track(event) {
      const recorded: RecordedEvent = { ...event, timestamp: now() }
      if (debug) console.debug('[analytics]', recorded)
      write(appendEvent(read(), recorded))
      notify()
    },
    list: read,
    clear() {
      try { storage?.removeItem(ANALYTICS_STORAGE_KEY) } catch { /* 同上 */ }
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

// 只在 vite dev 印 console（vitest 的 MODE 是 'test'，不會洗版）
export const analytics: AnalyticsSink = createLocalStorageSink(resolveStorage(), { debug: import.meta.env.MODE === 'development' })
