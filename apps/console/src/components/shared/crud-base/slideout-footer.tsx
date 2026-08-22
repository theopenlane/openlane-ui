'use client'

import React from 'react'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type SlideoutFormFooterBase = {
  onCancel?: () => void
  isPending?: boolean
  disabled?: boolean
  saveLabel?: string
  savingLabel?: string
  secondaryActions?: React.ReactNode
}

export type SlideoutFormFooterProps = SlideoutFormFooterBase & ({ formId: string; onSave?: never } | { formId?: never; onSave: () => void })

export const SlideoutFormFooter = ({ formId, onSave, onCancel, isPending, disabled, saveLabel, savingLabel, secondaryActions }: SlideoutFormFooterProps) => (
  <>
    {onCancel && <CancelButton disabled={isPending} onClick={onCancel} />}
    {secondaryActions}
    <SaveButton
      form={onSave ? undefined : formId}
      type={onSave ? 'button' : 'submit'}
      onClick={onSave}
      disabled={disabled || isPending}
      isSaving={isPending}
      title={saveLabel}
      savingTitle={savingLabel}
    />
  </>
)
