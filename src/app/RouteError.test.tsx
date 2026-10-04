import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { RouteError } from './RouteError'
import { analytics } from '../services/analytics'

function Boom(): never { throw new Error('render exploded') }

describe('RouteError', () => {
  beforeEach(() => { analytics.clear(); vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => vi.restoreAllMocks())

  it('顯示錯誤畫面並記錄 error 事件（含路徑）', async () => {
    const router = createMemoryRouter(
      [{ path: '/boom', element: <Boom />, errorElement: <RouteError /> }],
      { initialEntries: ['/boom'] },
    )
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('頁面發生錯誤，請重新整理。')).toBeInTheDocument()
    const errors = analytics.list().filter(e => e.type === 'error')
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({ message: 'render exploded', path: '/boom' })
  })
})
