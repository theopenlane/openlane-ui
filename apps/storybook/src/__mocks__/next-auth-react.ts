import React from 'react'

export function useSession() {
  return {
    data: null,
    status: 'unauthenticated' as const,
    update: async () => undefined,
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}
