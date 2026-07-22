import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export const GET = async () => {
  return coreAPIRequest('/v1/onboarding/questions', HTTP_METHODS.GET, undefined, 'Failed to fetch onboarding questions')
}
