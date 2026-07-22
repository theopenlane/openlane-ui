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

export const useWebSocketClient = () => {
  return use(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { data: session, status } = useSession()
  const sessionToken = session?.user?.accessToken
  const isOnboarding = session?.user?.isOnboarding === true

  const [pendingToken, setPendingToken] = useState<string | null>(null)

  useEffect(() => {
    if (pendingToken && status === 'authenticated' && sessionToken === pendingToken) {
      setPendingToken(null)
    }
  }, [pendingToken, sessionToken, status])

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
      clientRef.current.dispose()
    }
    clientRef.current = null
    setClient(null)
    setIsConnected(false)
  }, [])

  const resetConnection = useCallback(() => {
    setHasFatalError(false)
    setError(null)
    lastTokenRef.current = null
    disposeClient()
    setConnectionResetKey((prev) => prev + 1)
  }, [disposeClient])

  useEffect(() => {
    const tokenChanged = lastTokenRef.current !== null && lastTokenRef.current !== effectiveToken

    if (!effectiveToken || !websocketGQLUrl || (hasFatalError && !tokenChanged)) {
      disposeClient()
      return
    }

    if (tokenChanged) {
      setHasFatalError(false)
      setError(null)
    }

    if (lastTokenRef.current === effectiveToken && clientRef.current) {
      return
    }

    lastTokenRef.current = effectiveToken

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
      setIsConnected(true)
      setError(null)
      setHasFatalError(false)
    })

    const unsubClosed = wsClient.on('closed', (event) => {
      const reason = (event as CloseEvent)?.reason?.toLowerCase?.() ?? ''
      setIsConnected(false)

      if (reason.includes('terminated') || reason.includes('unauthorized') || reason.includes('forbidden')) {
        setHasFatalError(true)
        setError(reason || 'fatal websocket close')
      }
    })

    const unsubError = wsClient.on('error', (err) => {
      setIsConnected(false)
      setError(err)
    })

    clientRef.current = wsClient
    setClient(wsClient)

    return () => {
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
