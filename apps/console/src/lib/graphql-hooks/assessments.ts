import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_ASSESSMENT, UPDATE_ASSESSMENT, GET_ALL_ASSESSMENTS, GET_ASSESSMENT, DELETE_ASSESSMENT, CREATE_ASSESSMENT_RESPONSE, DELETE_BULK_ASSESSMENT } from '@repo/codegen/query/assessment'

import {
  CreateAssessmentMutation,
  CreateAssessmentMutationVariables,
  UpdateAssessmentMutation,
  UpdateAssessmentMutationVariables,
  FilterAssessmentsQuery,
  FilterAssessmentsQueryVariables,
  GetAssessmentQuery,
  GetAssessmentQueryVariables,
  DeleteAssessmentMutation,
  DeleteAssessmentMutationVariables,
  CreateAssessmentResponseMutation,
  CreateAssessmentResponseMutationVariables,
  Assessment,
  DeleteBulkAssessmentMutation,
  DeleteBulkAssessmentMutationVariables,
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

  const queryResult = useQuery<FilterAssessmentsQuery>({
    queryKey: ['assessments', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () =>
      client.request(GET_ALL_ASSESSMENTS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const assessments = (queryResult.data?.assessments?.edges ?? []).map((edge) => edge?.node) as Assessment[]

  const paginationMeta = {
    totalCount: queryResult.data?.assessments?.totalCount ?? 0,
    pageInfo: queryResult.data?.assessments?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    assessments,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

export const useGetAssessment = (getAssessmentId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAssessmentQuery, GetAssessmentQueryVariables>({
    queryKey: ['assessments', getAssessmentId],
    queryFn: () => client.request(GET_ASSESSMENT, { getAssessmentId }),
    enabled: !!getAssessmentId,
  })
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
