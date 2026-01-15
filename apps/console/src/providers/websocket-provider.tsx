'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useSession } from 'next-auth/react'
import { websocketGQLUrl } from '@repo/dally/auth'

interface WebSocketContextType {
  client: SubscriptionClient | null
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
  const clientRef = useRef<SubscriptionClient | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      return
    }

    const client = new SubscriptionClient(websocketGQLUrl, {
      reconnect: true,
      connectionParams: {
        Authorization: `Bearer ${token}`,
      },
    })

    client.onConnected(() => {
      console.log('✅ WS: Legacy Connected')
      setIsConnected(true)
    })

    client.onDisconnected(() => {
      console.log('❌ WS: Legacy Disconnected')
      setIsConnected(false)
    })

    client.onError((err) => {
      console.error('⚠️ WS: Legacy Error', err)
    })

    clientRef.current = client

    return () => {
      console.log('🔌 WS: Disposing Legacy client')
      client.close()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [token, status])

  return <WebSocketContext.Provider value={{ client: clientRef.current, isConnected }}>{children}</WebSocketContext.Provider>
}
