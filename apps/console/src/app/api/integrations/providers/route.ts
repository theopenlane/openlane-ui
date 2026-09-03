import { type NextRequest } from 'next/server'
import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export async function GET(req: NextRequest) {
  const errorMsg = 'Failed to fetch integration providers'

  return coreAPIRequest('/v1/integrations/providers', HTTP_METHODS.GET, req, errorMsg)
}
