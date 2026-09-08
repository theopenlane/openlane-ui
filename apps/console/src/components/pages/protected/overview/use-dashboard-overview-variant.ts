'use client'

import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'

export type TDashboardOverviewVariant = 'compliance' | 'trust-center'

export const useDashboardOverviewVariant = (): TDashboardOverviewVariant | undefined => {
  const { hasModule, isLoading } = useModuleAccess()

  if (isLoading) {
    return undefined
  }

  return !hasModule(PlanEnum.COMPLIANCE_MODULE) && hasModule(PlanEnum.TRUST_CENTER_MODULE) ? 'trust-center' : 'compliance'
}
