import { useQuery } from '@tanstack/react-query'
import { GET_CONTROL_COUNT } from '@repo/codegen/query/control'
import { GET_TRUST_CENTER_COMPLIANCE_COUNT } from '@repo/codegen/query/trust-center-compliance'
import {
  ControlControlStatus,
  type ControlWhereInput,
  type GetControlCountQuery,
  type GetControlCountQueryVariables,
  type GetTrustCenterComplianceCountQuery,
  type GetTrustCenterComplianceCountQueryVariables,
  type TrustCenterComplianceWhereInput,
} from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { ORG_MANAGED_CONTROLS_WHERE } from '@/constants/standards'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-category-names'

const IMPLEMENTED_SOC_2_CONTROLS_WHERE: ControlWhereInput = {
  and: [ORG_MANAGED_CONTROLS_WHERE, { referenceFrameworkEqualFold: SOC_2_FRAMEWORK_NAME }, { statusNEQ: ControlControlStatus.NOT_IMPLEMENTED }],
}

const SOC_2_TRUST_CENTER_COMPLIANCE_WHERE: TrustCenterComplianceWhereInput = {
  hasStandardWith: [{ shortNameEqualFold: SOC_2_FRAMEWORK_NAME }],
}

export const useSocBadgeAvailability = () => {
  const { client } = useGraphQLClient()
  const { hasObjectType, isLoading: isLoadingModules } = useModuleAccess()
  const includeControls = !isLoadingModules && hasObjectType(ObjectTypes.CONTROL)
  const includeTrustCenter = !isLoadingModules && hasObjectType(ObjectTypes.TRUST_CENTER_COMPLIANCE)

  const controls = useQuery<GetControlCountQuery>({
    queryKey: ['controls', 'count', IMPLEMENTED_SOC_2_CONTROLS_WHERE],
    queryFn: () => client.request<GetControlCountQuery, GetControlCountQueryVariables>(GET_CONTROL_COUNT, { where: IMPLEMENTED_SOC_2_CONTROLS_WHERE }),
    enabled: includeControls,
  })

  const compliances = useQuery<GetTrustCenterComplianceCountQuery>({
    queryKey: ['trustCenter', 'compliances', 'count', SOC_2_TRUST_CENTER_COMPLIANCE_WHERE],
    queryFn: () => client.request<GetTrustCenterComplianceCountQuery, GetTrustCenterComplianceCountQueryVariables>(GET_TRUST_CENTER_COMPLIANCE_COUNT, { where: SOC_2_TRUST_CENTER_COMPLIANCE_WHERE }),
    enabled: includeTrustCenter,
  })

  const isControlsLoading = includeControls && (controls.isPending || controls.isPlaceholderData)
  const isCompliancesLoading = includeTrustCenter && (compliances.isPending || compliances.isPlaceholderData)
  const hasImplementedControls = includeControls && !controls.isPlaceholderData && (controls.data?.controls.totalCount ?? 0) > 0
  const hasTrustCenterCompliance = includeTrustCenter && !compliances.isPlaceholderData && (compliances.data?.trustCenterCompliances.totalCount ?? 0) > 0
  const isAvailable = hasImplementedControls || hasTrustCenterCompliance
  const error = (includeControls ? controls.error : null) ?? (includeTrustCenter ? compliances.error : null)

  return {
    isAvailable,
    isPending: !isAvailable && (isLoadingModules || isControlsLoading || isCompliancesLoading),
    isError: !isAvailable && !!error,
    error: isAvailable ? null : error,
  }
}
