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
      objectType
    }
  }
`

export async function GET() {
  const cookieStore = await cookies()
  const sessionString = cookieStore.get(sessionCookieName!)?.value
  const session = await auth()
  const accessToken = session?.user?.accessToken

  if (!accessToken || !sessionString) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await secureFetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`,
            Cookie: `${sessionCookieName}=${sessionString}`,
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
          body: JSON.stringify({
            query: getNotifications,
            variables: {},
          }),
        })

        if (!response.ok || !response.body) {
          controller.error(new Error('Upstream SSE failed'))
          return
        }

        const reader = response.body.getReader()

        while (!closed) {
          const { done, value } = await reader.read()
          if (done || closed) break

          try {
            controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })))
          } catch {
            closed = true
            break
          }
        }

        reader.cancel().catch(() => {})
      } catch (err) {
        if (!closed) controller.error(err)
      }
    },

    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
