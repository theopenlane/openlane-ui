import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_ASSESSMENT,
  UPDATE_ASSESSMENT,
  GET_ALL_ASSESSMENTS,
  GET_ASSESSMENT,
  GET_ASSESSMENT_DETAIL,
  GET_ASSESSMENT_RECIPIENTS_TOTAL_COUNT,
  GET_ASSESSMENT_RESPONSES_TOTAL_COUNT,
  DELETE_ASSESSMENT,
  DELETE_BULK_ASSESSMENT,
} from '@repo/codegen/query/assessment'
import { CREATE_ASSESSMENT_RESPONSE } from '@repo/codegen/query/assessment-response'

import {
  CreateAssessmentMutation,
  CreateAssessmentMutationVariables,
  UpdateAssessmentMutation,
  UpdateAssessmentMutationVariables,
  FilterAssessmentsQuery,
  FilterAssessmentsQueryVariables,
  GetAssessmentQuery,
  GetAssessmentQueryVariables,
  GetAssessmentDetailQuery,
  GetAssessmentDetailQueryVariables,
  DeleteAssessmentMutation,
  DeleteAssessmentMutationVariables,
  CreateAssessmentResponseMutation,
  CreateAssessmentResponseMutationVariables,
  Assessment,
  AssessmentResponseAssessmentResponseStatus,
  DeleteBulkAssessmentMutation,
  DeleteBulkAssessmentMutationVariables,
  AssessmentResponseOrder,
  AssessmentResponseWhereInput,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

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

  const assessments = useMemo(() => (queryResult.data?.assessments?.edges ?? []).map((edge) => edge?.node) as Assessment[], [queryResult.data?.assessments?.edges])

  const paginationMeta = useMemo(
    () => ({
      totalCount: queryResult.data?.assessments?.totalCount ?? 0,
      pageInfo: queryResult.data?.assessments?.pageInfo,
      isLoading: queryResult.isFetching,
    }),
    [queryResult.data?.assessments?.totalCount, queryResult.data?.assessments?.pageInfo, queryResult.isFetching],
  )

  return {
    ...queryResult,
    assessments,
    paginationMeta,
    isLoading: queryResult.isFetching,
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
        getAssessmentId: id!,
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
      isLoading: queryResult.isFetching,
    }),
    [assessment?.assessmentResponses?.totalCount, assessment?.assessmentResponses?.pageInfo, queryResult.isFetching],
  )

  return {
    ...queryResult,
    assessment,
    responses,
    paginationMeta,
    totalRecipients,
    hasMoreResponses,
    completedResponses,
    isLoading: queryResult.isFetching,
  }
}

type AssessmentRecipientsTotalCountQuery = {
  assessment?: {
    id: string
    assessmentResponses: {
      totalCount: number
    }
  } | null
}

type AssessmentRecipientsTotalCountQueryVariables = {
  getAssessmentId: string
}

export const useAssessmentRecipientsTotalCount = (id?: string) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<AssessmentRecipientsTotalCountQuery>({
    queryKey: ['assessments', 'recipients-total-count', id],
    queryFn: () =>
      client.request<AssessmentRecipientsTotalCountQuery, AssessmentRecipientsTotalCountQueryVariables>(GET_ASSESSMENT_RECIPIENTS_TOTAL_COUNT, {
        getAssessmentId: id!,
      }),
    enabled: !!id,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.assessment?.assessmentResponses?.totalCount ?? 0,
    isLoading: queryResult.isFetching,
  }
}

type AssessmentResponsesTotalCountQuery = {
  assessment?: {
    id: string
    assessmentResponses: {
      totalCount: number
    }
  } | null
}

type AssessmentResponsesTotalCountQueryVariables = {
  getAssessmentId: string
  where: AssessmentResponseWhereInput
}

export const useAssessmentResponsesTotalCount = (id?: string) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<AssessmentResponsesTotalCountQuery>({
    queryKey: ['assessments', 'responses-total-count', id],
    queryFn: () =>
      client.request<AssessmentResponsesTotalCountQuery, AssessmentResponsesTotalCountQueryVariables>(GET_ASSESSMENT_RESPONSES_TOTAL_COUNT, {
        getAssessmentId: id!,
        where: {
          status: AssessmentResponseAssessmentResponseStatus.COMPLETED,
        },
      }),
    enabled: !!id,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.assessment?.assessmentResponses?.totalCount ?? 0,
    isLoading: queryResult.isFetching,
  }
}

export const useCreateAssessment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateAssessmentMutation, unknown, CreateAssessmentMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_ASSESSMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
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

export const useCreateAssessmentResponse = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateAssessmentResponseMutation, unknown, CreateAssessmentResponseMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_ASSESSMENT_RESPONSE, variables),
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
