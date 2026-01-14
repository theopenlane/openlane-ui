'use client'

import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Plus, Eye, Loader2 } from 'lucide-react'

import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Card, CardContent } from '@repo/ui/cardpanel'

import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateTrustCenterEntity } from '@/lib/graphql-hooks/trust-center-entities'

import type { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'

const formSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  url: z.string().optional(),
})

type TFormValues = z.infer<typeof formSchema>

type CreateCustomerLogosProps = {
  trustCenterID: string
  onCreated?: () => void
}

export default function CreateCustomerLogo({ trustCenterID, onCreated }: CreateCustomerLogosProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEntity, isPending: isCreating } = useCreateTrustCenterEntity()

  const form = useForm<TFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', url: '' },
  })

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setSelectedFile(uploaded.file)
    setPreview(URL.createObjectURL(uploaded.file))
  }

  const normalizeUrl = (url?: string | null) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
    return `https://${url}`
  }

  const onSubmit = async (values: TFormValues) => {
    try {
      await createEntity({
        input: {
          trustCenterID,
          name: values.name,
          url: values.url || undefined,
        },
        logoFile: selectedFile || undefined,
      })

      successNotification({ title: 'Customer added' })

      form.reset()
      setSelectedFile(null)
      setPreview(null)
      onCreated?.()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Add Customer</h2>
          <p className="text-sm text-muted-foreground">Add customer logos and links to your Trust Center.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name..." className="bg-background" {...field} />
                  </FormControl>
                  {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                </FormItem>
              )}
            />

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

            <div className="flex gap-7 pt-2">
              <div>
                <Label className="mb-2 block text-sm">Preview</Label>
                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-md border border-muted bg-background">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={normalizeUrl(preview)!} alt="Logo preview" className="max-h-24 object-contain p-2" />
                  ) : (
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <Label className="mb-2 block text-sm">Upload Logo</Label>
                <FileUpload
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                  onFileUpload={handleUpload}
                  acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
                  maxFileSizeInMb={5}
                  multipleFiles={false}
                />
              </div>
            </div>

            <Button className="w-full" type="submit" disabled={isCreating} icon={isCreating ? <Loader2 className="animate-spin " /> : <Plus />} iconPosition="left">
              Add Customer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
