import { useQuery } from '@tanstack/react-query'
import { api, NotFoundError } from '../../../services/api'

export function useGoodsDetail(id: string) {
  return useQuery({
    queryKey: ['goods', id],
    queryFn: () => api.getProduct(id),
    retry: (count, err) => !(err instanceof NotFoundError) && count < 1,
  })
}
