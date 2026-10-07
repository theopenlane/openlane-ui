import { useCallback, useMemo } from 'react'
import type { GraphQLClient } from 'graphql-request'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_ASSESSMENT_TEMPLATE,
  CREATE_ASSESSMENT_WITH_POLICIES,
  CREATE_BULK_ASSESSMENT_POLICY,
  DELETE_BULK_ASSESSMENT_POLICY,
  GET_ASSESSMENT_POLICY_ATTESTATIONS,
  GET_POLICY_ACKNOWLEDGEMENTS,
  GET_POLICY_ACKNOWLEDGEMENT_COUNT,
  GET_ASSESSMENT_RESPONSES_PAGE,
  GET_ASSESSMENT_JSONCONFIG,
  UPDATE_ASSESSMENT,
  GET_ALL_ASSESSMENTS,
  GET_ASSESSMENT,
  GET_ASSESSMENT_ACCESS_URL,
  GET_ASSESSMENT_DETAIL,
  GET_ASSESSMENT_RESPONSES_TOTAL_COUNT,
  DELETE_ASSESSMENT,
  DELETE_BULK_ASSESSMENT,
} from '@repo/codegen/query/assessment'

import {
  type CreateAssessmentWithPoliciesMutation,
  type CreateAssessmentWithPoliciesMutationVariables,
  type CreateAssessmentInput,
  type CreateBulkAssessmentPolicyMutation,
  type CreateBulkAssessmentPolicyMutationVariables,
  type DeleteBulkAssessmentPolicyMutation,
  type DeleteBulkAssessmentPolicyMutationVariables,
  type GetAssessmentPolicyAttestationsQuery,
  type GetAssessmentPolicyAttestationsQueryVariables,
  type GetPolicyAcknowledgementsQuery,
  type GetPolicyAcknowledgementsQueryVariables,
  type GetPolicyAcknowledgementCountQuery,
  type GetPolicyAcknowledgementCountQueryVariables,
  type GetAssessmentResponsesPageQuery,
  type GetAssessmentResponsesPageQueryVariables,
  type GetAssessmentJsonconfigQuery,
  type GetAssessmentJsonconfigQueryVariables,
  type UpdateAssessmentMutation,
  type UpdateAssessmentMutationVariables,
  type FilterAssessmentsQuery,
  type FilterAssessmentsQueryVariables,
  type GetAssessmentQuery,
  type GetAssessmentQueryVariables,
  type GetAssessmentAccessUrlQuery,
  type GetAssessmentAccessUrlQueryVariables,
  type GetAssessmentDetailQuery,
  type GetAssessmentDetailQueryVariables,
  type GetAssessmentResponsesTotalCountQuery,
  type GetAssessmentResponsesTotalCountQueryVariables,
  type DeleteAssessmentMutation,
  type DeleteAssessmentMutationVariables,
  type Assessment,
  AssessmentResponseAssessmentResponseStatus,
  type DeleteBulkAssessmentMutation,
  type DeleteBulkAssessmentMutationVariables,
  type AssessmentResponseOrder,
  type AssessmentResponseWhereInput,
  type AssessmentTemplateCreatePayload,
  type MutationCreateAssessmentTemplateArgs,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getSurveyPolicySources } from '@/components/shared/survey/pdf-document/pdf-document-type'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

type CreateAssessmentTemplateMutationVariables = MutationCreateAssessmentTemplateArgs

type CreateAssessmentTemplateMutation = {
  createAssessmentTemplate: {
    template: Pick<AssessmentTemplateCreatePayload['template'], 'id' | 'name' | 'description' | 'tags'>
  }
}

