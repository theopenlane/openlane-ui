'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { featureUtil } from '@/lib/subscription-plan/plans'

export const useModuleAccess = () => {
  const { data: session, status } = useSession()

  const hasModule = useCallback((module: PlanEnum) => featureUtil.hasModule(session?.user?.modules ?? [], module, session), [session])

  return { hasModule, isLoading: status === 'loading' }
}
