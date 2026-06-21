import { type NextRequest } from 'next/server'
import { coreAPIRequest, HTTP_METHODS } from '@/lib/auth/utils/core-api-request'

const ROUTE = '/v1/account/organization-roles'

export async function GET() {
  return coreAPIRequest(ROUTE, HTTP_METHODS.GET, undefined, 'Failed to fetch organization roles')
}

export async function POST(req: NextRequest) {
  return coreAPIRequest(ROUTE, HTTP_METHODS.POST, req, 'Failed to assign organization role')
}

export async function DELETE(req: NextRequest) {
  return coreAPIRequest(ROUTE, HTTP_METHODS.DELETE, req, 'Failed to remove organization role')
}
