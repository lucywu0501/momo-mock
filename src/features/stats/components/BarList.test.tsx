import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarList } from './BarList'

describe('BarList', () => {
  it('沒有資料時顯示空狀態', () => {
    render(<BarList title="熱門搜尋" bars={[]} />)
    expect(screen.getByText('尚無資料')).toBeInTheDocument()
  })
  it('全為 0 時也顯示空狀態（避免除以零）', () => {
    render(<BarList title="x" bars={[{ label: 'a', value: 0 }]} />)
    expect(screen.getByText('尚無資料')).toBeInTheDocument()
  })
  it('長條寬度依最大值等比', () => {
    render(<BarList title="x" bars={[{ label: 'a', value: 4 }, { label: 'b', value: 2 }]} />)
    expect(screen.getByTestId('bar-a')).toHaveStyle({ width: '100%' })
    expect(screen.getByTestId('bar-b')).toHaveStyle({ width: '50%' })
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
