import { auth } from '@/lib/auth/auth'
import { featureUtil } from '../plans'
import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'

export async function hasFeature(feature: FeatureEnum): Promise<boolean> {
  const session = await auth()
  if (!session) {
    return false
  }

  const modules = session.user?.modules ?? []
  return modules.some((module: PlanEnum) => featureUtil.planHasFeature(module, feature))
}
