'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose, Save } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useGetTrustCenterSubprocessorByID, useUpdateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessors'

import { SubprocessorSelectField } from './form-fields/subprocessor-select-field'
import { CategoryField } from './form-fields/category-field'
import { CountriesField } from './form-fields/countries-field'

const schema = z.object({
  subprocessorID: z.string().min(1, 'Please select a subprocessor'),
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
})

type FormData = z.infer<typeof schema>

export const EditTrustCenterSubprocessorSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trustCenterSubprocessorId = searchParams.get('id')

  const [open, setOpen] = useState(!!trustCenterSubprocessorId)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateTCSubprocessor } = useUpdateTrustCenterSubprocessor()

  const { data } = useGetTrustCenterSubprocessorByID({ trustCenterSubprocessorId: trustCenterSubprocessorId || '' })

  const { subprocessors } = useGetSubprocessors({ where: { hasTrustCenterSubprocessors: false } })

  const subprocessorOptions = useMemo(
    () =>
      subprocessors.map((sp) => ({
        label: sp?.name ?? '',
        value: sp?.id ?? '',
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

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)

    const params = new URLSearchParams(window.location.search)
    if (!isOpen) {
      params.delete('id')
      router.push(params.toString() ? `?${params.toString()}` : '?')
      return
    }

    router.push(params.toString() ? `?${params.toString()}` : '?')
  }

  useEffect(() => {
    setOpen(!!trustCenterSubprocessorId)
  }, [trustCenterSubprocessorId])

  useEffect(() => {
    if (!data) return
    reset({
      subprocessorID: data.trustCenterSubprocessor?.subprocessor?.id ?? '',
      category: data.trustCenterSubprocessor?.category ?? '',
      countries: data.trustCenterSubprocessor?.countries ?? [],
    })
  }, [data, reset])

  const onSubmit = async (data: FormData) => {
    if (!trustCenterSubprocessorId) return

    try {
      await updateTCSubprocessor({
        id: trustCenterSubprocessorId,
        input: {
          subprocessorID: data.subprocessorID,
          category: data.category,
          countries: data.countries,
        },
      })

      successNotification({
        title: 'Subprocessor Updated',
        description: 'The trust center subprocessor has been successfully updated.',
      })

      handleOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error Updating Trust Center Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  if (!trustCenterSubprocessorId) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetTitle />
        <SheetDescription />
        <SheetHeader>
          <div className="flex justify-between">
            <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />

            <div className="flex justify-start gap-2 items-center">
              <div className="flex gap-3">
                <Button
                  className="h-8 p-2"
                  icon={<Copy />}
                  iconPosition="left"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    successNotification({
                      title: 'Link copied',
                      description: 'Trust center subprocessor link copied to clipboard.',
                    })
                  }}
                >
                  Copy link
                </Button>

                <Button variant="primary" type="submit" form="tc-subprocessor-form" className="h-8 p-2" icon={<Save />} iconPosition="left">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="tc-subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <SubprocessorSelectField options={subprocessorOptions} isEditing />
            <CategoryField isEditing />
            <CountriesField isEditing />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
