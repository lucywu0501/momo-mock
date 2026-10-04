import { useContext } from 'react'
import { CartContext } from '../store/CartContext'
import type { CartItem } from '../store/cartReducer'
import { analytics } from '../../../services/analytics'

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  const { items, total, count, dispatch } = ctx
  return {
    items, total, count,
    add: (item: Omit<CartItem, 'qty'>, qty = 1) => {
      dispatch({ type: 'add', item, qty })
      analytics.track({ type: 'add_to_cart', productId: item.productId, variant: item.variant, qty })
    },
    remove: (productId: string, variant?: string) => {
      dispatch({ type: 'remove', productId, variant })
      analytics.track({ type: 'remove_from_cart', productId, variant })
    },
    setQty: (productId: string, qty: number, variant?: string) => dispatch({ type: 'setQty', productId, qty, variant }),
    clear: () => dispatch({ type: 'clear' }),
    /** 結帳刻意不實作；只記錄意圖供統計 */
    checkout: () => analytics.track({ type: 'checkout_click', cartTotal: total, itemCount: count }),
  }
}
