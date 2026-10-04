import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { analytics } from '../../../services/analytics'
import { useAnalyticsEvents } from './useAnalyticsEvents'

describe('useAnalyticsEvents', () => {
  beforeEach(() => analytics.clear())

  it('掛載後有新事件時會自動更新（不需按重新整理）', () => {
    const { result } = renderHook(() => useAnalyticsEvents())
    expect(result.current.events).toHaveLength(0)
    act(() => analytics.track({ type: 'page_view', path: '/stats' }))
    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0]).toMatchObject({ type: 'page_view', path: '/stats' })
  })

  it('clear 後事件清空', () => {
    analytics.track({ type: 'page_view', path: '/' })
    const { result } = renderHook(() => useAnalyticsEvents())
    expect(result.current.events).toHaveLength(1)
    act(() => result.current.clear())
    expect(result.current.events).toHaveLength(0)
  })
})
