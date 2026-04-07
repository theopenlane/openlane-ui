import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { VendorScoringConfigsWithFilterQuery, VendorScoringConfigsWithFilterQueryVariables, CreateVendorScoringConfigMutation, CreateVendorScoringConfigMutationVariables, UpdateVendorScoringConfigMutation, UpdateVendorScoringConfigMutationVariables, DeleteVendorScoringConfigMutation, DeleteVendorScoringConfigMutationVariables, VendorScoringConfigQuery, VendorScoringConfigQueryVariables, CreateBulkCsvVendorScoringConfigMutation, CreateBulkCsvVendorScoringConfigMutationVariables, UpdateBulkVendorScoringConfigMutation, UpdateBulkVendorScoringConfigMutationVariables, DeleteBulkVendorScoringConfigMutation, DeleteBulkVendorScoringConfigMutationVariables } from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_VENDOR_SCORING_CONFIGS, CREATE_VENDOR_SCORING_CONFIG, UPDATE_VENDOR_SCORING_CONFIG, DELETE_VENDOR_SCORING_CONFIG, VENDOR_SCORING_CONFIG, CREATE_CSV_BULK_VENDOR_SCORING_CONFIG, BULK_EDIT_VENDOR_SCORING_CONFIG, BULK_DELETE_VENDOR_SCORING_CONFIG } from '@repo/codegen/query/vendor-scoring-config'


    type GetAllVendorScoringConfigsArgs = {
      where?: VendorScoringConfigsWithFilterQueryVariables['where']
      orderBy?: VendorScoringConfigsWithFilterQueryVariables['orderBy']
      pagination?: TPagination
      enabled?: boolean
    }
    

export type VendorScoringConfigsNode = NonNullable<NonNullable<NonNullable<VendorScoringConfigsWithFilterQuery['vendorScoringConfigs']>['edges']>[number]>['node']

export type VendorScoringConfigsNodeNonNull = NonNullable<VendorScoringConfigsNode>

export const useVendorScoringConfigsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllVendorScoringConfigsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<VendorScoringConfigsWithFilterQuery, unknown>({
    queryKey: ['vendorScoringConfigs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<VendorScoringConfigsWithFilterQuery> => {
      const result = await client.request<VendorScoringConfigsWithFilterQuery>(GET_ALL_VENDOR_SCORING_CONFIGS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.vendorScoringConfigs?.edges ?? []

  const vendorScoringConfigsNodes: VendorScoringConfigsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as VendorScoringConfigsNodeNonNull)

  return { ...queryResult, vendorScoringConfigsNodes }
}


export const useCreateVendorScoringConfig = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateVendorScoringConfigMutation, unknown, CreateVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_VENDOR_SCORING_CONFIG, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}


export const useUpdateVendorScoringConfig = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateVendorScoringConfigMutation, unknown, UpdateVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_VENDOR_SCORING_CONFIG, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}


export const useDeleteVendorScoringConfig = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteVendorScoringConfigMutation, unknown, DeleteVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_VENDOR_SCORING_CONFIG, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}


export const useVendorScoringConfig = (vendorScoringConfigId?: VendorScoringConfigQueryVariables['vendorScoringConfigId']) => {
  const { client } = useGraphQLClient()
  return useQuery<VendorScoringConfigQuery, unknown>({
    queryKey: ['vendorScoringConfigs', vendorScoringConfigId],
    queryFn: async (): Promise<VendorScoringConfigQuery> => {
      const result = await client.request(VENDOR_SCORING_CONFIG, { vendorScoringConfigId })
      return result as VendorScoringConfigQuery
    },
    enabled: !!vendorScoringConfigId,
  })
}


export const useCreateBulkCSVVendorScoringConfig = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvVendorScoringConfigMutation, unknown, CreateBulkCsvVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_VENDOR_SCORING_CONFIG, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}


export const useBulkEditVendorScoringConfig = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkVendorScoringConfigMutation, unknown, UpdateBulkVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_VENDOR_SCORING_CONFIG, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}


export const useBulkDeleteVendorScoringConfig = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkVendorScoringConfigMutation, unknown, DeleteBulkVendorScoringConfigMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_VENDOR_SCORING_CONFIG, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorScoringConfigs'] })
    },
  })
}

