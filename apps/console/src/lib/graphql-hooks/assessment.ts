import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_ASSESSMENT_TEMPLATE,
  CREATE_ASSESSMENT,
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
  type CreateAssessmentMutation,
  type CreateAssessmentMutationVariables,
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
  const responses = useMemo(() => (assessment?.assessmentResponses?.edges ?? []).map((edge) => edge?.node).filter(Boolean), [assessment?.assessmentResponses?.edges])
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

export const useCreateAssessment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateAssessmentMutation, unknown, CreateAssessmentMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_ASSESSMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
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

  return useMutation<UpdateAssessmentMutation, unknown, UpdateAssessmentMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_ASSESSMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
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
