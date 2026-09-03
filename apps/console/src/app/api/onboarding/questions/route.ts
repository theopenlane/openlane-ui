import { type NextRequest } from 'next/server'
import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export const GET = async (req: NextRequest) => {
  return coreAPIRequest('/v1/onboarding/questions', HTTP_METHODS.GET, req, 'Failed to fetch onboarding questions')
}
