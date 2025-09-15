import { OpenlaneProductsResponse, SubscriptionSchedulesResponse } from '@/types/stripe'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useSchedulesQuery(customerId?: string | null) {
  return useQuery<SubscriptionSchedulesResponse>({
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

export function useUpdateScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, priceId, quantity = 1, action = 'subscribe' }: { scheduleId: string; priceId: string; quantity?: number; action?: 'subscribe' | 'unsubscribe' }) => {
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
      queryClient.invalidateQueries({
        queryKey: ['stripe-schedules'],
      })
    },
  })
}

export function useSwitchIntervalMutation() {
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({ queryKey: ['stripe-schedules'] })
    },
  })
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({ queryKey: ['stripe-schedules'] })
    },
  })
}

export function useOpenlaneProductsQuery() {
  return useQuery<OpenlaneProductsResponse>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${openlaneAPIUrl}/v1/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch Openlane products')
      }

      return res.json() as Promise<OpenlaneProductsResponse>
    },
  })
}
