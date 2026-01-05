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

  console.log('[SSE Proxy] 🟢 New connection request received')

  if (!accessToken) {
    console.warn('[SSE Proxy] ⚠️ Unauthorized: No access token found')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let isStreamActive = true
  const requestId = Math.random().toString(36).substring(7)
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      console.log(`[SSE Proxy][${requestId}] Stream start: Connecting to backend...`)
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

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
          console.error(`[SSE Proxy][${requestId}] ❌ Backend error:`, { status: response.status })
          if (isStreamActive) {
            controller.close()
            isStreamActive = false
          }
          return
        }

        console.log(`[SSE Proxy][${requestId}] ✅ Backend connection established`)
        reader = response.body.getReader()

        while (isStreamActive) {
          const { done, value } = await reader.read()
          if (done || !isStreamActive) break

          // --- DATA INTERCEPTOR LOG ---
          const rawChunk = decoder.decode(value, { stream: true })

          if (rawChunk.includes('ping')) {
            console.log(`[SSE Proxy][${requestId}] 💓 Received Heartbeat (ping)`)
          } else {
            console.log(`[SSE Proxy][${requestId}] 📥 Incoming Raw Data:\n${rawChunk}`)

            // Try to extract the notification object specifically
            if (rawChunk.includes('notificationCreated')) {
              console.log(`[SSE Proxy][${requestId}] 🔔 NOTIFICATION DETECTED!`)
            }
          }
          // ----------------------------

          try {
            controller.enqueue(value)
          } catch (e) {
            isStreamActive = false
            break
          }
        }
      } catch (error) {
        if (isStreamActive) console.error(`[SSE Proxy][${requestId}] 🔥 Stream Error:`, error)
      } finally {
        isStreamActive = false
        console.log(`[SSE Proxy][${requestId}] 🔒 Cleaning up resources...`)
        try {
          controller.close()
        } catch (e) {}
        if (reader) {
          try {
            await reader.cancel()
            reader.releaseLock()
          } catch (e) {}
        }
      }
    },
    cancel() {
      isStreamActive = false
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
