'use client'

import { useRef } from 'react'
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

// absorbs the editor's mount emission so it doesn't dirty the form
export function usePlateHydration<TFieldValues extends FieldValues, TName extends Path<TFieldValues>>(form: UseFormReturn<TFieldValues>, name: TName, initialValue?: unknown) {
  const pendingRef = useRef(!!initialValue)

  return (value: PathValue<TFieldValues, TName>, onChange: (value: PathValue<TFieldValues, TName>) => void) => {
    if (!pendingRef.current) {
      onChange(value)
      return
    }
    pendingRef.current = false
    form.setValue(name, value, { shouldDirty: false })
  }
}
