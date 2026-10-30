import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type RemediationsWithFilterQuery,
  type RemediationsWithFilterQueryVariables,
  type CreateRemediationMutation,
  type CreateRemediationMutationVariables,
  type UpdateRemediationMutation,
  type UpdateRemediationMutationVariables,
  type DeleteRemediationMutation,
  type DeleteRemediationMutationVariables,
  type RemediationQuery,
  type RemediationQueryVariables,
  type CreateBulkCsvRemediationMutation,
  type CreateBulkCsvRemediationMutationVariables,
  type UpdateBulkRemediationMutation,
  type UpdateBulkRemediationMutationVariables,
  type DeleteBulkRemediationMutation,
  type DeleteBulkRemediationMutationVariables,
  type GetRemediationAssociationsQuery,
  type GetRemediationFilesPaginatedQuery,
  type GetRemediationContextSubjectQuery,
  type GetRemediationContextOptionsQuery,
  type GetRemediationContextOptionsQueryVariables,
  type GetRemediationFileIdsQuery,
  type FileOrder,
  type InputMaybe,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_REMEDIATIONS,
  CREATE_REMEDIATION,
  UPDATE_REMEDIATION,
  DELETE_REMEDIATION,
  REMEDIATION,
  CREATE_CSV_BULK_REMEDIATION,
  BULK_EDIT_REMEDIATION,
  BULK_DELETE_REMEDIATION,
  GET_REMEDIATION_ASSOCIATIONS,
  GET_REMEDIATION_FILES_PAGINATED,
  GET_REMEDIATION_CONTEXT_SUBJECT,
  GET_REMEDIATION_CONTEXT_OPTIONS,
  GET_REMEDIATION_FILE_IDS,
} from '@repo/codegen/query/remediation'
import { invalidateCreateEdgeTargets } from '@/components/shared/object-association/object-association-config'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'

type GetAllRemediationsArgs = {
  where?: RemediationsWithFilterQueryVariables['where']
  orderBy?: RemediationsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type RemediationsNode = NonNullable<NonNullable<NonNullable<RemediationsWithFilterQuery['remediations']>['edges']>[number]>['node']

export type RemediationsNodeNonNull = NonNullable<RemediationsNode>

export const useRemediationsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllRemediationsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<RemediationsWithFilterQuery, unknown>({
    queryKey: ['remediations', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<RemediationsWithFilterQuery> => {
      const result = await client.request<RemediationsWithFilterQuery>(GET_ALL_REMEDIATIONS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.remediations?.edges ?? []

  const remediationsNodes: RemediationsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as RemediationsNodeNonNull)

  return { ...queryResult, remediationsNodes }
}

export const useCreateRemediation = () => {
  const queryClient = useQueryClient()
  return useMutation<CreateRemediationMutation, unknown, CreateRemediationMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_REMEDIATION, variables }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
      invalidateCreateEdgeTargets(variables.input, queryClient)
      if (variables.remediationFiles?.length) {
        queryClient.invalidateQueries({ queryKey: ['getFiles'] })
      }
    },
  })
}

export const useUpdateRemediation = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateRemediationMutation, unknown, UpdateRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useUploadRemediationFiles = () => {
  const queryClient = useQueryClient()
  return useMutation<UpdateRemediationMutation, unknown, UpdateRemediationMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_REMEDIATION, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
      queryClient.invalidateQueries({ queryKey: ['getFiles'] })
    },
  })
}

export const useDeleteRemediation = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteRemediationMutation, unknown, DeleteRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useCreateBulkCSVRemediation = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvRemediationMutation, unknown, CreateBulkCsvRemediationMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_REMEDIATION, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useBulkEditRemediation = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkRemediationMutation, unknown, UpdateBulkRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useBulkDeleteRemediation = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkRemediationMutation, unknown, DeleteBulkRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useRemediation = (remediationId?: RemediationQueryVariables['remediationId']) => {
  const { client } = useGraphQLClient()
  return useQuery<RemediationQuery, unknown>({
    queryKey: ['remediations', remediationId],
    queryFn: async (): Promise<RemediationQuery> => {
      const result = await client.request(REMEDIATION, { remediationId })
      return result as RemediationQuery
    },
    enabled: !!remediationId,
  })
}

export const useGetRemediationAssociations = (remediationId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetRemediationAssociationsQuery, unknown>({
    queryKey: ['remediations', remediationId, 'associations'],
    queryFn: async () => client.request<GetRemediationAssociationsQuery>(GET_REMEDIATION_ASSOCIATIONS, { remediationId: remediationId as string }),
    enabled: !!remediationId,
  })
}