export const EXCLUDE_TEST_RESPONSES = { isTest: false } as const satisfies AssessmentResponseWhereInput
type UseAssessmentsArgs = {
  where?: FilterAssessmentsQueryVariables['where']
  orderBy?: FilterAssessmentsQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useAssessments = ({ where, orderBy, pagination, enabled = true }: UseAssessmentsArgs) => {
  const { client } = useGraphQLClient()
  const resolvedPagination = useMemo<TPagination>(
    () =>
      pagination ?? {
        page: 1,
        pageSize: 5,
        query: {
          first: 5,
        },
      },
    [pagination],
  )

  const queryResult = useQuery<FilterAssessmentsQuery>({
    queryKey: ['assessments', where, orderBy, resolvedPagination.pageSize, resolvedPagination.page],
    queryFn: () =>
      client.request(GET_ALL_ASSESSMENTS, {
        where,
        orderBy,
        ...resolvedPagination.query,
      }),
    enabled,
  })

  const assessments = useMemo(() => (queryResult.data?.assessments?.edges ?? []).map((edge) => edge?.node) as unknown as Assessment[], [queryResult.data?.assessments?.edges])

  const paginationMeta = useMemo(
    () => ({
      totalCount: queryResult.data?.assessments?.totalCount ?? 0,
      pageInfo: queryResult.data?.assessments?.pageInfo,
      isLoading: queryResult.isPending,
    }),
    [queryResult.data?.assessments?.totalCount, queryResult.data?.assessments?.pageInfo, queryResult.isPending],
  )

  return {
    ...queryResult,
    assessments,
    paginationMeta,
    isLoading: queryResult.isPending,
  }
}

export const useAssessmentSelect = ({ where }: { where?: FilterAssessmentsQueryVariables['where'] }) => {
  const selectPagination = useMemo<TPagination>(
    () => ({
      page: 1,
      pageSize: 100,
      query: {
        first: 100,
      },
    }),
    [],
  )
  const { assessments, ...rest } = useAssessments({ where, pagination: selectPagination })

  const assessmentOptions = useMemo(
    () =>
      assessments?.map((assessment) => ({
        label: assessment.name,
        value: assessment.id,
      })) ?? [],
    [assessments],
  )

  return { assessmentOptions, ...rest }
}

export const useGetAssessment = (getAssessmentId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAssessmentQuery, GetAssessmentQueryVariables>({
    queryKey: ['assessments', getAssessmentId],
    queryFn: () => client.request(GET_ASSESSMENT, { getAssessmentId }),
    enabled: !!getAssessmentId,
  })
}

export const useGenerateAssessmentAccessURL = () => {
  const { client } = useGraphQLClient()

  return useMutation<GetAssessmentAccessUrlQuery, unknown, GetAssessmentAccessUrlQueryVariables>({
    mutationFn: (variables) => client.request<GetAssessmentAccessUrlQuery, GetAssessmentAccessUrlQueryVariables>(GET_ASSESSMENT_ACCESS_URL, variables),
  })
}

type UseGetAssessmentDetailArgs = {
  id?: string
  where?: AssessmentResponseWhereInput
  orderBy?: AssessmentResponseOrder[]
  pagination?: TPagination
  enabled?: boolean
}

type GetAssessmentDetailRequestVariables = GetAssessmentDetailQueryVariables & {
  where?: AssessmentResponseWhereInput
  orderBy?: AssessmentResponseOrder[]
  first?: number
  after?: string | null
  last?: number
  before?: string | null
}

export const useGetAssessmentDetail = ({ id, where, orderBy, pagination, enabled = true }: UseGetAssessmentDetailArgs = {}) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAssessmentDetailQuery>({
    queryKey: ['assessments', id, where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetAssessmentDetailQuery, GetAssessmentDetailRequestVariables>(GET_ASSESSMENT_DETAIL, {
        getAssessmentId: id ?? '',
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled: enabled && !!id,
  })

  const assessment = queryResult.data?.assessment
  const responses = useMemo(() => getNodes(assessment?.assessmentResponses), [assessment?.assessmentResponses])
  const totalRecipients = assessment?.assessmentResponses?.totalCount ?? 0
  const hasMoreResponses = assessment?.assessmentResponses?.pageInfo?.hasNextPage ?? false
  const completedResponses = useMemo(() => responses.filter((r) => r?.status === AssessmentResponseAssessmentResponseStatus.COMPLETED).length, [responses])
  const paginationMeta = useMemo(
    () => ({
      totalCount: assessment?.assessmentResponses?.totalCount ?? 0,
      pageInfo: assessment?.assessmentResponses?.pageInfo,
      isLoading: queryResult.isPending,
    }),
    [assessment?.assessmentResponses?.totalCount, assessment?.assessmentResponses?.pageInfo, queryResult.isPending],
  )

  return {
    ...queryResult,
    assessment,
    responses,
    paginationMeta,
    totalRecipients,
    hasMoreResponses,
    completedResponses,
    isLoading: queryResult.isPending,
  }
}

const RESPONSES_PAGE_SIZE = 100
const JSONCONFIG_STALE_TIME = 5 * 60 * 1000 // 5min

const assessmentJsonconfigQuery = (client: GraphQLClient, id: string) => ({
  queryKey: ['assessmentJsonconfig', id],
  queryFn: async () => (await client.request<GetAssessmentJsonconfigQuery, GetAssessmentJsonconfigQueryVariables>(GET_ASSESSMENT_JSONCONFIG, { assessmentId: id })).assessment.jsonconfig,
  staleTime: JSONCONFIG_STALE_TIME,
})

export const useAssessmentJsonconfig = (id: string, enabled = true) => {
  const { client } = useGraphQLClient()
  return useQuery({ ...assessmentJsonconfigQuery(client, id), enabled: enabled && !!id })
}

export const useFetchAssessmentJsonconfig = () => {
  const { client, queryClient } = useGraphQLClient()
  return useCallback((id: string) => queryClient.fetchQuery(assessmentJsonconfigQuery(client, id)), [client, queryClient])
}

export const useAssessmentResponsesPage = ({
  assessmentId,
  where,
  pagination,
  enabled = true,
}: {
  assessmentId: string
  where?: AssessmentResponseWhereInput
  pagination: TPagination
  enabled?: boolean
}) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAssessmentResponsesPageQuery>({
    queryKey: ['assessments', assessmentId, 'responses', where, pagination.page, pagination.pageSize],
    queryFn: () => client.request<GetAssessmentResponsesPageQuery, GetAssessmentResponsesPageQueryVariables>(GET_ASSESSMENT_RESPONSES_PAGE, { assessmentId, where, ...pagination.query }),
    enabled: enabled && !!assessmentId,
  })

  const connection = queryResult.data?.assessment.assessmentResponses
  const responses = useMemo(() => getNodes(connection), [connection])
  const paginationMeta = useMemo(() => ({ totalCount: connection?.totalCount ?? 0, pageInfo: connection?.pageInfo, isLoading: queryResult.isPending }), [connection, queryResult.isPending])

  return { ...queryResult, responses, paginationMeta }
}

export const useFetchAllAssessmentResponses = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    (id: string, { where, withAnswers }: { where?: AssessmentResponseWhereInput; withAnswers: boolean }) =>
      fetchAllConnectionNodes(async (after) => {
        const { assessment } = await client.request<GetAssessmentResponsesPageQuery, GetAssessmentResponsesPageQueryVariables>(GET_ASSESSMENT_RESPONSES_PAGE, {
          assessmentId: id,
          where,
          first: RESPONSES_PAGE_SIZE,
          after,
          withDocument: withAnswers,
        })
        return assessment.assessmentResponses
      }),
    [client],
  )
}

