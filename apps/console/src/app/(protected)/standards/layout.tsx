import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'

export default function StandardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature={FeatureEnum.STANDARDS} module={PlanEnum.COMPLIANCE_MODULE}>
      {children}
    </FeatureGate>
  )
}
