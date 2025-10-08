import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'

export default function ControlsLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature={FeatureEnum.CONTROLS} module={PlanEnum.COMPLIANCE_MODULE}>
      {children}
    </FeatureGate>
  )
}