export type TPolicyAcknowledgement = NonNullable<NonNullable<NonNullable<GetPolicyAcknowledgementsQuery['internalPolicy']['assessments']['edges']>[number]>['node']>

export const usePolicyAcknowledgements = ({ policyId, pagination }: { policyId: string; pagination: TPagination }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetPolicyAcknowledgementsQuery>({
    queryKey: ['assessments', 'policy-acknowledgements', policyId, pagination.page, pagination.pageSize],
    queryFn: () => client.request<GetPolicyAcknowledgementsQuery, GetPolicyAcknowledgementsQueryVariables>(GET_POLICY_ACKNOWLEDGEMENTS, { policyId, ...pagination.query }),
    enabled: !!policyId,
  })

  const connection = queryResult.data?.internalPolicy.assessments
  const acknowledgements = useMemo(() => getNodes(connection), [connection])
  const paginationMeta = useMemo(() => ({ totalCount: connection?.totalCount ?? 0, pageInfo: connection?.pageInfo, isLoading: queryResult.isPending }), [connection, queryResult.isPending])

  return { ...queryResult, acknowledgements, paginationMeta }
}

export const usePolicyAcknowledgementCount = (policyId: string) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetPolicyAcknowledgementCountQuery>({
    queryKey: ['assessments', 'policy-acknowledgement-count', policyId],
    queryFn: () => client.request<GetPolicyAcknowledgementCountQuery, GetPolicyAcknowledgementCountQueryVariables>(GET_POLICY_ACKNOWLEDGEMENT_COUNT, { policyId }),
    enabled: !!policyId,
  })

  return {
    ...queryResult,
    count: queryResult.isPlaceholderData ? 0 : (queryResult.data?.internalPolicy.assessments.totalCount ?? 0),
    isResolving: !!policyId && (queryResult.isPending || queryResult.isPlaceholderData),
  }
}

const useAssessmentResponseCount = (scope: string, id?: string, where?: AssessmentResponseWhereInput) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAssessmentResponsesTotalCountQuery>({
    queryKey: ['assessments', scope, id, where],
    queryFn: () =>
      client.request<GetAssessmentResponsesTotalCountQuery, GetAssessmentResponsesTotalCountQueryVariables>(GET_ASSESSMENT_RESPONSES_TOTAL_COUNT, {
        getAssessmentId: id ?? '',
        where,
      }),
    enabled: !!id,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.assessment?.assessmentResponses?.totalCount ?? 0,
    isLoading: queryResult.isLoading,
  }
}

