'use client'

import { useEffect, useRef } from 'react'

export const usePlateChangeGuard = (isActive: boolean, isFormInitialized?: boolean) => {
  const hasEmittedInitialChangeRef = useRef(false)

  useEffect(() => {
    if (!isActive) {
      hasEmittedInitialChangeRef.current = false
    }
  }, [isActive])

  return () => {
    if (!isFormInitialized) {
      return false
    }

    if (!hasEmittedInitialChangeRef.current) {
      hasEmittedInitialChangeRef.current = true
      return false
    }

    return true
  }
}
