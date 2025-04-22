import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { parseISO, differenceInDays, isValid } from 'date-fns'
import { useOrganization } from '@/hooks/useOrganization'

export function useSubscriptionBanner() {
  const { currentOrgId } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)

  const subscription = data?.organization?.orgSubscriptions?.[0]
  const expiresAt = subscription?.expiresAt
  const stripeStatus = subscription?.stripeSubscriptionStatus
  const paymentMethodAdded = subscription?.paymentMethodAdded

  const daysLeft = expiresAt && isValid(parseISO(expiresAt)) ? differenceInDays(parseISO(expiresAt), new Date()) : null

  const isTrial = stripeStatus === 'trialing'
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7

  let bannerText = ''

  if (isTrial && !paymentMethodAdded && isExpiringSoon) {
    bannerText = 'Your 30-day free trial ends soon, and there is no payment method on file'
  } else if (!isTrial && isExpiringSoon) {
    bannerText = 'Your subscription ends soon, and there is no payment method on file'
  }

  return {
    bannerText,
  }
}
