import { useNotification } from '@/hooks/useNotification'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

interface QuestionnaireResponse {
  success: boolean
  data: {
    jsonconfig: Record<string, unknown>
  }
  message?: string
}

interface UseQuestionnaireParams {
  token?: string
  enabled?: boolean
}

export const useQuestionnaire = ({ token, enabled = true }: UseQuestionnaireParams) => {
  const { errorNotification } = useNotification()

  const resp = useQuery<QuestionnaireResponse>({
    queryKey: ['questionnaire', token],
    enabled: !!token && enabled,
    queryFn: async () => {
      const response = await fetch('/api/questionnaire', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not load questionnaire. Please try again.')
      }

      return result as QuestionnaireResponse
    },
  })

  useEffect(() => {
    if (resp.isError) {
      errorNotification({
        title: 'Failed to Load Questionnaire',
        description: resp.error instanceof Error ? resp.error.message : 'An unexpected error occurred. Please try again.',
      })
    }
  }, [resp.isError, resp.error, errorNotification])

  return resp
}

interface SubmitQuestionnaireParams {
  token: string
  data: Record<string, unknown>
}

interface SubmitQuestionnaireResponse {
  success: boolean
  message?: string
}

export const useSubmitQuestionnaire = () => {
  const { errorNotification, successNotification } = useNotification()

  return useMutation<SubmitQuestionnaireResponse, Error, SubmitQuestionnaireParams>({
    mutationFn: async ({ token, data }) => {
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not submit questionnaire. Please try again.')
      }

      return result as SubmitQuestionnaireResponse
    },
    onSuccess: () => {
      successNotification({
        title: 'Questionnaire Submitted',
        description: 'Your questionnaire has been submitted successfully.',
      })
    },
    onError: (error) => {
      errorNotification({
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred while submitting. Please try again.',
      })
    },
  })
}
