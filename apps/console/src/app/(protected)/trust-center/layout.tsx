import { ObjectTypes } from '@repo/codegen/src/type-names'
import { FeatureGate } from '@/lib/subscription-plan/feature-gate'
import TrustCenter from '@/components/pages/protected/trust-center/trust-center'

const TrustCenterLayout = ({ children }: { children: React.ReactNode }) => (
  <FeatureGate objectType={ObjectTypes.TRUST_CENTER}>
    <TrustCenter>{children}</TrustCenter>
  </FeatureGate>
)

export default TrustCenterLayout
