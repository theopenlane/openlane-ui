'use client'

import React, { useState } from 'react'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { EyeNoneIcon } from '@radix-ui/react-icons'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Label } from '@repo/ui/label'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { normalizeUrl } from '@/utils/exportToCSV'

const formSchema = z.object({
  url: z.string().optional(),
})

type TFormValues = z.infer<typeof formSchema>

type CustomerLogoCardProps = {
  id: string
  name: string
  url?: string | null
  logoUrl?: string | null
  onUpdate: (args: { id: string; url?: string; logoFile?: File }) => Promise<void> | void
  onDelete: (id: string) => void
  isUpdating?: boolean
  isDeleting?: boolean
}

export default function CustomerLogoCard({ id, name, url, logoUrl, onUpdate, onDelete, isUpdating, isDeleting }: CustomerLogoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const form = useForm<TFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: url ?? '' },
  })

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setSelectedFile(uploaded.file)
    setPreview(URL.createObjectURL(uploaded.file))
  }

  const resetEdit = () => {
    setIsEditing(false)
    setSelectedFile(null)
    setPreview(null)
    form.reset({ url: url ?? '' })
  }

  const onSubmit = async (values: TFormValues) => {
    const nextUrl = values.url?.trim() ? values.url.trim() : undefined
    await onUpdate({
      id,
      url: nextUrl,
      logoFile: selectedFile || undefined,
    })
    setIsEditing(false)
    setSelectedFile(null)
    setPreview(null)
  }

  return (
    <Card className="group p-6">
      {!isEditing ? (
        <CardContent className="p-0">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-background overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeUrl(logoUrl)} alt={name} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  <EyeNoneIcon />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm mb-1">{name}</div>
              {url ? <div className="truncate text-xs text-muted-foreground">{url}</div> : <div className="truncate text-xs text-muted-foreground">No URL</div>}
            </div>

            <div className="flex items-center gap-3 text-muted-foreground ">
              <button onClick={() => setIsEditing(true)} aria-label={`Edit URL for ${name}`} disabled={isUpdating || isDeleting}>
                <Pencil className="h-4 w-4" />
              </button>

              <button onClick={() => onDelete(id)} aria-label={`Delete ${name}`} disabled={isDeleting || isUpdating}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm">Edit {name}</div>
            </div>

            <button onClick={resetEdit} aria-label="Close edit" disabled={isUpdating}>
              <X className="h-4 w-4" />
            </button>
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
                  </FormItem>
                )}
              />
              <div className="flex gap-4 pt-2">
                {preview ? (
                  <div>
                    <Label className="mb-2 block text-sm">New Preview</Label>
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-background overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="New preview" className="h-full w-full object-contain p-1" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="mb-2 block text-sm">Preview</Label>
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-background overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={normalizeUrl(logoUrl)} alt={name} className="h-full w-full object-contain p-1" />
                    </div>
                  </div>
                )}
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
