import { type SiteExistsResponse } from '@/types/site-exists'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { probePublicUrl } from '@/lib/server/public-url-probe'

const siteExistsRequestSchema = z.object({ url: z.string().min(1) })

const rejection = (error: string) => NextResponse.json<SiteExistsResponse>({ exists: false, error }, { status: 400 })

export async function POST(req: Request) {
  const session = await auth()

  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = siteExistsRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return rejection('Invalid URL')
  }

  const result = await probePublicUrl(body.data.url)
  if (!result.allowed) {
    return rejection('URL not allowed')
  }

  return NextResponse.json<SiteExistsResponse>({ exists: result.exists })
}
