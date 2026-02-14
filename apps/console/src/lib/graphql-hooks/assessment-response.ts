import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  AssessmentResponse,
  AssessmentResponseQuery,
  AssessmentResponseQueryVariables,
  AssessmentResponsesWithFilterQuery,
  AssessmentResponsesWithFilterQueryVariables,
  CreateAssessmentResponseMutation,
  CreateAssessmentResponseMutationVariables,
  DeleteAssessmentResponseMutation,
  DeleteAssessmentResponseMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { ASSESSMENT_RESPONSE, GET_ALL_ASSESSMENT_RESPONSES, CREATE_ASSESSMENT_RESPONSE, DELETE_ASSESSMENT_RESPONSE } from '@repo/codegen/query/assessment-response'

type GetAllAssessmentResponsesArgs = {
  where?: AssessmentResponsesWithFilterQueryVariables['where']
  orderBy?: AssessmentResponsesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useAssessmentResponsesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllAssessmentResponsesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<AssessmentResponsesWithFilterQuery, unknown>({
    queryKey: ['assessmentResponses', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<AssessmentResponsesWithFilterQuery> => {
      const result = await client.request(GET_ALL_ASSESSMENT_RESPONSES, { where, orderBy, ...pagination?.query })
      return result as AssessmentResponsesWithFilterQuery
    },
    enabled,
  })

  const AssessmentResponses = (queryResult.data?.assessmentResponses?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as AssessmentResponse[]

  return { ...queryResult, AssessmentResponses }
}

export const useCreateAssessmentResponse = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateAssessmentResponseMutation, unknown, CreateAssessmentResponseMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ASSESSMENT_RESPONSE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentResponses'] })
    },
  })
}

export const useDeleteAssessmentResponse = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteAssessmentResponseMutation, unknown, DeleteAssessmentResponseMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ASSESSMENT_RESPONSE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentResponses'] })
    },
  })
}

export const useAssessmentResponse = (assessmentResponseId?: AssessmentResponseQueryVariables['assessmentResponseId']) => {
  const { client } = useGraphQLClient()

  return useQuery<AssessmentResponseQuery, unknown>({
    queryKey: ['assessmentResponses', assessmentResponseId],
    queryFn: async (): Promise<AssessmentResponseQuery> => {
      const result = await client.request(ASSESSMENT_RESPONSE, { assessmentResponseId })
      return result as AssessmentResponseQuery
    },
    enabled: !!assessmentResponseId,
  })
}
