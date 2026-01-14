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

  // 1. Initial Auth Logging
  console.log('[SSE Proxy] Debug Info:', {
    hasSessionString: !!sessionString,
    sessionCookieName,
    hasAccessToken: !!accessToken,
    apiUrl: process.env.NEXT_PUBLIC_API_GQL_URL,
  })

  if (!accessToken) {
    console.error('[SSE Proxy] Error: No access token found in session')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!sessionString) {
    console.error('[SSE Proxy] Error: Session string (cookie) is missing')
    return new Response(JSON.stringify({ error: 'Unauthorized session string missing' }), { status: 401 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      let isStreamClosed = false

      try {
        console.log('[SSE Proxy] Initiating secureFetch to backend...')

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

        // 2. Log Backend Response Status
        console.log('[SSE Proxy] Backend Response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
        })

        if (!response.ok || !response.body) {
          const errorBody = await response.text().catch(() => 'No body')
          console.error('[SSE Proxy] Backend Error Details:', errorBody)

          if (!isStreamClosed) controller.close()
          return
        }

        const reader = response.body.getReader()
        console.log('[SSE Proxy] Stream established successfully')

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[SSE Proxy] Stream finished (done: true)')
            break
          }

          const rawChunk = decoder.decode(value, { stream: true })
          const formattedChunk = rawChunk.endsWith('\n\n') ? rawChunk : `${rawChunk}\n\n`

          try {
            controller.enqueue(encoder.encode(formattedChunk))
          } catch (err) {
            console.warn('[SSE Proxy] Controller closed while enqueuing:', err)
            isStreamClosed = true
            break
          }
        }
      } catch (error) {
        console.error('[SSE Proxy] Critical Stream Error:', error)
      } finally {
        if (!isStreamClosed) {
          try {
            controller.close()
            console.log('[SSE Proxy] Controller closed safely')
          } catch (e: unknown) {
            console.error('[SSE Proxy] Controller close error:', e)
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
