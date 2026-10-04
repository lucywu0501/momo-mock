import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'

export const useHomeSections = () =>
  useQuery({ queryKey: ['home'], queryFn: api.getHomeSections })