type RemediationFilesPaginationArgs = {
  remediationId?: string | null
  orderBy?: InputMaybe<Array<FileOrder> | FileOrder>
  pagination?: TPagination
}

export const useGetRemediationFilesPaginated = ({ remediationId, orderBy, pagination }: RemediationFilesPaginationArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetRemediationFilesPaginatedQuery, unknown>({
    queryKey: ['remediations', remediationId, 'files', orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () => client.request(GET_REMEDIATION_FILES_PAGINATED, { remediationId, orderBy, ...pagination?.query }),
    enabled: !!remediationId,
  })

  const files = queryResult.data?.remediation?.files

  return { ...queryResult, files: getNodes(files), pageInfo: files?.pageInfo, totalCount: files?.totalCount }
}

export const REMEDIATION_CONTEXT_TYPES = [ObjectAssociationNodeEnum.VULNERABILITY, ObjectAssociationNodeEnum.FINDING, ObjectAssociationNodeEnum.RISKS] as const

export type TRemediationContextType = (typeof REMEDIATION_CONTEXT_TYPES)[number]

export const useRemediationContextSubject = (type?: TRemediationContextType, id?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetRemediationContextSubjectQuery, unknown>({
    queryKey: [type, id, 'remediationContext'],
    queryFn: async () =>
      client.request(GET_REMEDIATION_CONTEXT_SUBJECT, {
        id,
        withVulnerability: type === ObjectAssociationNodeEnum.VULNERABILITY,
        withFinding: type === ObjectAssociationNodeEnum.FINDING,
        withRisk: type === ObjectAssociationNodeEnum.RISKS,
      }),
    enabled: !!type && !!id,
  })
}

type RemediationContextOptionsArgs = {
  type?: TRemediationContextType
  searchTerm: string
  enabled: boolean
}

export const useRemediationContextOptions = ({ type, searchTerm, enabled }: RemediationContextOptionsArgs) => {
  const { client } = useGraphQLClient()
  const term = searchTerm || undefined
  const variables: GetRemediationContextOptionsQueryVariables = {
    withVulnerabilities: type === ObjectAssociationNodeEnum.VULNERABILITY,
    withFindings: type === ObjectAssociationNodeEnum.FINDING,
    withRisks: type === ObjectAssociationNodeEnum.RISKS,
    vulnerabilityWhere: term ? { or: [{ displayNameContainsFold: term }, { cveIDContainsFold: term }, { externalIDContainsFold: term }, { displayIDContainsFold: term }] } : undefined,
    findingWhere: term ? { or: [{ displayNameContainsFold: term }, { displayIDContainsFold: term }] } : undefined,
    riskWhere: term ? { or: [{ nameContainsFold: term }, { displayIDContainsFold: term }] } : undefined,
  }

  return useQuery<GetRemediationContextOptionsQuery, unknown>({
    queryKey: [type, 'remediationContextOptions', variables],
    queryFn: async () => client.request(GET_REMEDIATION_CONTEXT_OPTIONS, variables),
    enabled: !!type && enabled,
  })
}

const remediationFileIdsKey = (remediationId: string) => ['remediations', remediationId, 'files', 'ids']

const useRemediationFileIdsQueryFn = () => {
  const { client } = useGraphQLClient()
  return useCallback(
    async (remediationId: string) =>
      (
        await fetchAllConnectionNodes(async (after) => {
          const { remediation } = await client.request<GetRemediationFileIdsQuery>(GET_REMEDIATION_FILE_IDS, { remediationId, first: MAX_CONNECTION_RESULTS, after })
          return remediation?.files
        })
      ).map((file) => file.id),
    [client],
  )
}

export const useRemediationFileIds = (remediationId: string) => {
  const queryFn = useRemediationFileIdsQueryFn()
  return useQuery({
    queryKey: remediationFileIdsKey(remediationId),
    queryFn: () => queryFn(remediationId),
    placeholderData: undefined,
  })
}

export const useFilterUnlinkedRemediationFiles = () => {
  const queryClient = useQueryClient()
  const queryFn = useRemediationFileIdsQueryFn()
  return useCallback(
    async (remediationId: string, fileIds: string[]): Promise<string[]> => {
      if (fileIds.length === 0) return fileIds
      const linked = new Set(await queryClient.fetchQuery({ queryKey: remediationFileIdsKey(remediationId), queryFn: () => queryFn(remediationId), staleTime: 0 }))
      return fileIds.filter((id) => !linked.has(id))
    },
    [queryClient, queryFn],
  )
}
