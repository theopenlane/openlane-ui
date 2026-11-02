'use client'

import React, { useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { EyeNoneIcon } from '@radix-ui/react-icons'
import { type TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Button } from '@repo/ui/button'
import { CustomerLogoTile } from './customer-logo-tile'
import { useEditCustomerLogoForm, type TEditCustomerLogoFormValues } from './hooks/use-customer-logo-form-schema'
import { orClear, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type UpdateTrustCenterEntityInput } from '@repo/codegen/src/schema'

const ENTITY_UPDATE_FIELDS = {
  url: orClear('clearURL'),
} satisfies TFieldMappers<TEditCustomerLogoFormValues, UpdateTrustCenterEntityInput>

type CustomerLogoCardProps = {
  id: string
  name: string
  url?: string | null
  logoUrl?: string | null
  logoBackground: string
  onUpdate: (args: { id: string; input: UpdateTrustCenterEntityInput; logoFile?: File }) => Promise<boolean>
  onDelete: (id: string) => void
  isUpdating?: boolean
  isDeleting?: boolean
  canEdit?: boolean
}

export default function CustomerLogoCard({ id, name, url, logoUrl, logoBackground, onUpdate, onDelete, isUpdating, isDeleting, canEdit }: CustomerLogoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const form = useEditCustomerLogoForm(url)
  const buildDirtyInput = useDirtyInput(form)

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setSelectedFile(uploaded.file)
    setPreview(uploaded.url ?? null)
  }

  const startEdit = () => {
    form.reset({ url: url ?? '' })
    setIsEditing(true)
  }

  const resetEdit = () => {
    setIsEditing(false)
    setSelectedFile(null)
    setPreview(null)
    form.reset({ url: url ?? '' })
  }

  const onSubmit = async (values: TEditCustomerLogoFormValues) => {
    const input = await buildDirtyInput<UpdateTrustCenterEntityInput>(values, ENTITY_UPDATE_FIELDS)
    if (Object.keys(input).length > 0 || selectedFile) {
      const saved = await onUpdate({
        id,
        input,
        logoFile: selectedFile || undefined,
      })
      if (!saved) return
    }
    resetEdit()
  }

  return (
    <Card className="group p-6">
      {!isEditing ? (
        <CardContent className="p-0">
          <div className="flex gap-3">
            <CustomerLogoTile background={logoBackground} src={logoUrl} alt={name} placeholder={<EyeNoneIcon />} />

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm mb-1">{name}</div>
              {url ? <div className="truncate text-xs text-muted-foreground">{url}</div> : <div className="truncate text-xs text-muted-foreground">No URL</div>}
            </div>

            {canEdit && (
              <div className="flex items-center gap-1">
                <Button type="button" variant="icon" size="icon-sm" icon={<Pencil />} aria-label={`Edit URL for ${name}`} onClick={startEdit} disabled={isUpdating || isDeleting} />
                <Button type="button" variant="icon" size="icon-sm" icon={<Trash2 />} aria-label={`Delete ${name}`} onClick={() => onDelete(id)} disabled={isDeleting || isUpdating} />
              </div>
            )}
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm">Edit {name}</div>
            </div>

            <Button type="button" variant="icon" size="icon-sm" icon={<X />} aria-label="Close edit" onClick={resetEdit} disabled={isUpdating} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4 pt-2">
                <div>
                  <Label className="mb-2 block text-sm">{preview ? 'New Preview' : 'Preview'}</Label>
                  <CustomerLogoTile background={logoBackground} src={preview ?? logoUrl} alt={name} placeholder={<EyeNoneIcon />} className="size-20" />
                </div>
                <div className="flex-1">
                  <Label className="mb-2 block text-sm">Update Logo</Label>
                  <FileUpload
                    acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                    onFileUpload={handleUpload}
                    acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
                    maxFileSizeInMb={5}
                    multipleFiles={false}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <CancelButton onClick={resetEdit} disabled={isUpdating}></CancelButton>
                <SaveButton disabled={isUpdating} />
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  )
}
