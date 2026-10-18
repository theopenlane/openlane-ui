'use client'

import React, { useState } from 'react'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Card, CardContent } from '@repo/ui/cardpanel'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateTrustCenterEntity } from '@/lib/graphql-hooks/trust-center-entity'
import type { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { useCreateCustomerLogoForm, type TCreateCustomerLogoFormValues } from './hooks/use-customer-logo-form-schema'

type CreateCustomerLogosProps = {
  trustCenterID: string
  onCreated?: () => void
}

const CreateCustomerLogo = ({ trustCenterID, onCreated }: CreateCustomerLogosProps) => {
  const [uploadedLogo, setUploadedLogo] = useState<TUploadedFile | null>(null)
  const [uploadResetKey, setUploadResetKey] = useState(0)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEntity, isPending: isCreating } = useCreateTrustCenterEntity()

  const form = useCreateCustomerLogoForm()

  const onSubmit = async (values: TCreateCustomerLogoFormValues) => {
    try {
      await createEntity({
        input: {
          trustCenterID,
          name: values.name,
          url: values.url || undefined,
        },
        logoFile: uploadedLogo?.file,
      })

      successNotification({ title: 'Customer added' })

      form.reset()
      setUploadedLogo(null)
      setUploadResetKey((key) => key + 1)
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
                  <FormLabel required>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name..." className="bg-background" {...field} />
                  </FormControl>
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-7 pt-2">
              <div>
                <Label className="mb-2 block text-sm">Preview</Label>
                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-md border border-muted bg-background">
                  {uploadedLogo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadedLogo.url} alt="Logo preview" className="max-h-24 object-contain p-2" />
                  ) : (
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <Label className="mb-2 block text-sm">Upload Logo</Label>
                <FileUpload
                  key={uploadResetKey}
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                  onFileUpload={setUploadedLogo}
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

export default CreateCustomerLogo
