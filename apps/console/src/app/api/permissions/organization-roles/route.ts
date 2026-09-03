import { type NextRequest } from 'next/server'
import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export async function GET(req: NextRequest) {
  return coreAPIRequest('/v1/account/roles/organization', HTTP_METHODS.GET, req, 'Failed to fetch organization roles')
}
