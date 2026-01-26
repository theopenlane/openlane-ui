'use client'

import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessors'
import { SubprocessorSelectField } from '../sheet/form-fields/subprocessor-select-field'
import { CountriesField } from '../sheet/form-fields/countries-field'
import { CategoryField } from '../sheet/form-fields/category-field'
import { useCreateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { SquarePlus } from 'lucide-react'

const schema = z.object({
  subprocessorID: z.string().min(1, 'Please select a subprocessor'),
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
})

type FormData = z.infer<typeof schema>

export const AddExistingDialog = ({ createdSubprocessorId, onClose }: { createdSubprocessorId: string | null; onClose: () => void }) => {
  const [open, setOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createTCSubprocessor } = useCreateTrustCenterSubprocessor()
  const { subprocessors } = useGetSubprocessors({
    where: { hasTrustCenterSubprocessors: false },
  })

  const subprocessorOptions = React.useMemo(
    () =>
      subprocessors.map((sp) => ({
        label: sp?.name ?? '',
        value: sp?.id ?? '',
        logo: sp?.logoFile?.presignedURL || sp?.logoRemoteURL,
      })) ?? [],
    [subprocessors],
  )

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

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      onClose()
      reset()
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createTCSubprocessor({
        input: {
          subprocessorID: data.subprocessorID,
          category: data.category,
          countries: data.countries,
        },
      })

      successNotification({
        title: 'Subprocessor Added',
        description: 'The subprocessor has been added to your Trust Center.',
      })

      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error Adding Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  useEffect(() => {
    setOpen(!!createdSubprocessorId)
    reset({ subprocessorID: createdSubprocessorId || '' })
  }, [createdSubprocessorId, reset])

  if (!subprocessors.length) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button icon={<SquarePlus size={16} />} iconPosition="left" variant="secondary">
          Add Existing
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add to Trust Center</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form id="add-existing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
            <SubprocessorSelectField options={subprocessorOptions} isEditing={true} />
            <CountriesField isEditing={true} />
            <CategoryField isEditing={true} />
          </form>
        </FormProvider>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} type="button">
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
