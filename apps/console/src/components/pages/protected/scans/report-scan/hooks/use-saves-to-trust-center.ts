'use client'

import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { useHasModule } from '@/lib/subscription-plan/hooks/use-module-access'

export const useSavesToTrustCenter = () => {
  const hasTrustCenterModule = useHasModule(PlanEnum.TRUST_CENTER_MODULE)
  const { trustCenter } = useGetTrustCenter()
  return hasTrustCenterModule && !!trustCenter
}
