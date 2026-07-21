'use client'

import { createContext, use, useEffect, useState, type ReactNode, useRef, useCallback } from 'react'
import { createClient, type Client } from 'graphql-ws'
import { useSession } from 'next-auth/react'
import { websocketGQLUrl } from '@repo/dally/auth'

interface WebSocketContextType {
  client: Client | null
  isConnected: boolean
  error: unknown | null
  resetConnection: () => void
  setPendingToken: (token: string) => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  client: null,
  isConnected: false,
  error: null,
  resetConnection: () => {},
  setPendingToken: () => {},
})

export function useWebSocketClient() {
  return use(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session, status } = useSession()
  const sessionToken = session?.user?.accessToken
  // No real org exists yet while onboarding, so there's nothing meaningful to subscribe to --
  // connecting anyway just churns the socket through the org-switch token change at the end
  const isOnboarding = session?.user?.isOnboarding === true

  // Set explicitly (e.g. right after an org switch) so the socket can reconnect with the new
  // org's token immediately, instead of waiting for useSession() to re-render with it -- that
  // propagation isn't instant, and a notification published in the gap would otherwise be
  // delivered to a socket still authenticated under the old org and never received
  const [pendingToken, setPendingToken] = useState<string | null>(null)

  useEffect(() => {
    // Only drop the override once useSession() has fully settled to "authenticated" with the
    // matching token -- clearing it while status is still transiently "loading" would re-expose
    // the connection effect to the status gate below and cause a spurious dispose/reconnect
    if (pendingToken && status === 'authenticated' && sessionToken === pendingToken) {
      setPendingToken(null)
    }
  }, [pendingToken, sessionToken, status])

  // Folded into one value so the connection effect below only depends on THIS, not on status/
  // isOnboarding/sessionToken separately -- useEffect re-runs (tearing down and recreating the
  // whole client, killing any live subscription) on ANY dependency change, even ones that don't
  // actually affect which token we'd connect with. useSession() flips status to "loading" and
  // back periodically on its own (window focus, revalidation, etc.), completely unrelated to
  // onboarding, so without this the socket was churning during ordinary steady-state use too
  const effectiveToken = status === 'unauthenticated' ? null : (pendingToken ?? (isOnboarding ? null : sessionToken))

  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [hasFatalError, setHasFatalError] = useState(false)
  const [connectionResetKey, setConnectionResetKey] = useState(0)

  const clientRef = useRef<Client | null>(null)
  const lastTokenRef = useRef<string | null>(null)

  const disposeClient = useCallback(() => {
    if (clientRef.current) {
      console.log('[WS] dispose client')
      clientRef.current.dispose()
    }
    clientRef.current = null
    setClient(null)
    setIsConnected(false)
  }, [])

  const resetConnection = useCallback(() => {
    console.log('[WS] manual reset')
    setHasFatalError(false)
    setError(null)
    lastTokenRef.current = null
    disposeClient()
    setConnectionResetKey((prev) => prev + 1)
  }, [disposeClient])

  useEffect(() => {
    const tokenChanged = lastTokenRef.current !== null && lastTokenRef.current !== effectiveToken

    if (!effectiveToken || !websocketGQLUrl || (hasFatalError && !tokenChanged)) {
      console.log('[WS] skip init', {
        hasToken: Boolean(effectiveToken),
        hasFatalError,
      })
      disposeClient()
      return
    }

    if (tokenChanged) {
      setHasFatalError(false)
      setError(null)
    }

    if (lastTokenRef.current === effectiveToken && clientRef.current) {
      console.log('[WS] reuse existing client')
      return
    }

    lastTokenRef.current = effectiveToken

    console.log('[WS] create client (eager)')

    // lazy:false connects immediately when a token becomes available (or changes, e.g. after
    // switching orgs mid-onboarding) instead of waiting for the first subscribe() call -- with
    // lazy:true there's a window where a server-side event (like a domain scan finishing) can
    // be published before the socket has even started connecting, and is lost with no replay
    const wsClient = createClient({
      url: websocketGQLUrl,
      lazy: false,
      retryAttempts: 10,
      keepAlive: 20_000,
      connectionParams: async () => ({
        Authorization: `Bearer ${effectiveToken}`,
      }),
    })

    const unsubConnected = wsClient.on('connected', () => {
      console.log('[WS] socket connected')
      setIsConnected(true)
      setError(null)
      setHasFatalError(false)
    })

    const unsubClosed = wsClient.on('closed', (event) => {
      const reason = (event as CloseEvent)?.reason?.toLowerCase?.() ?? ''
      console.warn('[WS] socket closed', reason || 'no reason')
      setIsConnected(false)

      if (reason.includes('terminated') || reason.includes('unauthorized') || reason.includes('forbidden')) {
        console.error('[WS] fatal close reason')
        setHasFatalError(true)
        setError(reason || 'fatal websocket close')
      }
    })

    const unsubError = wsClient.on('error', (err) => {
      console.error('[WS] protocol error', err)
      setIsConnected(false)
    })

    clientRef.current = wsClient
    setClient(wsClient)

    return () => {
      console.log('[WS] cleanup')
      unsubConnected()
      unsubClosed()
      unsubError()
      disposeClient()
    }
  }, [connectionResetKey, effectiveToken, hasFatalError, disposeClient])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    const handleOnline = () => {
      if (!isConnected) {
        resetConnection()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        resetConnection()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isConnected, resetConnection, status])

  return (
    <WebSocketContext
      value={{
        client,
        isConnected,
        error,
        resetConnection,
        setPendingToken,
      }}
    >
      {children}
    </WebSocketContext>
  )
}
