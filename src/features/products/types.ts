export type CategoryId = '3c' | 'appliance' | 'beauty' | 'food' | 'fashion' | 'sports' | 'home' | 'baby'

export interface Category { id: CategoryId; name: string }

export interface ProductSummary {
  id: string
  name: string
  brand: string
  price: number        // 促銷價
  listPrice?: number   // 原價（有促銷時才有）
  image: string
  category: CategoryId
  inStock: boolean
  tags: string[]       // 促銷 badge，如「限時下殺」
}

export interface Product extends ProductSummary {
  images: string[]
  specs: string[]                                    // bullet 規格
  variant?: { label: string; options: string[] }     // 單一維度規格（如顏色）
}

export type SortKey = 'relevance' | 'priceAsc' | 'priceDesc'

export interface SearchParams {
  keyword: string
  category?: CategoryId
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
  page?: number        // 1-based，預設 1
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface HomeSection { id: string; title: string; products: ProductSummary[] }
