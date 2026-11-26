import { type BillingInterval, type OpenlaneProductsResponse } from '@/types/stripe'
import { formatList } from '@/utils/strings'
import { isOneOf } from '@/utils/type-guards'
import { catalogProducts } from './product-catalog'

type TIntervalSwap = { from: string; to: string }

type TIntervalSwitchPlan = {
  swaps: TIntervalSwap[]
  unswitchableProducts: string[]
  unknownPriceIds: string[]
}

type TPhaseWindow = { start_date: number }

type TPhaseWithPrices = TPhaseWindow & { items: { price: string }[] }

const INTERVAL_ADJECTIVE: Record<BillingInterval, string> = { month: 'monthly', year: 'annual' }

const INTERVAL_ADVERB: Record<BillingInterval, string> = { month: 'monthly', year: 'annually' }

export const BILLING_INTERVALS = ['month', 'year'] as const satisfies readonly BillingInterval[]

export const isBillingInterval = isOneOf(BILLING_INTERVALS)

export const oppositeInterval = (interval: BillingInterval): BillingInterval => (interval === 'month' ? 'year' : 'month')

export const intervalAdjective = (interval: BillingInterval): string => INTERVAL_ADJECTIVE[interval]

export const isCurrentOrFuturePhase = (phase: TPhaseWindow, currentPhase: TPhaseWindow): boolean => phase.start_date >= currentPhase.start_date

export const switchingPriceIds = (phases: readonly TPhaseWithPrices[], currentPhase: TPhaseWindow): string[] =>
  phases.filter((phase) => isCurrentOrFuturePhase(phase, currentPhase)).flatMap((phase) => phase.items.map((item) => item.price))

export const planIntervalSwitch = (catalog: OpenlaneProductsResponse, priceIds: Iterable<string>, target: BillingInterval): TIntervalSwitchPlan => {
  const products = catalogProducts(catalog)
  const swaps: TIntervalSwap[] = []
  const unknownPriceIds: string[] = []
  const unswitchable = new Set<string>()

  for (const priceId of new Set(priceIds)) {
    const owners = products.flatMap((product) => {
      const own = product.billing.prices.find((price) => price.price_id === priceId)
      return own ? [{ product, own, to: product.billing.prices.find((price) => price.interval === target)?.price_id }] : []
    })

    if (owners.length === 0) {
      unknownPriceIds.push(priceId)
      continue
    }

    if (owners.every(({ own }) => own.interval === target)) continue

    const targets = new Set(owners.map(({ to }) => to))
    const [to] = targets

    if (targets.size === 1 && to) {
      swaps.push({ from: priceId, to })
    } else {
      owners.forEach(({ product }) => unswitchable.add(product.display_name))
    }
  }

  return { swaps, unswitchableProducts: [...unswitchable], unknownPriceIds }
}

type TSwitchableSchedule = {
  status: string
  end_behavior: string
  current_phase: TPhaseWindow | null
}

export const SWITCH_UNAVAILABLE_REASON = "This subscription's billing interval can't be changed here. Contact support to change it."

export const scheduleSwitchBlockedReason = (schedule: TSwitchableSchedule | null | undefined): string | null => {
  if (!schedule || schedule.status !== 'active' || !schedule.current_phase) return SWITCH_UNAVAILABLE_REASON
  if (schedule.end_behavior === 'cancel') return 'Renew your subscription to change its billing interval.'
  return null
}

export const intervalSwitchBlockedReason = ({ swaps, unswitchableProducts, unknownPriceIds }: TIntervalSwitchPlan, target: BillingInterval): string | null => {
  const adjective = intervalAdjective(target)
  const consequence = `so your subscription can't switch to ${adjective} billing. Contact support to change your billing interval.`

  if (unswitchableProducts.length > 0) {
    return `${formatList(unswitchableProducts)} can't be billed ${INTERVAL_ADVERB[target]}, ${consequence}`
  }

  if (unknownPriceIds.length > 0) {
    return `Your subscription has items that are not in the product catalog, ${consequence}`
  }

  if (swaps.length === 0) {
    return `Nothing on your subscription can switch to ${adjective} billing.`
  }

  return null
}
