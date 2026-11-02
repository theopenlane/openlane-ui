import 'server-only'
import { NextResponse } from 'next/server'
import { GET_ORGANIZATION_BILLING_ACCESS } from '@repo/codegen/query/organization'
import { type GetOrganizationBillingAccessQuery, type GetOrganizationBillingAccessQueryVariables } from '@repo/codegen/src/schema'
import { canManageBilling } from '@/lib/authz/utils'
import { fetchGraphqlServer } from './fetch-graphql'
import { getServerCredentials } from './server-credentials'

type TBillingHandler = (customerId: string, req: Request) => Promise<Response>

const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status })

export const billingResourceNotFound = () => errorResponse('Billing resource not found', 404)

const resolveBillingCustomer = async (): Promise<string | NextResponse> => {
  const credentials = await getServerCredentials()
  const organizationId = credentials?.session.user?.activeOrganizationId
  const userId = credentials?.session.user?.userId

  if (!credentials || !organizationId || !userId) {
    return errorResponse('Unauthorized', 401)
  }

  const variables: GetOrganizationBillingAccessQueryVariables = { organizationId, userId }
  const data = await fetchGraphqlServer<GetOrganizationBillingAccessQuery>(GET_ORGANIZATION_BILLING_ACCESS, variables, credentials.accessToken, credentials.sessionCookie)

  if (!data) {
    return errorResponse('Unable to verify billing access', 502)
  }

  const role = data.orgMemberships.edges?.[0]?.node?.role

  if (!canManageBilling(role, credentials.session)) {
    return errorResponse('You do not have permission to manage billing for this organization', 403)
  }

  return data.organization.stripeCustomerID || errorResponse('This organization has no billing account', 404)
}

export const withBillingCustomer =
  (handler: TBillingHandler) =>
  async (req: Request): Promise<Response> => {
    const customer = await resolveBillingCustomer()
    return typeof customer === 'string' ? handler(customer, req) : customer
  }
