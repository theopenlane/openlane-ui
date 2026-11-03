'use client'

import React, { useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type GetStandardDetailsQuery, type UpdateStandardInput } from '@repo/codegen/src/schema'
import { orClear, omit, passthrough, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateStandard } from '@/lib/graphql-hooks/standard'
import { VersionBump } from '@/lib/enums/revision-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { FrameworkDetailsFields } from './framework-details-fields'
import { FrameworkIconPicker } from './framework-icon-picker'
import { type TEditFrameworkFormData, useEditFrameworkForm } from './hooks/use-custom-framework-form-schema'
import { standardLogoSrc } from './custom-framework'

type TStandardDetails = NonNullable<GetStandardDetailsQuery['standard']>

const REVISION_BUMP_OPTIONS = enumToOptions(VersionBump).filter((option) => option.value !== VersionBump.DRAFT)

const STANDARD_UPDATE_FIELDS = {
  name: passthrough,
  shortName: orClear('clearShortName'),
  framework: orClear('clearFramework'),
  standardType: orClear('clearStandardType'),
  governingBody: orClear('clearGoverningBody'),
  version: orClear('clearVersion'),
  link: orClear('clearLink'),
  tags: orClear('clearTags'),
  description: orClear('clearDescription'),
  RevisionBump: omit,
} satisfies TFieldMappers<TEditFrameworkFormData, UpdateStandardInput>

const toFormValues = (standard: TStandardDetails): TEditFrameworkFormData => ({
  name: standard.name,
  shortName: standard.shortName ?? '',
  framework: standard.framework ?? '',
  standardType: standard.standardType ?? '',
  governingBody: standard.governingBody ?? '',
  version: standard.version ?? '',
  link: standard.link ?? '',
  tags: standard.tags ?? [],
  description: standard.description ?? '',
  RevisionBump: VersionBump.PATCH,
})

type TEditFrameworkDialogProps = {
  standard: TStandardDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditFrameworkDialog: React.FC<TEditFrameworkDialogProps> = ({ standard, open, onOpenChange }) => {
  const form = useEditFrameworkForm()
  const buildDirtyInput = useDirtyInput(form)
  const { mutateAsync: updateStandard, isPending } = useUpdateStandard()
  const { successNotification, errorNotification } = useNotification()
  const [logo, setLogo] = useState<TUploadedFile | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const shortName = useWatch({ control: form.control, name: 'shortName' })

  const existingLogoSrc = removeLogo ? null : standardLogoSrc(standard)
  const shortNameChanged = shortName !== (standard.shortName ?? '')

  useEffect(() => {
    if (!open) return
    form.reset(toFormValues(standard))
    setLogo(null)
    setRemoveLogo(false)
  }, [open, standard, form])

  const onSubmit = async (values: TEditFrameworkFormData) => {
    const input = await buildDirtyInput<UpdateStandardInput>(values, STANDARD_UPDATE_FIELDS, {
      extras: values.RevisionBump === VersionBump.PATCH ? undefined : { RevisionBump: values.RevisionBump },
    })
    const logoInput: Partial<UpdateStandardInput> = removeLogo && !logo ? { clearLogoFile: true } : {}
    const fullInput = { ...input, ...logoInput }

    if (!Object.keys(fullInput).length && !logo) {
      form.reset(values)
      onOpenChange(false)
      return
    }

    try {
      await updateStandard({ updateStandardId: standard.id, input: fullInput, logoFile: logo?.file })
      successNotification({ title: 'Framework updated', description: 'Your changes have been saved.' })
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Could not update the framework', description: parseErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit framework details</DialogTitle>
          <DialogDescription>Changes to {standard.name} apply everywhere the framework is shown.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-framework-form"
            onSubmit={(event) => {
              event.stopPropagation()
              form.handleSubmit(onSubmit)(event)
            }}
            className="flex flex-col gap-6"
          >
            <FrameworkDetailsFields />
            {shortNameChanged && standard.controls.totalCount > 0 && (
              <Callout variant="warning" compact>
                Controls already in this framework keep the old short name as their reference framework until they are edited.
              </Callout>
            )}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Icon</p>
              <FrameworkIconPicker
                shortName={shortName ?? ''}
                logoSrc={logo?.url ?? existingLogoSrc}
                onUpload={(uploaded) => {
                  setLogo(uploaded)
                  setRemoveLogo(false)
                }}
                onRemove={() => {
                  setLogo(null)
                  setRemoveLogo(true)
                }}
              />
            </div>
            <FormField
              control={form.control}
              name="RevisionBump"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Save as revision</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-60">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REVISION_BUMP_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Current revision {standard.revision ?? '-'}. Every save bumps the patch version unless you pick a larger change.</FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <CancelButton onClick={() => onOpenChange(false)} />
          <SaveButton form="edit-framework-form" disabled={isPending} isSaving={isPending} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
