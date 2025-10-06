import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'

export default function EntitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature={FeatureEnum.ENTITIES} module={PlanEnum.COMPLIANCE_MODULE}>
      {children}
    </FeatureGate>
  )
}
