import RequiredSubscription from '@/components/pages/protected/subscription/required-subscription'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { hasFeature } from '@/lib/subscription-plan/hooks/use-access-control.ts'

interface FeatureGateProps {
  objectType: ObjectTypes
  children: React.ReactNode
}

export const FeatureGate = async ({ objectType, children }: FeatureGateProps) => {
  const hasFeatureAccess = await hasFeature(objectType)
  if (!hasFeatureAccess) {
    return <RequiredSubscription module={featureUtil.getUpgradeModules(objectType)} />
  }

  return <>{children}</>
}

export const featureGatedLayout = (objectType: ObjectTypes) => {
  const FeatureGatedLayout = ({ children }: { children: React.ReactNode }) => <FeatureGate objectType={objectType}>{children}</FeatureGate>
  FeatureGatedLayout.displayName = `FeatureGatedLayout(${objectType})`
  return FeatureGatedLayout
}
