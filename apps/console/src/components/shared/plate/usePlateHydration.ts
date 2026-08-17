'use client'

import { useRef } from 'react'
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

// the editor emits its parsed initialValue as it mounts; recording that without
// dirtying the form keeps Cancel from prompting on an untouched form
export function usePlateHydration<TFieldValues extends FieldValues, TName extends Path<TFieldValues>>(form: UseFormReturn<TFieldValues>, name: TName) {
  const hydratedRef = useRef(false)

  return (value: PathValue<TFieldValues, TName>, onChange: (value: PathValue<TFieldValues, TName>) => void) => {
    if (hydratedRef.current) {
      onChange(value)
      return
    }
    hydratedRef.current = true
    form.setValue(name, value, { shouldDirty: false })
  }
}
