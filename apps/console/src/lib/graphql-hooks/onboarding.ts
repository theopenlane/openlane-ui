import { useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_ONBOARDING } from '@repo/codegen/query/onboarding'
import { type CreateOnboardingMutation, type CreateOnboardingMutationVariables } from '@repo/codegen/src/schema'

export const useCreateOnboarding = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateOnboardingMutation, unknown, CreateOnboardingMutationVariables>({
    mutationFn: async (payload) => client.request(CREATE_ONBOARDING, payload),
  })
}
