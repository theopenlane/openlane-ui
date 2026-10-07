import { useCallback } from 'react'
import { useFormContext, type FieldValues, type Path, type PathValue } from 'react-hook-form'
import { isDeepEqual } from '@/utils/input-diff'

export type TPersistOptions = { throwOnError?: boolean }

export const usePersistFormField = <TFieldValues extends FieldValues>() => {
  const { resetField, getValues, setValue, getFieldState, formState } = useFormContext<TFieldValues>()

  return useCallback(
    async <TName extends Path<TFieldValues>>(name: TName, value: PathValue<TFieldValues, TName>, save: (options: TPersistOptions) => Promise<void> | void) => {
      const beforeSave = getValues(name)
      const formBaseline = formState.defaultValues
      const isSameForm = () => formState.defaultValues === formBaseline
      try {
        await save({ throwOnError: true })
        if (!isSameForm()) {
          return
        }
        const latest = getValues(name)
        resetField(name, { defaultValue: value })
        if (!isDeepEqual(latest, beforeSave) && !isDeepEqual(latest, value)) {
          setValue(name, latest, { shouldDirty: true })
        }
      } catch {
        if (isSameForm() && !getFieldState(name).isDirty) {
          setValue(name, value, { shouldDirty: true })
        }
      }
    },
    [resetField, getValues, setValue, getFieldState, formState],
  )
}
