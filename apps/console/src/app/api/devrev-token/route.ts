import { auth } from '@/lib/auth/auth'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentOrgId = req.nextUrl.searchParams.get('orgId')
  const orgName = req.nextUrl.searchParams.get('orgName')
  const orgDisplayName = req.nextUrl.searchParams.get('orgDisplayName')

  const payload = {
    rev_info: {
      // Scope the user reference per-org. DevRev keys a rev_user by user_ref and (without
      // multi-association) binds it to a single account, so a global user_ref keeps every org's
      // support tied to the first account the user ever contacted from. A composite ref gives each
      // (user, org) its own rev_user bound to the correct account, so support reflects the current org.
      user_ref: currentOrgId ? `${session.user.userId}:${currentOrgId}` : session.user.userId,
      account_ref: orgName,
      user_traits: {
        email: session.user.email,
        display_name: session.user.displayName,
      },
      account_traits: {
        display_name: orgDisplayName || orgName,
        custom_fields: {
          tnt__orgid: currentOrgId,
        },
      },
    },
  }

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
  })
}
