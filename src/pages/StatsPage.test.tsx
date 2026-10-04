import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ANALYTICS_STORAGE_KEY, analytics } from '../services/analytics'
import StatsPage from './StatsPage'

describe('StatsPage', () => {
  beforeEach(() => { analytics.clear(); vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => vi.restoreAllMocks())

  it('同一毫秒的兩筆錯誤都能列出，且沒有 React key 警告', () => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify([
      { type: 'error', message: 'first', path: '/a', timestamp: 1_700_000_000_000 },
      { type: 'error', message: 'second', path: '/b', timestamp: 1_700_000_000_000 },
    ]))
    render(<StatsPage />)
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('tile 數值依事件型別計算', () => {
    analytics.track({ type: 'search', keyword: 'x', sort: 'relevance', resultCount: 1 })
    analytics.track({ type: 'add_to_cart', productId: 'p', qty: 2 })
    analytics.track({ type: 'add_to_cart', productId: 'q', qty: 1 })
    render(<StatsPage />)
    expect(screen.getByText('搜尋次數').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('加入購物車', { selector: 'p' }).nextElementSibling).toHaveTextContent('2')
  })
})
