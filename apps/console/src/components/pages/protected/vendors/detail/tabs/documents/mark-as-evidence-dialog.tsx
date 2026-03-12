'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useUpdateFileCategoryType } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const markAsEvidenceSchema = z.object({
  name: z.string().min(1, 'Evidence name is required'),
})

type MarkAsEvidenceFormData = z.infer<typeof markAsEvidenceSchema>

interface MarkAsEvidenceDialogProps {
  fileId: string
  fileName: string
  vendorId: string
  onClose: () => void
}

const MarkAsEvidenceDialog: React.FC<MarkAsEvidenceDialogProps> = ({ fileId, fileName, vendorId, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const { mutateAsync: updateFileCategoryType } = useUpdateFileCategoryType()
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([])

  const { controls, isLoading: controlsLoading } = useGetAllControls({
    where: { hasEntitiesWith: [{ id: vendorId }] },
    pagination: { page: 1, pageSize: 100, query: { first: 100 } },
    orderBy: [],
  })

  const form = useForm<MarkAsEvidenceFormData>({
    resolver: zodResolver(markAsEvidenceSchema),
    defaultValues: {
      name: fileName,
    },
  })

  const toggleControl = (controlId: string) => {
    setSelectedControlIds((prev) => (prev.includes(controlId) ? prev.filter((id) => id !== controlId) : [...prev, controlId]))
  }

  const handleSubmit = async (data: MarkAsEvidenceFormData) => {
    try {
      await createEvidence({
        input: {
          name: data.name,
          source: 'Vendor Documents',
          fileIDs: [fileId],
          ...(selectedControlIds.length > 0 ? { controlIDs: selectedControlIds } : {}),
        },
      })

      await updateFileCategoryType({
        updateFileId: fileId,
        input: { categoryType: 'evidence' },
      })

      successNotification({
        title: 'Marked as evidence',
        description: `"${data.name}" has been created as evidence.`,
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Mark as Evidence</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Evidence Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g. "SOC 2 report for AWS"' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Attach to Controls</FormLabel>
              {controlsLoading ? (
                <p className="text-sm text-muted-foreground">Loading controls...</p>
              ) : controls && controls.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                  {controls.map((control) => (
                    <label key={control.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox checked={selectedControlIds.includes(control.id)} onCheckedChange={() => toggleControl(control.id)} />
                      <span>
                        {control.refCode} — {control.title ?? control.description ?? ''}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No controls linked to this vendor</p>
              )}
            </div>

            <DialogFooter>
              <CancelButton onClick={onClose} />
              <SaveButton disabled={isPending} isSaving={isPending} title="Create Evidence" savingTitle="Creating..." />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MarkAsEvidenceDialog