export const useAssessmentRecipientsTotalCount = (id?: string) => useAssessmentResponseCount('recipients-total-count', id, EXCLUDE_TEST_RESPONSES)

const COMPLETED_NON_TEST_RESPONSES: AssessmentResponseWhereInput = { ...EXCLUDE_TEST_RESPONSES, status: AssessmentResponseAssessmentResponseStatus.COMPLETED }

export const useAssessmentResponsesTotalCount = (id?: string) => useAssessmentResponseCount('responses-total-count', id, COMPLETED_NON_TEST_RESPONSES)

export const useCreateAssessmentWithPolicies = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateAssessmentWithPoliciesMutation, unknown, CreateAssessmentInput>({
    mutationFn: (assessmentInput) =>
      client.request<CreateAssessmentWithPoliciesMutation, CreateAssessmentWithPoliciesMutationVariables>(CREATE_ASSESSMENT_WITH_POLICIES, {
        assessmentInput,
        policies: getSurveyPolicySources(assessmentInput.jsonconfig),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
}

export const useSyncAssessmentPolicies = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (assessmentId: string, jsonconfig: unknown) => {
      const desired = new Map(getSurveyPolicySources(jsonconfig).map((source) => [source.internalPolicyID, source]))
      const { assessment } = await client.request<GetAssessmentPolicyAttestationsQuery, GetAssessmentPolicyAttestationsQueryVariables>(GET_ASSESSMENT_POLICY_ATTESTATIONS, { assessmentId })
      const links = getNodes(assessment.policyAttestations)

      const isUpToDate = ({ internalPolicyID, policyRevision }: (typeof links)[number]) => {
        const source = desired.get(internalPolicyID)
        return !!source && (!source.policyRevision || source.policyRevision === policyRevision)
      }
      const staleLinkIds = links.filter((link) => !isUpToDate(link)).map(({ id }) => id)
      const linkedPolicyIds = new Set(links.filter(isUpToDate).map(({ internalPolicyID }) => internalPolicyID))
      const missing = [...desired.values()].filter(({ internalPolicyID }) => !linkedPolicyIds.has(internalPolicyID))

      if (staleLinkIds.length > 0) {
        const { deleteBulkAssessmentPolicy } = await client.request<DeleteBulkAssessmentPolicyMutation, DeleteBulkAssessmentPolicyMutationVariables>(DELETE_BULK_ASSESSMENT_POLICY, {
          ids: staleLinkIds,
        })
        if (deleteBulkAssessmentPolicy.error || (deleteBulkAssessmentPolicy.notDeletedIDs?.length ?? 0) > 0) {
          throw new UserFacingError('Some policy links could not be removed. Please try again later.', { cause: deleteBulkAssessmentPolicy.error })
        }
      }

      if (missing.length > 0) {
        await client.request<CreateBulkAssessmentPolicyMutation, CreateBulkAssessmentPolicyMutationVariables>(CREATE_BULK_ASSESSMENT_POLICY, {
          input: missing.map(({ internalPolicyID, policyRevision }) => ({ assessmentID: assessmentId, internalPolicyID, policyRevision })),
        })
      }
    },
    [client],
  )
}

export const useCreateAssessmentTemplate = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateAssessmentTemplateMutation, unknown, CreateAssessmentTemplateMutationVariables>({
    mutationFn: (variables) => client.request<CreateAssessmentTemplateMutation, CreateAssessmentTemplateMutationVariables>(CREATE_ASSESSMENT_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export const useUpdateAssessment = () => {
  const { client, queryClient } = useGraphQLClient()
  const syncAssessmentPolicies = useSyncAssessmentPolicies()

  return useMutation<UpdateAssessmentMutation, unknown, UpdateAssessmentMutationVariables>({
    mutationFn: async (variables) => {
      const result = await client.request<UpdateAssessmentMutation, UpdateAssessmentMutationVariables>(UPDATE_ASSESSMENT, variables)
      if (variables.input.jsonconfig === undefined) return result
      try {
        await syncAssessmentPolicies(variables.updateAssessmentId, variables.input.jsonconfig)
      } catch (error) {
        throw new UserFacingError('The questionnaire was saved, but its linked policies could not be updated. Save again to retry.', { cause: error })
      }
      return result
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      if (variables.input.jsonconfig !== undefined) queryClient.invalidateQueries({ queryKey: ['assessmentJsonconfig', variables.updateAssessmentId] })
    },
  })
}

export const useDeleteAssessment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteAssessmentMutation, unknown, DeleteAssessmentMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_ASSESSMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
}

export const useDeleteBulkAssessment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkAssessmentMutation, unknown, DeleteBulkAssessmentMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_BULK_ASSESSMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
}
