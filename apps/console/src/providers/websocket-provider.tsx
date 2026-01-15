'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
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
  const { data: session, status } = useSession()
  const token = session?.user?.accessToken
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  console.log('isConnected', isConnected)

  useEffect(() => {
    if (status !== 'authenticated' || !token || !process.env.NEXT_PUBLIC_API_GQL_URL) {
      return
    }

    // const wsUrl = process.env.NEXT_PUBLIC_API_GQL_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')
    const wsUrl = 'ws://localhost:17608/query'
    // const wsUrl = 'ws://localhost:17608/subscriptions'
    // const wsUrl = 'ws://localhost:17608/graphql'

    console.log('🔌 WS: Initializing client for', wsUrl)

    const client = createClient({
      url: wsUrl,
      // The Guild recommends lazy: true for better connection management
      lazy: true,
      connectionParams: async () => {
        return {
          Authorization: `Bearer ${token}`,
        }
      },
      on: {
        connected: () => {
          console.log('✅ WS: Connected')
          setIsConnected(true)
        },
        closed: (event) => {
          console.log('❌ WS: Closed', event)
          setIsConnected(false)
        },
        error: (err) => {
          console.error('⚠️ WS: Error', err)
          setIsConnected(false)
        },
      },
    })

    clientRef.current = client

    return () => {
      console.log('🔌 WS: Disposing client')
      client.dispose()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [token, status])

  return <WebSocketContext.Provider value={{ client: clientRef.current, isConnected }}>{children}</WebSocketContext.Provider>
}
