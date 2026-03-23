'use client'

import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const addAssetSchema = z.object({
  assetId: z.string().min(1, 'Please select an asset'),
})

type AddAssetFormData = z.infer<typeof addAssetSchema>

interface AddAssetDialogProps {
  vendorId: string
  linkedAssetIds: string[]
  onClose: () => void
  onCreateNew: () => void
}

const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ vendorId, linkedAssetIds, onClose, onCreateNew }) => {
  const { successNotification, errorNotification } = useNotification()
  const updateEntityMutation = useUpdateEntity()
  const { assetsNodes, isLoading } = useAssetsWithFilter({})

  const availableAssets = useMemo(() => {
    return assetsNodes.filter((a) => !linkedAssetIds.includes(a.id))
  }, [assetsNodes, linkedAssetIds])

  const form = useForm<AddAssetFormData>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      assetId: '',
    },
  })

  const handleSubmit = async (data: AddAssetFormData) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          addAssetIDs: [data.assetId],
        },
      })

      const asset = availableAssets.find((a) => a.id === data.assetId)
      successNotification({
        title: 'Asset added',
        description: `${asset?.displayName || asset?.name || 'Asset'} has been added.`,
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
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose the systems or assets that rely on this vendor. This helps identify where the vendor is used across your platform for risk reviews, vendor assessments, and audits.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select system that uses this vendor</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select an asset'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssets.length > 0 ? (
                          availableAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.displayName || asset.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_none" disabled>
                            No available assets
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {form.formState.errors.assetId?.message && <p className="text-sm text-red-500">{form.formState.errors.assetId.message}</p>}
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t see the system you&apos;re looking for?{' '}
                    <button type="button" onClick={onCreateNew} className="text-primary underline hover:text-primary/80">
                      Create a new asset
                    </button>
                    .
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={updateEntityMutation.isPending} isSaving={updateEntityMutation.isPending} title="Add Asset" savingTitle="Adding..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAssetDialog
