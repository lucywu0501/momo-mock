import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SortToolbar } from './SortToolbar'

describe('SortToolbar', () => {
  it('目前排序以 aria-pressed 標示，其餘為 false', () => {
    render(<SortToolbar sort="priceAsc" total={21} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '價格由低到高' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '綜合推薦' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '價格由高到低' })).toHaveAttribute('aria-pressed', 'false')
  })
})
