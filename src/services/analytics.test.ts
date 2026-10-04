import { beforeEach, describe, expect, it } from 'vitest'
import {
  ANALYTICS_STORAGE_KEY, MAX_EVENTS, appendEvent, createLocalStorageSink, type RecordedEvent,
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
