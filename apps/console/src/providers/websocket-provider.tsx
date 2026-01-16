'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { createClient, Client } from 'graphql-ws'
import { useSession } from 'next-auth/react'
import { websocketGQLUrl } from '@repo/dally/auth'

interface WebSocketContextType {
  client: Client | null
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  client: null,
  isConnected: false,
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
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    console.log('WS: Status check', { status, url: websocketGQLUrl })

    if (status !== 'authenticated' || !token || !websocketGQLUrl || !clientRef) {
      return
    }

    console.log('WS: Initializing Non-Lazy Client...')

    const client = createClient({
      url: websocketGQLUrl,
      lazy: false,
      connectionParams: async () => {
        console.log('WS: Generating connection_init payload')
        return {
          Authorization: `Bearer ${token}`,
        }
      },
      onNonLazyError: (error) => {
        console.error('WS: Fatal Non-Lazy Error (Handshake failed)', error)
      },
      retryAttempts: 10,
    })

    const unsubConnect = client.on('connected', () => {
      console.log('✅ WS: Connected & Handshake Acked')
      setIsConnected(true)
    })

    const unsubClosed = client.on('closed', (event) => {
      console.warn('❌ WS: Connection Closed', event)
      setIsConnected(false)
    })

    const unsubError = client.on('error', (error) => {
      console.error('⚠️ WS: Protocol/Socket Error', error)
      setIsConnected(false)
    })

    clientRef.current = client

    return () => {
      console.log('🔌 WS: Cleaning up')
      unsubConnect()
      unsubClosed()
      unsubError()
      if (clientRef.current) {
        clientRef.current.dispose()
        clientRef.current = null
      }
      setIsConnected(false)
    }
  }, [token, status])

  return <WebSocketContext.Provider value={{ client: clientRef.current, isConnected }}>{children}</WebSocketContext.Provider>
}
