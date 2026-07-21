import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'

export const useOrgSetupProgress = () => {
  const { currentOrgId } = useOrganization()
  const { data: settingData, isLoading: isSettingLoading } = useGetOrganizationSetting(currentOrgId)
  const { data: membersData, isLoading: isMembersLoading } = useGetSingleOrganizationMembers({ organizationId: currentOrgId })
  const { data: integrationsData, isLoading: isIntegrationsLoading } = useGetIntegrations({})

  const isSSOConfigured = !!settingData?.organization?.setting?.identityProvider && settingData.organization.setting.identityProvider !== 'NONE'
  const memberCount = membersData?.organization?.members?.totalCount ?? 0
  const hasMultipleMembers = memberCount > 1
  const hasIntegrations = (integrationsData?.integrations?.edges?.length ?? 0) > 0

  return {
    isSSOConfigured,
    hasMultipleMembers,
    hasIntegrations,
    isSetupComplete: isSSOConfigured && hasMultipleMembers && hasIntegrations,
    isLoading: isSettingLoading || isMembersLoading || isIntegrationsLoading,
  }
}
