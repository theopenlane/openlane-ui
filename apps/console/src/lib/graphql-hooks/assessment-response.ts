import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type AssessmentResponse,
  type AssessmentResponseQuery,
  type AssessmentResponseQueryVariables,
  type AssessmentResponsesWithFilterQuery,
  type AssessmentResponsesWithFilterQueryVariables,
  type CreateAssessmentResponseMutation,
  type CreateAssessmentResponseMutationVariables,
  type DeleteAssessmentResponseMutation,
  type DeleteAssessmentResponseMutationVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { mapWithConcurrency } from '@/utils/async'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
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
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
}

export type TAssessmentRecipient = { email: string; identityHolderID?: string }

export type TSendAssessmentResult = { sent: TAssessmentRecipient[]; failed: (TAssessmentRecipient & { reason: string })[] }

const SEND_CONCURRENCY = 5

export const useSendAssessmentToRecipients = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useCallback(
    async ({ assessmentId, recipients, dueDate }: { assessmentId: string; recipients: TAssessmentRecipient[]; dueDate?: string | null }): Promise<TSendAssessmentResult> => {
      const outcomes = await mapWithConcurrency(recipients, SEND_CONCURRENCY, async ({ email, identityHolderID }) => {
        try {
          await client.request<CreateAssessmentResponseMutation, CreateAssessmentResponseMutationVariables>(CREATE_ASSESSMENT_RESPONSE, {
            input: { email, assessmentID: assessmentId, identityHolderID, ...(dueDate && { dueDate }) },
          })
          return { email, identityHolderID, reason: null }
        } catch (error) {
          return { email, identityHolderID, reason: parseErrorMessage(error) }
        }
      })

      queryClient.invalidateQueries({ queryKey: ['assessmentResponses'] })
      queryClient.invalidateQueries({ queryKey: ['assessments'] })

      return {
        sent: outcomes.flatMap(({ email, identityHolderID, reason }) => (reason === null ? [{ email, identityHolderID }] : [])),
        failed: outcomes.flatMap(({ email, identityHolderID, reason }) => (reason === null ? [] : [{ email, identityHolderID, reason }])),
      }
    },
    [client, queryClient],
  )
}

export const useDeleteAssessmentResponse = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteAssessmentResponseMutation, unknown, DeleteAssessmentResponseMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ASSESSMENT_RESPONSE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentResponses'] })
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
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
