import { useSession } from 'next-auth/react'
import { featureUtil } from '../plans'
import { FeatureEnum } from '@/lib/subscription-plan/feature-enum.ts'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'

export const useAccessControl = () => {
  const { data: session } = useSession()

  return {
    hasFeature: (feature: FeatureEnum) => {
      const modules = session?.user?.modules ?? []
      return modules.some((module: PlanEnum) => featureUtil.planHasFeature(module, feature))
    },
  }
}
