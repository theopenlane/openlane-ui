import { auth } from '@/lib/auth/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const currentOrgId = req.nextUrl.searchParams.get('orgId')
  const orgName = req.nextUrl.searchParams.get('orgName')
  const orgDisplayName = req.nextUrl.searchParams.get('orgDisplayName')

  const payload = {
    rev_info: {
      user_ref: session.user.email,
      account_ref: orgName, // must be unique
      workspace_ref: 'devrev-dev',
      user_traits: {
        email: session.user.email,
        display_name: session.user.displayName,
      },
      account_traits: {
        display_name: orgDisplayName,
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

  return NextResponse.json({ session_token: data.session_token })
}
