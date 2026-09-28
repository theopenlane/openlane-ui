'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import { RETURN_TO_PARAM, type TImportRoute } from './import-routes'

export const useImportExit = (route: TImportRoute) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFinished, setIsFinished] = useState(false)

  const returnHref = sanitizeLoginRedirect(searchParams.get(RETURN_TO_PARAM), route.listHref)
  const backLabel = returnHref.split('?')[0] === route.listHref.split('?')[0] ? `Back to ${route.listLabel}` : 'Back'

  useEffect(() => {
    if (isFinished) router.push(returnHref)
  }, [isFinished, returnHref, router])

  const leave = useCallback(() => router.push(returnHref), [router, returnHref])
  const finish = useCallback(() => setIsFinished(true), [])

  return { backLabel, isFinished, leave, finish }
}

export type TImportExit = ReturnType<typeof useImportExit>
