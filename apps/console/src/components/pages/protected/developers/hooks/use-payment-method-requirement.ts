import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { paymentMethodBypassEmailDomains } from '@repo/dally/auth'
import { useGetOrganizationPaymentMethods } from '@/lib/graphql-hooks/organization'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { isImpersonation } from '@/lib/authz/utils'
import { arePlanChecksDisabled } from '@/lib/subscription-plan/plans'
import { getEmailDomain } from '@/utils/strings'

const ACTIVE_SUBSCRIPTION_STATUS = 'active'

const isBypassedEmail = (email?: string | null) => {
  const domain = getEmailDomain(email)
  return !!domain && paymentMethodBypassEmailDomains.includes(domain)
}

export const usePaymentMethodRequirement = ({ enabled }: { enabled: boolean }) => {
  const { data: session } = useSession()
  const currentOrgId = session?.user?.activeOrganizationId
  const isEnforced = !arePlanChecksDisabled() && !isImpersonation(session) && !isBypassedEmail(session?.user?.email)
  const { data, isPending } = useGetOrganizationPaymentMethods({ enabled: enabled && isEnforced })

  const organizationsWithoutPaymentMethod = useMemo(() => {
    if (!isEnforced) return new Set<string>()

    return new Set(
      getNodes(data?.organizations)
        .filter(
          ({ setting, orgSubscriptions }) =>
            !!setting && !setting.paymentMethodAdded && !orgSubscriptions?.some(({ stripeSubscriptionStatus }) => stripeSubscriptionStatus === ACTIVE_SUBSCRIPTION_STATUS),
        )
        .map(({ id }) => id),
    )
  }, [isEnforced, data])

  return {
    organizationsWithoutPaymentMethod,
    isCurrentOrgMissingPaymentMethod: !!currentOrgId && organizationsWithoutPaymentMethod.has(currentOrgId),
    isLoadingPaymentMethods: isEnforced && isPending,
  }
}
