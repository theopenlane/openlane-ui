'use client'

import React, { useEffect } from 'react'
import { FormProvider, useWatch } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { DescriptionField } from '../sheet/form-fields/description-field'
import { TagsField } from '../sheet/form-fields/tags-field'
import { logoPreviewUrl, resolveLogo, type TCustomDetails, type TResolvedRow } from './subprocessor-import-rows'
import { useCustomSubprocessorDetailsFormSchema } from './use-custom-subprocessor-details-form-schema'

const LOGO_PREVIEW_DEBOUNCE_MS = 400

type TCustomSubprocessorDetailsDialogProps = {
  row: TResolvedRow | null
  onOpenChange: (open: boolean) => void
  onSave: (rowIndex: number, details: TCustomDetails) => void
}

export const CustomSubprocessorDetailsDialog: React.FC<TCustomSubprocessorDetailsDialogProps> = ({ row, onOpenChange, onSave }) => {
  const { form } = useCustomSubprocessorDetailsFormSchema()
  const {
    reset,
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form
  const [website, logoRemoteURL] = useWatch({ control, name: ['website', 'logoRemoteURL'] })
  const previewWebsite = useDebounce(website, LOGO_PREVIEW_DEBOUNCE_MS)
  const previewLogoUrl = useDebounce(logoRemoteURL, LOGO_PREVIEW_DEBOUNCE_MS)

  useEffect(() => {
    if (row) reset(row.details)
  }, [row, reset])

  const submit = handleSubmit((details) => {
    if (!row) return
    onSave(row.source.rowIndex, details)
    onOpenChange(false)
  })

  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{row?.source.name}</DialogTitle>
          <DialogDescription>This subprocessor is not in Openlane&apos;s catalog, so it will be created as a custom subprocessor for your organization.</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form id="custom-subprocessor-details" onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <VendorLogo name={row?.source.name ?? ''} logoUrl={logoPreviewUrl(resolveLogo({ website: previewWebsite, logoRemoteURL: previewLogoUrl }))} />
              <p className="text-xs text-muted-foreground">The logo comes from the logo URL when there is one, otherwise from the website&apos;s icon.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-subprocessor-website">Website</Label>
              <Input id="custom-subprocessor-website" placeholder="example.com" {...register('website')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-subprocessor-logo">Logo URL</Label>
              <Input id="custom-subprocessor-logo" placeholder="https://example.com/logo.png" {...register('logoRemoteURL')} />
              {errors.logoRemoteURL && <p className="text-sm text-destructive">{errors.logoRemoteURL.message}</p>}
            </div>
            <DescriptionField isEditing />
            <TagsField isEditing />
          </form>
        </FormProvider>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="custom-subprocessor-details">
            Save details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
