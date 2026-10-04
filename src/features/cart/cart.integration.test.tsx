import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CartProvider } from './store/CartContext'
import { useCart } from './hooks/useCart'
import { QuantityStepper } from '../../shared/ui/QuantityStepper'
import { analytics } from '../../services/analytics'

function Harness() {
  const { add, count } = useCart()
  return (
    <>
      <span data-testid="badge">{count}</span>
      <button onClick={() => add({ productId: 'x', name: 'n', price: 100, image: 'i' })}>加入購物車</button>
    </>
  )
}

describe('cart 互動', () => {
  it('點加入購物車 → badge 數量 +1，並記錄 add_to_cart 事件', async () => {
    localStorage.clear()
    analytics.clear()
    render(<CartProvider><Harness /></CartProvider>)
    expect(screen.getByTestId('badge')).toHaveTextContent('0')
    await userEvent.click(screen.getByText('加入購物車'))
    expect(screen.getByTestId('badge')).toHaveTextContent('1')
    const added = analytics.list().filter(e => e.type === 'add_to_cart')
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ productId: 'x', qty: 1 })
  })
})

function StepperHarness() {
  const [v, setV] = useState(1)
  return <QuantityStepper value={v} onChange={setV} />
}

describe('QuantityStepper', () => {
  it('數量為 1 時減號 disabled', () => {
    render(<StepperHarness />)
    expect(screen.getByLabelText('減少數量')).toBeDisabled()
  })
})
