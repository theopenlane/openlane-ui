'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { UseFormReturn, FieldValues, FormProvider } from 'react-hook-form'
import { ObjectTypes } from '@repo/codegen/src/type-names'
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

  createMutation: {
    mutateAsync: (input: TCreateInput) => Promise<TCreateData>
    isPending: boolean
  }

  buildPayload: (data: TFormData) => Promise<TCreateInput>
  onClose: () => void
}

export function StepDialog<TFormData extends FieldValues, TCreateInput, TCreateData>(config: StepDialogConfig<TFormData, TCreateInput, TCreateData>) {
  const { objectType, form, steps, title, createMutation, buildPayload, onClose } = config
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [isOpen, setIsOpen] = useState(true)

  const { useStepper } = useMemo(
    () =>
      defineStepper(
        ...steps.map((step) => ({
          id: step.id,
          label: step.label,
          schema: step.schema,
        })),
      ),
    [steps],
  )

  const stepper = useStepper()

  const objectTypeName = objectType.charAt(0).toUpperCase() + objectType.slice(1).toLowerCase()
  const queryKey = [pluralizeTypeName(objectType.toLowerCase())]

  const currentStepConfig = steps.find((s) => s.id === stepper.current.id)

  const handleNext = async () => {
    if (!currentStepConfig) return

    const shape = 'shape' in currentStepConfig.schema ? (currentStepConfig.schema as { shape: Record<string, unknown> }).shape : {}
    const fieldsToValidate = Object.keys(shape)
    const isValid = await form.trigger(fieldsToValidate as Parameters<typeof form.trigger>[0])
    if (!isValid) return

    if (stepper.isLast) {
      await handleSubmit()
    } else {
      stepper.next()
    }
  }

  const handleBack = () => {
    if (stepper.isFirst) {
      handleClose()
    } else {
      stepper.prev()
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

      handleClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const dialogTitle = title ?? `Create ${toHumanLabel(objectType)}`

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <StepHeader stepper={stepper} />

        <FormProvider {...form}>
          <div className="py-4">{stepper.switch(Object.fromEntries(steps.map((step) => [step.id, () => step.render()])) as Record<string, () => React.ReactNode>)}</div>
        </FormProvider>

        <DialogFooter>
          <CancelButton onClick={handleBack} title={stepper.isFirst ? 'Cancel' : 'Back'} />
          {stepper.isLast ? (
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
