'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { createClient, Client } from 'graphql-ws'
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
  return useContext(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { data: session, status } = useSession()
  const token = session?.user?.accessToken

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<unknown | null>(null)
  const [hasFatalError, setHasFatalError] = useState(false)

  const clientRef = useRef<Client | null>(null)
  const lastTokenRef = useRef<string | null>(null)

  const resetConnection = useCallback(() => {
    console.log('WS: Manual reset triggered')
    setHasFatalError(false)
    setError(null)
    lastTokenRef.current = null
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !token || !websocketGQLUrl || hasFatalError) {
      return
    }

    if (lastTokenRef.current === token && clientRef.current) {
      return
    }
    lastTokenRef.current = token

    console.log('WS: Initializing Client...')

    const client = createClient({
      url: websocketGQLUrl,
      lazy: false,
      connectionParams: async () => {
        return {
          Authorization: `Bearer ${token}`,
        }
      },
      retryAttempts: 5,
      onNonLazyError: (err) => {
        console.error('WS: Final connection failure', err)
        setError(err)
        setHasFatalError(true)
      },
    })

    const unsubConnect = client.on('connected', () => {
      console.log('✅ WS: Connected')
      setIsConnected(true)
      setError(null)
      setHasFatalError(false)
    })

    const unsubClosed = client.on('closed', (event) => {
      console.warn('❌ WS: Closed', event)
      setIsConnected(false)
      const closeEvent = event as CloseEvent
      if (closeEvent && closeEvent.reason === 'terminated') {
        setHasFatalError(true)
        setError('Server terminated connection')
      }
    })

    const unsubError = client.on('error', (err) => {
      console.error('⚠️ WS: Protocol Error', err)
      setIsConnected(false)
    })

    clientRef.current = client

    return () => {
      console.log('🔌 WS: Cleanup/Dispose')
      unsubConnect()
      unsubClosed()
      unsubError()
      client.dispose()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [token, status, hasFatalError])

  return (
    <WebSocketContext.Provider
      value={{
        client: clientRef.current,
        isConnected,
        error,
        resetConnection,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
