'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

interface AddDomainDialogProps {
  vendorId: string
  existingDomains: string[]
  onClose: () => void
}

const AddDomainDialog: React.FC<AddDomainDialogProps> = ({ vendorId, existingDomains, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const updateEntityMutation = useUpdateEntity()

  const addDomainSchema = z.object({
    domain: z
      .string()
      .min(1, 'Domain is required')
      .regex(DOMAIN_REGEX, 'Enter a valid domain (e.g. example.com)')
      .refine((val) => !existingDomains.some((d) => d.toLowerCase() === val.toLowerCase()), {
        message: 'This domain already exists',
      }),
  })

  type AddDomainFormData = z.infer<typeof addDomainSchema>

  const form = useForm<AddDomainFormData>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: {
      domain: '',
    },
  })

  const handleSubmit = async (data: AddDomainFormData) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          domains: [...existingDomains, data.domain],
        },
      })

      successNotification({
        title: 'Domain added',
        description: `${data.domain} has been successfully added.`,
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Domain <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={updateEntityMutation.isPending} isSaving={updateEntityMutation.isPending} title="Add Domain" savingTitle="Adding..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddDomainDialog
