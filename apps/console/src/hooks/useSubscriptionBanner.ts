import { useGetBillingBanner } from '@/lib/graphql-hooks/organization'
import { parseISO, differenceInDays, isValid } from 'date-fns'
import { useOrganization } from '@/hooks/useOrganization'

export function useSubscriptionBanner() {
  const { currentOrgId } = useOrganization()
  const { data } = useGetBillingBanner(currentOrgId)

  const subscription = data?.organization?.orgSubscriptions?.[0]
  const { expiresAt, trialExpiresAt, stripeSubscriptionStatus: stripeStatus, paymentMethodAdded } = subscription || {}

  const safeParseDate = (date?: string) => (date && isValid(parseISO(date)) ? parseISO(date) : null)

  const daysLeft = safeParseDate(expiresAt) ? differenceInDays(safeParseDate(expiresAt)!, new Date()) : null

  const trialDaysLeft = safeParseDate(trialExpiresAt) ? differenceInDays(safeParseDate(trialExpiresAt)!, new Date()) : null

  const isTrial = stripeStatus === 'trialing'
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const trialExpiringSoon = trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft >= 0

  const trialEnded = (trialDaysLeft && trialDaysLeft < 0) || false
  const subEnded = (daysLeft && daysLeft < 0) || false

  const bannerText = (() => {
    return '' // TODO: ENABLE THIS. temporary hidden, requested by Sarah
    if (!isTrial && isExpiringSoon) {
      return `Your subscription ends in ${daysLeft} days, update your plan to avoid losing access`
    }

    if (!paymentMethodAdded && isTrial && trialExpiringSoon) {
      return `Your trial ends in ${trialDaysLeft} days, and there is no payment method on file`
    }

    if (subEnded) {
      return 'Your subscription has expired. Update your plan now to avoid losing access.'
    }

    if (!expiresAt && trialEnded) {
      return 'Your trial has expired. To avoid losing access, please add a payment method.'
    }

    return ''
  })()

  return { bannerText }
}
