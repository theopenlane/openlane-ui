'use client'

import React, { createContext, use, useCallback, useMemo, useState } from 'react'

type MergeModeContextValue = {
  available: boolean
  active: boolean
  registerAvailability: (available: boolean) => void
  setActive: (active: boolean) => void
}

const MergeModeContext = createContext<MergeModeContextValue>({
  available: false,
  active: false,
  registerAvailability: () => {},
  setActive: () => {},
})

export const useMergeMode = () => use(MergeModeContext)

export const MergeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [available, setAvailable] = useState(false)
  const [active, setActive] = useState(false)

  const registerAvailability = useCallback((next: boolean) => {
    setAvailable(next)
    if (!next) {
      setActive(false)
    }
  }, [])

  const value = useMemo(() => ({ available, active, registerAvailability, setActive }), [available, active, registerAvailability])

  return <MergeModeContext value={value}>{children}</MergeModeContext>
}
