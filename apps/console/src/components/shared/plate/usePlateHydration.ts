'use client'

import { useCallback } from 'react'
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

export const usePlateHydration = <TFieldValues extends FieldValues>(form: Pick<UseFormReturn<TFieldValues>, 'resetField'>) => {
  const { resetField } = form

  return useCallback(
    <TName extends Path<TFieldValues>>(name: TName) =>
      (value: PathValue<TFieldValues, TName>) =>
        resetField(name, { defaultValue: value }),
    [resetField],
  )
}
