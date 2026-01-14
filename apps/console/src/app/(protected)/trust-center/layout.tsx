import { FeatureEnum } from '@/lib/subscription-plan/feature-enum'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'
import TrustCenter from '@/components/pages/protected/trust-center/trust-center'

export default function EntitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature={FeatureEnum.TRUST_CENTER} module={PlanEnum.TRUST_CENTER_MODULE}>
      <TrustCenter>{children}</TrustCenter>
    </FeatureGate>
  )
}
