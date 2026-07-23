import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { type OnboardingQuestionsResponse, type OnboardingStep } from '@/lib/onboarding-questions/types'

const fetchOnboardingQuestions = async (): Promise<OnboardingQuestionsResponse> => {
  const response = await fetch('/api/onboarding/questions')

  if (!response.ok) {
    throw new Error('Failed to load onboarding questions')
  }

  const payload: OnboardingQuestionsResponse = await response.json()

  if (payload.success === false) {
    throw new Error('Failed to load onboarding questions')
  }

  return payload
}

const visibleSteps = (steps: OnboardingStep[]): OnboardingStep[] =>
  steps
    .filter((step) => !step.hidden)
    .map((step) => ({
      ...step,
      questions: (step.questions ?? []).filter((question) => !question.hidden),
      sections: (step.sections ?? []).map((section) => ({ ...section, questions: section.questions.filter((question) => !question.hidden) })),
    }))
    .filter((step) => (step.questions ?? []).length > 0 || (step.sections ?? []).some((section) => section.questions.length > 0))
    .sort((a, b) => a.order - b.order)

export const useOnboardingQuestions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding-questions'],
    queryFn: fetchOnboardingQuestions,
    staleTime: Infinity,
  })

  const steps = useMemo(() => visibleSteps(data?.steps ?? []), [data])

  const trialStep = useMemo(() => data?.steps.find((step) => !step.hidden && step.cards && step.cards.length > 0), [data])

  return {
    steps,
    trialCards: trialStep?.cards ?? [],
    trialTitle: trialStep?.title ?? '',
    trialDescription: trialStep?.description ?? '',
    isLoading,
    error,
  }
}
