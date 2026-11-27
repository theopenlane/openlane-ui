'use client'

import * as React from 'react'

type FormItemContextValue = {
  id: string
  hasLabel?: boolean
  setHasLabel?: (hasLabel: boolean) => void
}

export const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

export const useFormItemLabelId = (): string | undefined => {
  const { id, hasLabel } = React.useContext(FormItemContext)
  return id && hasLabel ? `${id}-form-item-label` : undefined
}
