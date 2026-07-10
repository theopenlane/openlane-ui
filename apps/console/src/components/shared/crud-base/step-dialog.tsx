'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UseFormReturn, type FieldValues, FormProvider } from 'react-hook-form'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { defineStepper } from '@stepperize/react'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { pluralizeTypeName, toHumanLabel } from '@/utils/strings'
import type { StepConfig } from './types'

export interface StepDialogConfig<TFormData extends FieldValues, TCreateInput, TCreateData> {
  objectType: ObjectTypes
  form: UseFormReturn<TFormData>
  steps: StepConfig[]
  title?: string
  dialogClassName?: string

  createMutation: {
    mutateAsync: (input: TCreateInput) => Promise<TCreateData>
    isPending: boolean
  }

  buildPayload: (data: TFormData) => Promise<TCreateInput>
  onClose: () => void
}

export function StepDialog<TFormData extends FieldValues, TCreateInput, TCreateData>(config: StepDialogConfig<TFormData, TCreateInput, TCreateData>) {
  const { objectType, form, steps, title, dialogClassName, createMutation, buildPayload, onClose } = config
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const [stepperDef] = useState(() => defineStepper(...steps.map((step) => ({ id: step.id }))))
  const stepper = stepperDef.useStepper()

  const objectTypeName = toHumanLabel(objectType)
  const queryKey = [pluralizeTypeName(objectType.toLowerCase())]

  const currentStepConfig = steps.find((s) => s.id === stepper.state.current.data.id)

  const handleNext = async () => {
    if (!currentStepConfig) return

    const fieldsToValidate = Object.keys(currentStepConfig.schema.shape)
    const isValid = await form.trigger(fieldsToValidate as Parameters<typeof form.trigger>[0])
    if (!isValid) return

    if (stepper.state.isLast) {
      await handleSubmit()
    } else {
      stepper.navigation.next()
    }
  }

  const handleBack = () => {
    if (stepper.state.isFirst) {
      onClose()
    } else {
      stepper.navigation.prev()
    }
  }

  const handleSubmit = async () => {
    try {
      const formData = form.getValues()
      const payload = await buildPayload(formData)
      await createMutation.mutateAsync(payload)

      queryClient.invalidateQueries({ queryKey })
      successNotification({
        title: `${objectTypeName} Created`,
        description: `The ${objectTypeName.toLowerCase()} has been successfully created.`,
      })

      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const dialogTitle = title ?? `Create ${toHumanLabel(objectType)}`

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className={dialogClassName ?? 'sm:max-w-150'} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <StepHeader stepper={stepper} />

        <FormProvider {...form}>
          <div className="overflow-y-auto max-h-[60vh] pt-2">{currentStepConfig?.render()}</div>
        </FormProvider>

        <DialogFooter>
          <CancelButton onClick={handleBack} title={stepper.state.isFirst ? 'Cancel' : 'Back'} />
          {stepper.state.isLast ? (
            <SaveButton onClick={handleNext} disabled={createMutation.isPending} isSaving={createMutation.isPending} title="Create" savingTitle="Creating..." />
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
