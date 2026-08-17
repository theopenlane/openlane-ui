'use client'

import { useEffect, useState } from 'react'

// callers clear their edit record as a sheet starts closing; holding the record it
// was opened with until it opens again stops the form flashing its create state
// during the close animation
export function useRetainedWhileOpen<T>(open: boolean, value: T | null | undefined): T | null {
  const [retained, setRetained] = useState<T | null>(null)

  useEffect(() => {
    if (open) setRetained(value ?? null)
  }, [open, value])

  return retained
}
