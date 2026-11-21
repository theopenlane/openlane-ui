import { type NextRequest, NextResponse } from 'next/server'
import { isOfficialHost } from '@repo/ui/lib/official-deployment'
import { GET_ORGANIZATION_NAME_BY_ID } from '@repo/codegen/query/organization'
import { type GetOrganizationNameByIdQuery } from '@repo/codegen/src/schema'
import { getServerCredentials } from '@/lib/server/server-credentials'
import { fetchGraphqlServer } from '@/lib/server/fetch-graphql'
import { createDevRevSessionToken, ensureDevRevAccount } from '@/lib/server/devrev'
import { isImpersonation } from '@/lib/authz/utils'
import { type TDevRevTokenResponse } from '@/lib/devrev-token'

export const GET = async (req: NextRequest) => {
  if (!isOfficialHost(req.nextUrl.hostname)) {
    return NextResponse.json({ error: 'Openlane support chat is only available on official Openlane deployments' }, { status: 403 })
  }

  const credentials = await getServerCredentials()
  const userId = credentials?.session.user?.userId
  if (!credentials || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { session, accessToken, sessionCookie } = credentials
  if (isImpersonation(session)) {
    return NextResponse.json({ error: 'Openlane support chat is not available while impersonating' }, { status: 403 })
  }

  const organizationId = session.user.activeOrganizationId
  if (!organizationId) {
    return NextResponse.json({ error: 'No active organization' }, { status: 400 })
  }

  const organizationData = await fetchGraphqlServer<GetOrganizationNameByIdQuery>(GET_ORGANIZATION_NAME_BY_ID, { organizationId }, accessToken, sessionCookie)
  const organizationName = organizationData?.organization?.name
  if (!organizationName) {
    return NextResponse.json({ error: 'Unable to resolve the active organization' }, { status: 403 })
  }

  const organization = { id: organizationId, name: organizationName }

  try {
    await ensureDevRevAccount(organization)
    const sessionToken = await createDevRevSessionToken(organization, {
      id: userId,
      email: session.user.email,
      displayName: session.user.displayName,
    })

    return NextResponse.json<TDevRevTokenResponse>({ session_token: sessionToken, organization_id: organizationId })
  } catch (error) {
    console.error(`DevRev session token request failed for organization ${organizationId}:`, error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Unable to start Openlane support chat' }, { status: 502 })
  }
}
