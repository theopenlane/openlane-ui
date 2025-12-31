'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export const useSmartRouter = () => {
  const router = useRouter()

  const updateParams = useCallback(
    (newParams: Record<string, string | number | null | undefined>, method: 'push' | 'replace') => {
      const params = new URLSearchParams(window.location.search)

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key)
        } else {
          params.set(key, value.toString())
        }
      })

      const search = params.toString()
      const query = search ? `?${search}` : window.location.pathname

      if (method === 'push') {
        router.push(query, { scroll: false })
      } else {
        router.replace(query, { scroll: false })
      }
    },
    [router],
  )

  const replace = useCallback((newParams: Record<string, string | number | null | undefined>) => updateParams(newParams, 'replace'), [updateParams])

  const push = useCallback((newParams: Record<string, string | number | null | undefined>) => updateParams(newParams, 'push'), [updateParams])

  return {
    replace,
    push,
  }
}
