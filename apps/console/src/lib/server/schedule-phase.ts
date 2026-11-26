import 'server-only'
import type Stripe from 'stripe'
import { priceIdOf } from '@/lib/stripe'

type TDiscountRef = {
  coupon: string | Stripe.Coupon | null
  discount: string | Stripe.Discount | null
  promotion_code: string | Stripe.PromotionCode | null
}

type TDiscountParam = { coupon?: string; discount?: string; promotion_code?: string }

const idOf = (ref: string | { id: string } | null): string | undefined => (ref === null ? undefined : typeof ref === 'string' ? ref : ref.id)

const toDiscountParams = (discounts: readonly TDiscountRef[] | null | undefined): TDiscountParam[] =>
  (discounts ?? []).flatMap((ref): TDiscountParam[] => {
    const discount = idOf(ref.discount)
    if (discount) return [{ discount }]
    const promotionCode = idOf(ref.promotion_code)
    if (promotionCode) return [{ promotion_code: promotionCode }]
    const coupon = idOf(ref.coupon)
    return coupon ? [{ coupon }] : []
  })

export const toPhaseParams = (phase: Stripe.SubscriptionSchedule.Phase, mapPrice: (priceId: string) => string = (priceId) => priceId): Stripe.SubscriptionScheduleUpdateParams.Phase => ({
  start_date: phase.start_date,
  end_date: phase.end_date,
  currency: phase.currency,
  proration_behavior: phase.proration_behavior ?? 'create_prorations',
  billing_cycle_anchor: phase.billing_cycle_anchor ?? undefined,
  collection_method: phase.collection_method ?? undefined,
  default_payment_method: idOf(phase.default_payment_method),
  metadata: phase.metadata ?? undefined,
  discounts: toDiscountParams(phase.discounts),
  trial_end: phase.trial_end ?? undefined,
  add_invoice_items: (phase.add_invoice_items ?? []).map((item) => ({
    price: priceIdOf(item.price),
    quantity: item.quantity ?? undefined,
    discounts: toDiscountParams(item.discounts),
  })),
  items: phase.items.map((item) => ({
    price: mapPrice(priceIdOf(item.price)),
    quantity: item.quantity,
    discounts: toDiscountParams(item.discounts),
    metadata: item.metadata ?? undefined,
    tax_rates: item.tax_rates?.map((rate) => rate.id),
  })),
})
