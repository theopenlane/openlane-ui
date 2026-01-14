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
  const sessionString = cookieStore.get(sessionCookieName as string)?.value
  const session = await auth()
  const accessToken = session?.user?.accessToken

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!sessionString) {
    return new Response(JSON.stringify({ error: 'Unauthorized session string missing' }), { status: 401 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      let isStreamClosed = false

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
          if (!isStreamClosed) controller.close()
          return
        }

        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const rawChunk = decoder.decode(value, { stream: true })

          const formattedChunk = rawChunk.endsWith('\n\n') ? rawChunk : `${rawChunk}\n\n`

          try {
            controller.enqueue(encoder.encode(formattedChunk))
          } catch {
            console.warn('[SSE Proxy] Controller closed while enqueuing, stopping...')
            isStreamClosed = true
            break
          }
        }
      } catch (error) {
        console.error('[SSE Proxy] Stream Error:', error)
      } finally {
        if (!isStreamClosed) {
          try {
            controller.close()
          } catch (e: unknown) {
            console.error('controller close error:', e)
          }
        }
      }
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
