'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient, Client } from 'graphql-ws'
import { useSession } from 'next-auth/react'

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

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token || !process.env.NEXT_PUBLIC_API_GQL_URL) return

    const wsUrl = process.env.NEXT_PUBLIC_API_GQL_URL.replace(/^http/, 'ws')

    const newClient = createClient({
      url: wsUrl,
      connectionParams: {
        Authorization: `Bearer ${token}`,
      },
      on: {
        connected: () => setIsConnected(true),
        closed: () => setIsConnected(false),
        error: () => setIsConnected(false),
      },
      shouldRetry: () => true,
    })

    setClient(newClient)

    return () => {
      newClient.dispose()
      setClient(null)
      setIsConnected(false)
    }
  }, [token])

  return <WebSocketContext.Provider value={{ client, isConnected }}>{children}</WebSocketContext.Provider>
}
