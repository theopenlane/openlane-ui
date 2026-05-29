import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export async function GET() {
  const errorMsg = 'Failed to fetch integration providers'

  return coreAPIRequest('/v1/integrations/providers', HTTP_METHODS.GET, undefined, errorMsg)
}
