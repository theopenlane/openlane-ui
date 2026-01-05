import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { sessionCookieName } from '@repo/dally/auth'
import { auth } from '@/lib/auth/auth'

export const dynamic = 'force-dynamic'

const getNotifications = `
  subscription {
    notificationCreated {
      id
      body
      topic
      title
      data
      readAt
    }
  }
`

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const sessionString = cookieStore.get(sessionCookieName as string)?.value
  const session = await auth()
  const accessToken = session?.user?.accessToken

  console.log('Auth check:', {
    hasToken: !!accessToken,
    hasSession: !!session,
    sessionName: sessionCookieName,
  })

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await secureFetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
            Cookie: `${sessionCookieName}=${sessionString}`,
          },
          body: JSON.stringify({
            query: getNotifications,
            variables: {},
          }),
        })

        if (!response.ok || !response.body) {
          controller.close()
          return
        }

        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(value)
        }
      } catch (error) {
        console.error('[SSE Proxy] Stream error:', error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
