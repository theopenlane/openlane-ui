import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const asPriceId = (price: string | Stripe.Price | Stripe.DeletedPrice): string => {
  if (typeof price === 'string') return price
  return price.id
}

const asPriceUnitAmount = (price: string | Stripe.Price | Stripe.DeletedPrice): number | null => {
  if (typeof price === 'string') return null
  if ('deleted' in price && price.deleted) return null
  return price.unit_amount
}

const pickTargetPhase = (schedule: Stripe.SubscriptionSchedule): Stripe.SubscriptionSchedule.Phase | null => {
  const phases = schedule.phases ?? []
  if (phases.length === 0) return null

  if (!schedule.current_phase) return phases[0]

  const currentIndex = phases.findIndex((phase) => phase.start_date === schedule.current_phase?.start_date && phase.end_date === schedule.current_phase?.end_date)

  if (currentIndex >= 0) {
    return phases[currentIndex + 1] ?? phases[currentIndex]
  }

  return phases[0]
}

const resolveCoupon = async (couponRef: string | Stripe.Coupon | null): Promise<Stripe.Coupon | null> => {
  if (!couponRef) return null
  if (typeof couponRef === 'string') {
    return stripe.coupons.retrieve(couponRef)
  }

  return couponRef
}

const resolveCouponsFromPhaseDiscounts = async (discounts: Stripe.SubscriptionSchedule.Phase.Discount[] = []): Promise<Stripe.Coupon[]> => {
  const coupons = await Promise.all(
    discounts.map(async (discountRef) => {
      if (discountRef.coupon) {
        return resolveCoupon(discountRef.coupon)
      }

      if (discountRef.promotion_code) {
        const promo = typeof discountRef.promotion_code === 'string' ? await stripe.promotionCodes.retrieve(discountRef.promotion_code) : discountRef.promotion_code
        return resolveCoupon(promo.coupon)
      }

      if (discountRef.discount && typeof discountRef.discount !== 'string') {
        return resolveCoupon(discountRef.discount.coupon)
      }

      return null
    }),
  )

  return coupons.filter((coupon): coupon is Stripe.Coupon => !!coupon)
}

const resolveCouponsFromSubscription = async (subscriptionId?: string | null): Promise<Stripe.Coupon[]> => {
  if (!subscriptionId) return []

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['discounts'] })
  if (!subscription.discounts?.length) return []

  const coupons = await Promise.all(
    subscription.discounts.map(async (discountRef) => {
      if (typeof discountRef === 'string') return null
      return resolveCoupon(discountRef.coupon)
    }),
  )

  return coupons.filter((coupon): coupon is Stripe.Coupon => !!coupon)
}

const resolveCouponsFromCustomer = async (customerId: string): Promise<Stripe.Coupon[]> => {
  const customer = await stripe.customers.retrieve(customerId, { expand: ['discount'] })
  if (customer.deleted || !customer.discount) return []

  const coupon = await resolveCoupon(customer.discount.coupon)
  return coupon ? [coupon] : []
}

const computeSubtotalCents = async (phase: Stripe.SubscriptionSchedule.Phase): Promise<number> => {
  const phaseItems = phase.items ?? []
  if (!phaseItems.length) return 0

  const unitAmountByPriceId = new Map<string, number>()
  const missingPriceIds = new Set<string>()

  for (const item of phaseItems) {
    const priceId = asPriceId(item.price)
    const inlineUnitAmount = asPriceUnitAmount(item.price)

    if (inlineUnitAmount === null) {
      missingPriceIds.add(priceId)
    } else {
      unitAmountByPriceId.set(priceId, inlineUnitAmount)
    }
  }

  if (missingPriceIds.size > 0) {
    const missingPrices = await Promise.all(
      Array.from(missingPriceIds).map(async (priceId) => {
        const price = await stripe.prices.retrieve(priceId)
        return [priceId, price.unit_amount ?? 0] as const
      }),
    )

    for (const [priceId, unitAmount] of missingPrices) {
      unitAmountByPriceId.set(priceId, unitAmount)
    }
  }

  return phaseItems.reduce((sum, item) => {
    const priceId = asPriceId(item.price)
    const quantity = item.quantity ?? 1
    return sum + (unitAmountByPriceId.get(priceId) ?? 0) * quantity
  }, 0)
}

