'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type TImportRoute, withReturnTo } from './import-routes'

export const useOpenImport = () => {
  const router = useRouter()

  return useCallback((route: TImportRoute) => router.push(withReturnTo(route.href, `${window.location.pathname}${window.location.search}`)), [router])
}
