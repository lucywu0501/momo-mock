import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CartProvider } from './store/CartContext'
import { useCart } from './hooks/useCart'
import { QuantityStepper } from '../../shared/ui/QuantityStepper'

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
  it('點加入購物車 → badge 數量 +1', async () => {
    localStorage.clear()
    render(<CartProvider><Harness /></CartProvider>)
    expect(screen.getByTestId('badge')).toHaveTextContent('0')
    await userEvent.click(screen.getByText('加入購物車'))
    expect(screen.getByTestId('badge')).toHaveTextContent('1')
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
