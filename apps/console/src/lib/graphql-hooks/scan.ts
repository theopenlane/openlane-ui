import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Scan,
  ScanQuery,
  ScanQueryVariables,
  ScansWithFilterQuery,
  ScansWithFilterQueryVariables,
  CreateScanMutation,
  CreateScanMutationVariables,
  CreateBulkCsvScanMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteScanMutation,
  DeleteScanMutationVariables,
  DeleteBulkScanMutation,
  DeleteBulkScanMutationVariables,
  UpdateScanMutation,
  UpdateScanMutationVariables,
  UpdateBulkScanMutation,
  UpdateBulkScanMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { SCAN, GET_ALL_SCANS, BULK_DELETE_SCAN, CREATE_SCAN, CREATE_CSV_BULK_SCAN, DELETE_SCAN, UPDATE_SCAN, BULK_EDIT_SCAN } from '@repo/codegen/query/scan'

type GetAllScansArgs = {
  where?: ScansWithFilterQueryVariables['where']
  orderBy?: ScansWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useScansWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllScansArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ScansWithFilterQuery, unknown>({
    queryKey: ['scans', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ScansWithFilterQuery> => {
      const result = await client.request(GET_ALL_SCANS, { where, orderBy, ...pagination?.query })
      return result as ScansWithFilterQuery
    },
    enabled,
  })

  const Scans = (queryResult.data?.scans?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Scan[]

  return { ...queryResult, Scans }
}

export const useCreateScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateScanMutation, unknown, CreateScanMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useUpdateScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateScanMutation, unknown, UpdateScanMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useDeleteScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteScanMutation, unknown, DeleteScanMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useScan = (scanId?: ScanQueryVariables['scanId']) => {
  const { client } = useGraphQLClient()

  return useQuery<ScanQuery, unknown>({
    queryKey: ['scans', scanId],
    queryFn: async (): Promise<ScanQuery> => {
      const result = await client.request(SCAN, { scanId })
      return result as ScanQuery
    },
    enabled: !!scanId,
  })
}

export const useCreateBulkCSVScan = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvScanMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_SCAN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useBulkEditScan = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkScanMutation, unknown, UpdateBulkScanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useBulkDeleteScan = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkScanMutation, unknown, DeleteBulkScanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}
