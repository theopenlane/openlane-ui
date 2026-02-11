'use client'

import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SubprocessorSelectField } from '../sheet/form-fields/subprocessor-select-field'
import { CountriesField } from '../sheet/form-fields/countries-field'
import { CategoryField } from '../sheet/form-fields/category-field'
import { useCreateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { CreateSubprocessorMutation } from '@repo/codegen/src/schema'
import { useCreateCustomTypeEnum, useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

const schema = z.object({
  subprocessorID: z.string().min(1, 'Please select a subprocessor'),
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
})

type FormData = z.infer<typeof schema>

export const AddExistingDialog = ({
  createdSubprocessor,
  onClose,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  createdSubprocessor: CreateSubprocessorMutation['createSubprocessor']['subprocessor'] | null
  onClose: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (value: boolean) => void
}) => {
  const [open, setOpen] = useState(false)
  const isControlled = typeof controlledOpen === 'boolean'
  const resolvedOpen = isControlled ? controlledOpen : open
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createTCSubprocessor } = useCreateTrustCenterSubprocessor()

  const { mutateAsync: createEnum } = useCreateCustomTypeEnum()
  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.TRUST_CENTER_SUBPROCESSOR),
      field: 'kind',
    },
  })

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subprocessorID: '',
      category: '',
      countries: [],
    },
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = formMethods

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) {
      setOpen(value)
    }
    onOpenChange?.(value)
    if (!value) {
      onClose()
      reset()
    }
  }

  const ensureCategoryExists = async (categoryName: string) => {
    const exists = enumOptions.some((opt) => opt.value === categoryName || opt.label === categoryName)

    if (!exists) {
      await createEnum({
        name: categoryName,
        objectType: 'trust_center_subprocessor',
        field: 'kind',
      })
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      await ensureCategoryExists(data.category)

      await createTCSubprocessor({
        input: {
          subprocessorID: data.subprocessorID,
          trustCenterSubprocessorKindName: data.category,
          countries: data.countries,
        },
      })

      successNotification({
        title: 'Subprocessor Added',
        description: 'The subprocessor has been added to your Trust Center.',
      })

      handleOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error Adding Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  useEffect(() => {
    if (!isControlled) {
      setOpen(!!createdSubprocessor)
    }
    onOpenChange?.(!!createdSubprocessor)
    reset({ subprocessorID: createdSubprocessor?.id || '' })
  }, [createdSubprocessor, isControlled, onOpenChange, reset])

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add to Trust Center</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form id="add-existing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
            <SubprocessorSelectField isEditing={true} createdSubprocessor={createdSubprocessor} />
            <CountriesField isEditing={true} />
            <CategoryField isEditing={true} />
          </form>
        </FormProvider>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => handleOpenChange(false)} type="button">
            Back
          </Button>
          <Button type="submit" form="add-existing-form" disabled={isSubmitting} variant="primary">
            {isSubmitting ? 'Adding...' : 'Add to Trust Center'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