const applyCoupons = (subtotalCents: number, coupons: Stripe.Coupon[], currency: string): number => {
  let runningSubtotal = subtotalCents
  let totalDiscount = 0
  const normalizedCurrency = currency.toLowerCase()

  for (const coupon of coupons) {
    if (runningSubtotal <= 0) break

    let discountAmount = 0
    if (coupon.percent_off) {
      discountAmount = Math.round((runningSubtotal * coupon.percent_off) / 100)
    } else if (coupon.amount_off && coupon.currency?.toLowerCase() === normalizedCurrency) {
      discountAmount = coupon.amount_off
    }

    const appliedDiscount = Math.min(discountAmount, runningSubtotal)
    totalDiscount += appliedDiscount
    runningSubtotal -= appliedDiscount
  }

  return totalDiscount
}

const buildEstimatedUpcomingFromSchedule = async ({ customerId, scheduleId, subscriptionId }: { customerId: string; scheduleId?: string | null; subscriptionId?: string | null }) => {
  if (!scheduleId) return null

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
  const targetPhase = pickTargetPhase(schedule)
  if (!targetPhase) return null

  const [subtotal, phaseCoupons] = await Promise.all([computeSubtotalCents(targetPhase), resolveCouponsFromPhaseDiscounts(targetPhase.discounts)])
  let coupons = phaseCoupons

  if (coupons.length === 0) {
    const scheduleSubscriptionId = typeof schedule.subscription === 'string' ? schedule.subscription : schedule.subscription?.id
    coupons = await resolveCouponsFromSubscription(subscriptionId ?? scheduleSubscriptionId)
  }

  if (coupons.length === 0) {
    coupons = await resolveCouponsFromCustomer(customerId)
  }

  const totalDiscount = applyCoupons(subtotal, coupons, targetPhase.currency)
  const total = Math.max(0, subtotal - totalDiscount)

  return {
    currency: targetPhase.currency,
    subtotal,
    total,
    total_excluding_tax: total,
    total_discount: totalDiscount,
  }
}

export async function GET(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const scheduleId = searchParams.get('scheduleId')
  const subscriptionId = searchParams.get('subscriptionId')

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
  }

  if (!scheduleId && !subscriptionId) {
    return NextResponse.json({ error: 'Missing scheduleId or subscriptionId' }, { status: 400 })
  }

  try {
    const previewParams: Stripe.InvoiceCreatePreviewParams = {
      customer: customerId,
    }

    if (scheduleId) {
      previewParams.schedule = scheduleId
    } else if (subscriptionId) {
      previewParams.subscription = subscriptionId
    }
    const upcomingInvoice = await stripe.invoices.createPreview(previewParams)

    const totalDiscount = (upcomingInvoice.total_discount_amounts ?? []).reduce((sum, discountAmount) => sum + discountAmount.amount, 0)

    return NextResponse.json({
      currency: upcomingInvoice.currency,
      subtotal: upcomingInvoice.subtotal,
      total: upcomingInvoice.total,
      total_excluding_tax: upcomingInvoice.total_excluding_tax,
      total_discount: totalDiscount,
    })
  } catch (err: unknown) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'invoice_upcoming_none') {
      console.warn('[stripe-upcoming-invoice] invoice_upcoming_none (attempting fallback)', {
        code: err.code,
        message: err.message,
      })

      try {
        const fallback = await buildEstimatedUpcomingFromSchedule({
          customerId,
          scheduleId,
          subscriptionId,
        })

        if (fallback) {
          return NextResponse.json(fallback)
        }
      } catch (fallbackErr: unknown) {
        console.error('❌ Stripe upcoming invoice fallback error:', fallbackErr)
      }

      return NextResponse.json(null)
    }

    console.error('❌ Stripe upcoming invoice error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
