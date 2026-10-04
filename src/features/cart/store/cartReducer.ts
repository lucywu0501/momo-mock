export interface CartItem {
  productId: string; name: string; price: number; image: string; variant?: string; qty: number
}

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'remove'; productId: string; variant?: string }
  | { type: 'setQty'; productId: string; variant?: string; qty: number }
  | { type: 'clear' }

const sameLine = (i: CartItem, productId: string, variant?: string) =>
  i.productId === productId && i.variant === variant

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const qty = action.qty ?? 1
      const hit = state.find(i => sameLine(i, action.item.productId, action.item.variant))
      return hit
        ? state.map(i => (i === hit ? { ...i, qty: i.qty + qty } : i))
        : [...state, { ...action.item, qty }]
    }
    case 'setQty':
      return state.map(i =>
        sameLine(i, action.productId, action.variant) ? { ...i, qty: Math.max(1, action.qty) } : i)
    case 'remove':
      return state.filter(i => !sameLine(i, action.productId, action.variant))
    case 'clear':
      return []
  }
}

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
