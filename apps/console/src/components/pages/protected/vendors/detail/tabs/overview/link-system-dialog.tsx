'use client'

import React, { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const linkSystemSchema = z.object({
  integrationId: z.string().min(1, 'Please select a system'),
})

type LinkSystemFormData = z.infer<typeof linkSystemSchema>

interface LinkSystemDialogProps {
  vendorId: string
  linkedIntegrationIds: string[]
  onClose: () => void
}

const LinkSystemDialog: React.FC<LinkSystemDialogProps> = ({ vendorId, linkedIntegrationIds, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const updateEntityMutation = useUpdateEntity()
  const { data: integrationsData, isLoading } = useGetIntegrations({})

  const availableIntegrations = useMemo(() => {
    const all = integrationsData?.integrations?.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? []
    return all.filter((i) => !linkedIntegrationIds.includes(i.id))
  }, [integrationsData, linkedIntegrationIds])

  const form = useForm<LinkSystemFormData>({
    resolver: zodResolver(linkSystemSchema),
    defaultValues: {
      integrationId: '',
    },
  })

  const selectedIntegrationId = useWatch({ control: form.control, name: 'integrationId' })
  const selectedIntegration = useMemo(() => {
    if (!selectedIntegrationId) return null
    return availableIntegrations.find((i) => i.id === selectedIntegrationId) ?? null
  }, [selectedIntegrationId, availableIntegrations])

  const handleSubmit = async (data: LinkSystemFormData) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          addIntegrationIDs: [data.integrationId],
        },
      })

      const integration = availableIntegrations.find((i) => i.id === data.integrationId)
      successNotification({
        title: 'System linked',
        description: `${integration?.name ?? 'System'} has been linked.`,
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
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Link System</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="integrationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    System <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a system'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIntegrations.length > 0 ? (
                          availableIntegrations.map((integration) => (
                            <SelectItem key={integration.id} value={integration.id}>
                              {integration.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_none" disabled>
                            No available systems
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Connection Type</FormLabel>
              <Select value={selectedIntegration?.integrationType ?? ''} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>{selectedIntegration?.integrationType && <SelectItem value={selectedIntegration.integrationType}>{selectedIntegration.integrationType}</SelectItem>}</SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Notes</FormLabel>
              <Textarea value={selectedIntegration?.description ?? ''} placeholder="Brief description of the vendor and services" readOnly disabled rows={3} />
            </FormItem>

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={updateEntityMutation.isPending} isSaving={updateEntityMutation.isPending} title="Link System" savingTitle="Linking..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default LinkSystemDialog
