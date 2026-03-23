'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import useContractFormSchema, { type AddContractFormData } from './use-contract-form-schema'

interface AddContractDialogProps {
  vendorId: string
  onClose: () => void
}

const AddContractDialog: React.FC<AddContractDialogProps> = ({ vendorId, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const updateEntityMutation = useUpdateEntity()

  const { form } = useContractFormSchema()

  const handleSubmit = async (data: AddContractFormData) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          ...(data.contractStartDate ? { contractStartDate: new Date(data.contractStartDate).toISOString() } : {}),
          ...(data.contractEndDate ? { contractEndDate: new Date(data.contractEndDate).toISOString() } : {}),
          ...(data.contractRenewalAt ? { contractRenewalAt: new Date(data.contractRenewalAt).toISOString() } : {}),
          ...(data.terminationNoticeDays ? { terminationNoticeDays: parseInt(data.terminationNoticeDays, 10) } : {}),
          ...(data.annualSpend ? { annualSpend: parseFloat(data.annualSpend) } : {}),
          ...(data.spendCurrency ? { spendCurrency: data.spendCurrency } : {}),
          ...(data.billingModel ? { billingModel: data.billingModel } : {}),
          autoRenews: data.autoRenews ?? false,
        },
      })

      successNotification({
        title: 'Contract added',
        description: 'Contract details have been successfully saved.',
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Contract</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractRenewalAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terminationNoticeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termination Notice Days</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annualSpend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Spend</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spendCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spend Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual, Monthly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoRenews"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-8">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Auto-Renew</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={updateEntityMutation.isPending} isSaving={updateEntityMutation.isPending} title="Save Contract" savingTitle="Saving..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddContractDialog
