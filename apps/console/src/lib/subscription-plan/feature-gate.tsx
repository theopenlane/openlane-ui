import RequiredSubscription from '@/components/pages/protected/subscription/required-subscription'
import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { hasFeature } from '@/lib/subscription-plan/hooks/use-access-control.ts'

interface FeatureGateProps {
  feature: FeatureEnum
  module: PlanEnum
  children: React.ReactNode
}

export async function FeatureGate({ feature, module, children }: FeatureGateProps) {
  const hasFeatureAccess = await hasFeature(feature)
  if (!hasFeatureAccess) {
    return <RequiredSubscription module={module} />
  }

  return <>{children}</>
}
