import { auth } from '@/lib/auth/auth'
import { fetchGraphqlServer } from '@/lib/server/fetch-graphql'
import { GET_ORGANIZATION_NAME_BY_ID } from '@repo/codegen/query/organization'
import { type GetOrganizationNameByIdQuery } from '@repo/codegen/src/schema'
import { sessionCookieName } from '@repo/dally/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { buildDevRevPayload } from './devrev-payload'

export async function GET() {
  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const accessToken = session?.user?.accessToken
  const currentOrgId = session?.user?.activeOrganizationId
  const userId = session?.user?.userId
  const sessionCookie = cookieStore.get(sessionCookieName as string)?.value

  if (!accessToken || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!currentOrgId || !sessionCookie) {
    return NextResponse.json({ error: 'Active organization unavailable' }, { status: 400 })
  }

  const organizationData = await fetchGraphqlServer<GetOrganizationNameByIdQuery>(GET_ORGANIZATION_NAME_BY_ID, { organizationId: currentOrgId }, accessToken, sessionCookie)
  const organization = organizationData?.organization

  if (!organization?.name || !organization.displayName) {
    return NextResponse.json({ error: 'Unable to resolve active organization' }, { status: 502 })
  }

  const payload = buildDevRevPayload({
    currentOrgId,
    organization,
    user: {
      id: userId,
      displayName: session.user.displayName,
    },
  })

  const response = await fetch('https://api.devrev.ai/auth-tokens.create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEVREV_AAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json({ error: data }, { status: response.status })
  }

  return NextResponse.json({
    session_token: data.access_token,
    organization_id: currentOrgId,
  })
}
