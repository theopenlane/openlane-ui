import { type NextRequest } from 'next/server'
import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

export async function POST(req: NextRequest) {
  return coreAPIRequest('/v1/account/roles', HTTP_METHODS.POST, req)
}
