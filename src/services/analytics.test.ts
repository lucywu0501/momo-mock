import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ANALYTICS_STORAGE_KEY, MAX_EVENTS, appendEvent, createLocalStorageSink, resolveStorage, type RecordedEvent,
} from './analytics'

const ev = (i: number): RecordedEvent => ({ type: 'page_view', path: `/p${i}`, timestamp: i })

describe('appendEvent（ring buffer）', () => {
  it('未滿時直接附加', () => {
    expect(appendEvent([ev(1)], ev(2), 3)).toEqual([ev(1), ev(2)])
  })
  it('超過上限時丟掉最舊的', () => {
    expect(appendEvent([ev(1), ev(2), ev(3)], ev(4), 3)).toEqual([ev(2), ev(3), ev(4)])
  })
})

describe('createLocalStorageSink', () => {
  beforeEach(() => localStorage.clear())

  it('track 後 list 回傳帶 timestamp 的事件', () => {
    const sink = createLocalStorageSink(localStorage, { now: () => 1234 })
    sink.track({ type: 'search', keyword: '耳機', sort: 'relevance', resultCount: 6 })
    expect(sink.list()).toEqual([{ type: 'search', keyword: '耳機', sort: 'relevance', resultCount: 6, timestamp: 1234 }])
  })

  it('只保留最新 MAX_EVENTS 筆', () => {
    const sink = createLocalStorageSink(localStorage)
    for (let i = 0; i < MAX_EVENTS + 1; i++) sink.track({ type: 'page_view', path: `/p${i}` })
    const list = sink.list()
    expect(list).toHaveLength(MAX_EVENTS)
    expect(list[0]).toMatchObject({ path: '/p1' })
  })

  it('儲存內容損毀時 list 回空陣列，track 仍可寫入', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, '{not json')
    const sink = createLocalStorageSink(localStorage)
    expect(sink.list()).toEqual([])
    sink.track({ type: 'page_view', path: '/' })
    expect(sink.list()).toHaveLength(1)
  })

  it('陣列內的畸形項目會被過濾，只保留合法事件', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, '[null,1,{"type":"add_to_cart"},{"type":"page_view","path":"/","timestamp":1}]')
    expect(createLocalStorageSink(localStorage).list()).toEqual([{ type: 'page_view', path: '/', timestamp: 1 }])
  })

  it('儲存內容不是陣列時視為空', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, '{"a":1}')
    expect(createLocalStorageSink(localStorage).list()).toEqual([])
  })

  it('setItem 拋錯時 track 不拋錯', () => {
    const broken = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
      removeItem: () => {},
    } as unknown as Storage
    const sink = createLocalStorageSink(broken)
    expect(() => sink.track({ type: 'page_view', path: '/' })).not.toThrow()
  })

  it('clear 清空所有事件', () => {
    const sink = createLocalStorageSink(localStorage)
    sink.track({ type: 'page_view', path: '/' })
    sink.clear()
    expect(sink.list()).toEqual([])
  })
})

describe('resolveStorage', () => {
  it('localStorage getter 拋錯（Safari 封鎖所有 cookie）時回 null，而非拋錯', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('SecurityError') })
    expect(resolveStorage()).toBeNull()
    spy.mockRestore()
    expect(resolveStorage()).toBe(localStorage)
  })
})

describe('createLocalStorageSink(null)', () => {
  it('沒有 storage 時是 no-op sink：track 不拋錯、list 為空', () => {
    const sink = createLocalStorageSink(null)
    expect(() => sink.track({ type: 'page_view', path: '/' })).not.toThrow()
    expect(sink.list()).toEqual([])
    expect(() => sink.clear()).not.toThrow()
  })
})

describe('subscribe', () => {
  beforeEach(() => localStorage.clear())
  it('track 與 clear 都會通知訂閱者，取消後不再通知', () => {
    const sink = createLocalStorageSink(localStorage)
    const listener = vi.fn()
    const unsubscribe = sink.subscribe(listener)
    sink.track({ type: 'page_view', path: '/' })
    sink.clear()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    sink.track({ type: 'page_view', path: '/' })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
