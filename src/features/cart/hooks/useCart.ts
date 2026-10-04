import { useContext } from 'react'
import { CartContext } from '../store/CartContext'
import type { CartItem } from '../store/cartReducer'

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  const { items, total, count, dispatch } = ctx
  return {
    items, total, count,
    add: (item: Omit<CartItem, 'qty'>, qty?: number) => dispatch({ type: 'add', item, qty }),
    remove: (productId: string, variant?: string) => dispatch({ type: 'remove', productId, variant }),
    setQty: (productId: string, qty: number, variant?: string) => dispatch({ type: 'setQty', productId, qty, variant }),
    clear: () => dispatch({ type: 'clear' }),
  }
}
