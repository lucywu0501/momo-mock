import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, NotFoundError } from '../../../services/api'
import { analytics } from '../../../services/analytics'

export function useGoodsDetail(id: string) {
  const query = useQuery({
    queryKey: ['goods', id],
    queryFn: () => api.getProduct(id),
    retry: (count, err) => !(err instanceof NotFoundError) && count < 1,
  })
  useEffect(() => {
    if (query.data) analytics.track({ type: 'view_product', productId: query.data.id, category: query.data.category })
  }, [query.data])
  return query
}
