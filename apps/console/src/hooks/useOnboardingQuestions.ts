import { useQuery } from '@tanstack/react-query'
import { type OnboardingQuestionsResponse } from '@/lib/onboarding-questions/types'

const fetchOnboardingQuestions = async (): Promise<OnboardingQuestionsResponse> => {
  const response = await fetch('/api/onboarding/questions')

  if (!response.ok) {
    throw new Error('Failed to load onboarding questions')
  }

  return response.json()
}

export const useOnboardingQuestions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['onboarding-questions'],
    queryFn: fetchOnboardingQuestions,
    staleTime: Infinity,
  })

  const steps = (data?.steps ?? [])
    .filter((step) => !step.hidden)
    .map((step) => ({
      ...step,
      questions: (step.questions ?? []).filter((question) => !question.hidden),
      sections: (step.sections ?? []).map((section) => ({ ...section, questions: section.questions.filter((question) => !question.hidden) })),
    }))
    // a step belongs in the form-step list if it has questions of its own, sectioned or not --
    // the questions-less `trial` step (display-only content for the closing screen) is excluded
    .filter((step) => step.questions.length > 0 || step.sections.some((section) => section.questions.length > 0))
    .sort((a, b) => a.order - b.order)

  // the trial step is identified by carrying `cards`, not by the absence of questions --
  // steps whose questions live entirely in sections also have no top-level questions
  const trialStep = data?.steps.find((step) => !step.hidden && step.cards && step.cards.length > 0)

  return {
    steps,
    trialCards: trialStep?.cards ?? [],
    trialTitle: trialStep?.title ?? '',
    trialDescription: trialStep?.description ?? '',
    isLoading,
    error,
  }
}
