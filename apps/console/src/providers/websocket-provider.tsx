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
    if (status !== 'authenticated' || !token || !websocketGQLUrl) {
      return
    }

    const client = createClient({
      url: websocketGQLUrl,
      lazy: false,
      keepAlive: 12000,
      connectionParams: async () => ({
        Authorization: `Bearer ${token}`,
      }),
      retryAttempts: 10,
      shouldRetry: () => true,
    })

    const unsubs = [
      client.on('connected', () => {
        setIsConnected(true)
      }),
      client.on('closed', () => {
        setIsConnected(false)
      }),
      client.on('error', (error) => {
        console.error('WebSocket Protocol Error:', error)
        setIsConnected(false)
      }),
    ]

    clientRef.current = client

    return () => {
      unsubs.forEach((unsub) => unsub())
      if (clientRef.current) {
        clientRef.current.dispose()
        clientRef.current = null
      }
      setIsConnected(false)
    }
  }, [token, status])

  return <WebSocketContext.Provider value={{ client: clientRef.current, isConnected }}>{children}</WebSocketContext.Provider>
}
