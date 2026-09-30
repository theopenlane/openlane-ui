'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { currentLocationPath, withReturnTo } from '@/utils/return-to'
import { type TImportRoute } from './import-routes'

export const useOpenImport = () => {
  const router = useRouter()

  return useCallback((route: TImportRoute) => router.push(withReturnTo(route.href, currentLocationPath())), [router])
}
