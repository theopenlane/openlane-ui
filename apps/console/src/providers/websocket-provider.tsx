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
}

const WebSocketContext = createContext<WebSocketContextType>({
  client: null,
  isConnected: false,
  error: null,
  resetConnection: () => {},
})

export function useWebSocketClient() {
  return use(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session, status } = useSession()
  const token = session?.user?.accessToken

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
    const tokenChanged = lastTokenRef.current !== null && lastTokenRef.current !== token

    if (status !== 'authenticated' || !token || !websocketGQLUrl || (hasFatalError && !tokenChanged)) {
      console.log('[WS] skip init', {
        status,
        hasToken: Boolean(token),
        hasFatalError,
      })
      disposeClient()
      return
    }

    if (tokenChanged) {
      setHasFatalError(false)
      setError(null)
    }

    if (lastTokenRef.current === token && clientRef.current) {
      console.log('[WS] reuse existing client')
      return
    }

    lastTokenRef.current = token

    console.log('[WS] create client (lazy)')

    const wsClient = createClient({
      url: websocketGQLUrl,
      lazy: true,
      retryAttempts: Number.MAX_SAFE_INTEGER,
      keepAlive: 20_000,
      connectionParams: async () => ({
        Authorization: `Bearer ${token}`,
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
  }, [connectionResetKey, token, status, hasFatalError, disposeClient])

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
      }}
    >
      {children}
    </WebSocketContext>
  )
}
