'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useSession } from 'next-auth/react'
import { sessionCookieName, websocketGQLUrl } from '@repo/dally/auth'
import { getCookie } from '@/lib/auth/utils/getCookie'

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
    if (status !== 'authenticated' || !token || !websocketGQLUrl || !sessionCookieName) {
      return
    }

    const cookieValue = getCookie(sessionCookieName)

    const client = new SubscriptionClient(websocketGQLUrl, {
      reconnect: true,
      connectionParams: {
        Authorization: `Bearer ${token}`,
        cookie: cookieValue ? `${sessionCookieName}=${cookieValue}` : undefined,
      },
    })

    client.onConnected(() => {
      setIsConnected(true)
    })

    client.onDisconnected(() => {
      setIsConnected(false)
    })

    client.onError(() => {
      setIsConnected(false)
    })

    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.close()
        clientRef.current = null
      }
      setIsConnected(false)
    }
  }, [token, status])

  return <WebSocketContext.Provider value={{ client: clientRef.current, isConnected }}>{children}</WebSocketContext.Provider>
}
