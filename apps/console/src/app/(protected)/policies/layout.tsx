import { ObjectTypes } from '@repo/codegen/src/type-names'
import { featureGatedLayout } from '@/lib/subscription-plan/feature-gate'

export default featureGatedLayout(ObjectTypes.INTERNAL_POLICY)
