import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useMutation, useQuery } from '@tanstack/react-query'

export function useProductsQuery() {
  const { client, queryClient } = useGraphQLClient()
  return useQuery({
    queryKey: ['stripe-products'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })
}

export function useSchedulesQuery(customerId?: string | null) {
  return useQuery({
    queryKey: ['stripe-schedules', customerId],
    queryFn: async () => {
      if (!customerId) return []
      const res = await fetch(`/api/stripe/schedules?customerId=${customerId}`)
      if (!res.ok) throw new Error('Failed to fetch schedules')
      return res.json()
    },
    enabled: !!customerId,
  })
}

export function useUpdateScheduleMutation(customerId?: string | null) {
  const { queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async ({ scheduleId, priceId, quantity = 1, action = 'add' }: { scheduleId: string; priceId: string; quantity?: number; action?: 'add' | 'remove' }) => {
      const res = await fetch('/api/stripe/schedules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, priceId, quantity, action }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to update schedule')
      }
      return res.json()
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: ['stripe-schedules', customerId],
        })
      }
    },
  })
}

export function useSwitchIntervalMutation(customerId?: string | null) {
  const { queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async ({ scheduleId, swaps }: { scheduleId: string; swaps: { from: string; to: string }[] }) => {
      const res = await fetch('/api/stripe/schedules/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, swaps }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw data // throw full object, not just message
      }
      return data
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ['stripe-schedules', customerId] })
      }
    },
  })
}

export function useCancelSubscriptionMutation(customerId?: string | null) {
  const { queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async ({ scheduleId }: { scheduleId: string }) => {
      const res = await fetch('/api/stripe/schedules/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to cancel subscription')
      }
      return res.json()
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ['stripe-schedules', customerId] })
      }
    },
  })
}
