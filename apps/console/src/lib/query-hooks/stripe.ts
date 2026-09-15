import { type Invoice, type InvoicesResponse, type OpenlaneProductsResponse, type Subscription, type SubscriptionSchedulesResponse, type UpcomingInvoiceResponse } from '@/types/stripe'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fromUnixTime } from 'date-fns'
import type Stripe from 'stripe'

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

type UseUpcomingInvoiceQueryParams = {
  customerId?: string | null
  scheduleId?: string | null
  subscriptionId?: string | null
}

export function useUpcomingInvoiceQuery({ customerId, scheduleId, subscriptionId }: UseUpcomingInvoiceQueryParams) {
  return useQuery<UpcomingInvoiceResponse | null>({
    queryKey: ['stripe-upcoming-invoice', customerId, scheduleId, subscriptionId],
    queryFn: async () => {
      if (!customerId || (!scheduleId && !subscriptionId)) return null
      const params = new URLSearchParams({ customerId })
      if (scheduleId) {
        params.set('scheduleId', scheduleId)
      } else if (subscriptionId) {
        params.set('subscriptionId', subscriptionId)
      }

      const res = await fetch(`/api/stripe/upcoming-invoice?${params.toString()}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch upcoming invoice')
      }
      return res.json() as Promise<UpcomingInvoiceResponse | null>
    },
    enabled: !!customerId && (!!scheduleId || !!subscriptionId),
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

export function useRenewSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ scheduleId }: { scheduleId: string }) => {
      const res = await fetch('/api/stripe/schedules/renew', {
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

export function useOpenlaneProductsQuery(includeBeta: boolean = false) {
  return useQuery<OpenlaneProductsResponse>({
    queryKey: ['products', includeBeta],
    queryFn: async () => {
      const res = await fetch(`${openlaneAPIUrl}/v1/products${includeBeta ? '?include_beta=true' : ''}`, {
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

export function useSubscriptionQuery(customerId?: string | null, subscriptionId?: string | null) {
  return useQuery<Subscription | null>({
    queryKey: ['stripe-subscription', customerId, subscriptionId],
    queryFn: async () => {
      if (!customerId) return null
      const params = new URLSearchParams({ customer: customerId })
      if (subscriptionId) {
        params.set('subscription', subscriptionId)
      }
      const res = await fetch(`/api/stripe/subscription?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch subscription')
      return res.json() as Promise<Subscription | null>
    },
    enabled: !!customerId,
  })
}

import { type PaymentMethodsResponse } from '@/types/stripe'

export function usePaymentMethodsQuery(customerId?: string | null) {
  return useQuery<PaymentMethodsResponse>({
    queryKey: ['stripe-payment-methods', customerId],
    queryFn: async () => {
      if (!customerId) {
        return {
          hasPaymentMethod: false,
          defaultPaymentMethod: null,
          paymentMethods: [],
        }
      }

      const res = await fetch(`/api/stripe/payment-methods?customerId=${customerId}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch payment methods')
      }

      return res.json() as Promise<PaymentMethodsResponse>
    },
    enabled: !!customerId,
  })
}

const DEFAULT_INVOICE_LIMIT = 10
const OUTSTANDING_INVOICE_LIMIT = 100

type InvoicesQueryParams = {
  customerId?: string | null
  status?: Stripe.InvoiceListParams.Status
  limit?: number
}

const invoicesQueryOptions = ({ customerId, status, limit = DEFAULT_INVOICE_LIMIT }: InvoicesQueryParams) =>
  queryOptions({
    queryKey: ['stripe-invoices', customerId, status ?? null, limit],
    queryFn: async (): Promise<InvoicesResponse> => {
      const res = await fetch(`/api/stripe/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, status, limit }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to fetch invoices')
      }

      return res.json() as Promise<InvoicesResponse>
    },
    enabled: !!customerId,
  })

export const useInvoicesQuery = (customerId?: string | null) => useQuery(invoicesQueryOptions({ customerId }))

const dueTimestamp = (invoice: Invoice) => invoice.due_date ?? invoice.created

const selectOutstandingInvoiceDueDate = ({ invoices }: InvoicesResponse): Date | null => {
  const oldest = invoices.filter((invoice) => invoice.amount_due > 0).reduce<Invoice | null>((acc, invoice) => (!acc || dueTimestamp(invoice) < dueTimestamp(acc) ? invoice : acc), null)

  return oldest ? fromUnixTime(dueTimestamp(oldest)) : null
}

export const useOutstandingInvoiceDueDateQuery = (customerId?: string | null) =>
  useQuery({ ...invoicesQueryOptions({ customerId, status: 'open', limit: OUTSTANDING_INVOICE_LIMIT }), select: selectOutstandingInvoiceDueDate })
