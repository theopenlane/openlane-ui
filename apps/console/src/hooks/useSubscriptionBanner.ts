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
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7

  const bannerText = (() => {
    if (isTrial && !paymentMethodAdded && trialDaysLeft !== null && trialDaysLeft <= 7) {
      return `Your trial ends in ${trialDaysLeft} days, and there is no payment method on file`
    }

    if (!isTrial && isExpiringSoon) {
      return `Your subscription ends in ${daysLeft} days, update your plan to avoid losing access`
    }

    return ''
  })()

  return { bannerText }
}
