'use client'

import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, Form } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useRouter, usePathname } from 'next/navigation'
import { useCreateEvidence } from '@/lib/graphql-hooks/evidence'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type DiagramType } from './platform-diagrams-section'
import { toHumanLabel } from '@/utils/strings'

const markAsEvidenceSchema = z.object({
  name: z.string().min(1, 'Evidence name is required'),
})

type MarkAsEvidenceFormData = z.infer<typeof markAsEvidenceSchema>

const ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL] as const

interface MarkAsDiagramEvidenceDialogProps {
  fileId: string
  fileName: string
  diagramType: DiagramType
  platformId: string
  platformName: string
  onClose: () => void
}

const MarkAsDiagramEvidenceDialog: React.FC<MarkAsDiagramEvidenceDialogProps> = ({ fileId, fileName, diagramType, platformId, platformName, onClose }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createEvidence, isPending } = useCreateEvidence()
  const [selectedIds, setSelectedIds] = useState<TObjectAssociationMap>({})

  const form = useForm<MarkAsEvidenceFormData>({
    resolver: zodResolver(markAsEvidenceSchema),
    defaultValues: {
      name: fileName,
    },
  })

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap) => {
    setSelectedIds(updatedMap)
  }, [])

  const openEvidence = (evidenceId: string) => {
    router.push(`${pathname}?id=${evidenceId}`)
  }

  const handleSubmit = async (data: MarkAsEvidenceFormData) => {
    const controlIDs = selectedIds.controlIDs ?? []
    const subcontrolIDs = selectedIds.subcontrolIDs ?? []

    try {
      const result = await createEvidence({
        input: {
          name: data.name,
          description: `${toHumanLabel(diagramType)} Diagram for the ${platformName} platform`,
          source: 'Platform Diagrams',
          fileIDs: [fileId],
          platformIDs: [platformId],
          ...(controlIDs.length > 0 ? { controlIDs } : {}),
          ...(subcontrolIDs.length > 0 ? { subcontrolIDs } : {}),
        },
      })

      const evidenceId = result.createEvidence.evidence.id
      successNotification({
        title: 'Marked as evidence',
        description: (
          <span>
            &quot;{data.name}&quot; has been created as evidence.{' '}
            <Button type="button" variant="transparent" className="h-auto p-0 underline cursor-pointer font-medium" onClick={() => openEvidence(evidenceId)}>
              View evidence
            </Button>
          </span>
        ),
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
      <DialogContent className="sm:max-w-175" onOpenAutoFocus={(e) => e.preventDefault()}>
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
                    <Input {...field} placeholder='e.g. "Architecture diagram for AWS environment"' />
                  </FormControl>
                  {form.formState.errors.name?.message && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-4 block border-b pb-1">Add Controls</FormLabel>
              <ObjectAssociation onIdChange={handleIdChange} allowedObjectTypes={ALLOWED_OBJECT_TYPES} defaultSelectedObject={ObjectTypeObjects.CONTROL} />
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

export default MarkAsDiagramEvidenceDialog
