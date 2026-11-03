import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type OrganizationBrandingSettingsWithFilterQuery,
  type OrganizationBrandingSettingsWithFilterQueryVariables,
  type CreateOrganizationBrandingSettingMutation,
  type CreateOrganizationBrandingSettingMutationVariables,
  type UpdateOrganizationBrandingSettingMutation,
  type UpdateOrganizationBrandingSettingMutationVariables,
  type DeleteOrganizationBrandingSettingMutation,
  type DeleteOrganizationBrandingSettingMutationVariables,
  type OrganizationBrandingSettingQuery,
  type OrganizationBrandingSettingQueryVariables,
  type CreateBulkCsvOrganizationBrandingSettingMutation,
  type CreateBulkCsvOrganizationBrandingSettingMutationVariables,
  type UpdateBulkOrganizationBrandingSettingMutation,
  type UpdateBulkOrganizationBrandingSettingMutationVariables,
  type DeleteBulkOrganizationBrandingSettingMutation,
  type DeleteBulkOrganizationBrandingSettingMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_ORGANIZATION_BRANDING_SETTINGS,
  CREATE_ORGANIZATION_BRANDING_SETTING,
  UPDATE_ORGANIZATION_BRANDING_SETTING,
  DELETE_ORGANIZATION_BRANDING_SETTING,
  ORGANIZATION_BRANDING_SETTING,
  CREATE_CSV_BULK_ORGANIZATION_BRANDING_SETTING,
  BULK_EDIT_ORGANIZATION_BRANDING_SETTING,
  BULK_DELETE_ORGANIZATION_BRANDING_SETTING,
} from '@repo/codegen/query/organization-branding-setting'

type GetAllOrganizationBrandingSettingsArgs = {
  where?: OrganizationBrandingSettingsWithFilterQueryVariables['where']
  orderBy?: OrganizationBrandingSettingsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type OrganizationBrandingSettingsNode = NonNullable<NonNullable<NonNullable<OrganizationBrandingSettingsWithFilterQuery['organizationBrandingSettings']>['edges']>[number]>['node']

export type OrganizationBrandingSettingsNodeNonNull = NonNullable<OrganizationBrandingSettingsNode>

export const useOrganizationBrandingSettingsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllOrganizationBrandingSettingsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<OrganizationBrandingSettingsWithFilterQuery, unknown>({
    queryKey: ['organizationBrandingSettings', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<OrganizationBrandingSettingsWithFilterQuery> => {
      const result = await client.request<OrganizationBrandingSettingsWithFilterQuery>(GET_ALL_ORGANIZATION_BRANDING_SETTINGS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.organizationBrandingSettings?.edges ?? []

  const organizationBrandingSettingsNodes: OrganizationBrandingSettingsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as OrganizationBrandingSettingsNodeNonNull)

  return { ...queryResult, organizationBrandingSettingsNodes }
}

export const useCreateOrganizationBrandingSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateOrganizationBrandingSettingMutation, unknown, CreateOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ORGANIZATION_BRANDING_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}

export const useUpdateOrganizationBrandingSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateOrganizationBrandingSettingMutation, unknown, UpdateOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ORGANIZATION_BRANDING_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}

export const useDeleteOrganizationBrandingSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteOrganizationBrandingSettingMutation, unknown, DeleteOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ORGANIZATION_BRANDING_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}

export const useOrganizationBrandingSetting = (organizationBrandingSettingId?: OrganizationBrandingSettingQueryVariables['organizationBrandingSettingId']) => {
  const { client } = useGraphQLClient()
  return useQuery<OrganizationBrandingSettingQuery, unknown>({
    queryKey: ['organizationBrandingSettings', organizationBrandingSettingId],
    queryFn: async (): Promise<OrganizationBrandingSettingQuery> => {
      const result = await client.request(ORGANIZATION_BRANDING_SETTING, { organizationBrandingSettingId })
      return result as OrganizationBrandingSettingQuery
    },
    enabled: !!organizationBrandingSettingId,
  })
}

export const useCreateBulkCSVOrganizationBrandingSetting = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvOrganizationBrandingSettingMutation, unknown, CreateBulkCsvOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_ORGANIZATION_BRANDING_SETTING, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}

export const useBulkEditOrganizationBrandingSetting = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkOrganizationBrandingSettingMutation, unknown, UpdateBulkOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_ORGANIZATION_BRANDING_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}

export const useBulkDeleteOrganizationBrandingSetting = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkOrganizationBrandingSettingMutation, unknown, DeleteBulkOrganizationBrandingSettingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_ORGANIZATION_BRANDING_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationBrandingSettings'] })
    },
  })
}
