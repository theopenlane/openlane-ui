import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export async function GET() {
  return coreAPIRequest('/v1/scopes', HTTP_METHODS.GET, undefined, 'Failed to fetch scopes')
}
