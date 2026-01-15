'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useSession } from 'next-auth/react'
import { sessionCookieName, websocketGQLUrl } from '@repo/dally/auth'

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

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
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
        session: cookieValue,
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
