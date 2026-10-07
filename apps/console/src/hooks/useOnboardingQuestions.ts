import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { type OnboardingQuestionsResponse, type OnboardingStep } from '@/lib/onboarding-questions/types'
import { allQuestionsForStep } from '@/lib/onboarding-questions/build-schema'
import { COMPANY_NAME_KEY } from '@/lib/onboarding-questions/question-keys'
import { applyQuestionOverrides } from '@/lib/onboarding-questions/question-overrides'
import { reportSSORequirementFromResponse } from '@/lib/auth/utils/session-status'

const fetchOnboardingQuestions = async (): Promise<OnboardingQuestionsResponse> => {
  const response = await fetch('/api/onboarding/questions')

  if (!response.ok) {
    await reportSSORequirementFromResponse(response)
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
      questions: (step.questions ?? []).map(applyQuestionOverrides).filter((question) => !question.hidden),
      sections: (step.sections ?? []).map((section) => ({ ...section, questions: section.questions.map(applyQuestionOverrides).filter((question) => !question.hidden) })),
    }))
    .filter((step) => (step.questions ?? []).length > 0 || (step.sections ?? []).some((section) => section.questions.length > 0))
    .sort((a, b) => a.order - b.order)

export const useOnboardingQuestions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding-questions'],
    queryFn: fetchOnboardingQuestions,
    staleTime: Infinity,
  })

  const { startStep, guidedSteps } = useMemo(() => {
    const steps = visibleSteps(data?.steps ?? [])
    const startStep = steps.find((step) => allQuestionsForStep(step).some((question) => question.key === COMPANY_NAME_KEY))
    return { startStep, guidedSteps: steps.filter((step) => step !== startStep) }
  }, [data])

  const trialStep = useMemo(() => data?.steps.find((step) => !step.hidden && step.cards && step.cards.length > 0), [data])

  return {
    startStep,
    guidedSteps,
    trialCards: trialStep?.cards ?? [],
    trialTitle: trialStep?.title ?? '',
    trialDescription: trialStep?.description ?? '',
    isLoading,
    error,
  }
}
