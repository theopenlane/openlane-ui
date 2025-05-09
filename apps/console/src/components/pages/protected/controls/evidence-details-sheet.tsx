'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { ArrowRight, Check, InfoIcon, Link, Pencil } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Input } from '@repo/ui/input'
import { useNotification } from '@/hooks/useNotification'
import useFormSchema, { EditTaskFormData } from '@/components/pages/protected/tasks/hooks/use-form-schema'
import { Loading } from '@/components/shared/loading/loading'
import { Badge } from '@repo/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import DeleteTaskDialog from '@/components/pages/protected/tasks/create-task/dialog/delete-task-dialog'
import { useUpdateTask } from '@/lib/graphql-hooks/tasks'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Value } from '@udecode/plate-common'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog.tsx'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { useGetEvidenceById } from '@/lib/graphql-hooks/evidence.ts'

const EvidenceDetailsSheet = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [tagValues, setTagValues] = useState<Option[]>([])

  const { selectedControlEvidence, setSelectedControlEvidence } = useControlEvidenceStore()
  const searchParams = useSearchParams()
  const plateEditorHelper = usePlateEditor()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)

  const { mutateAsync: updateTask } = useUpdateTask()
  const { data, isLoading: fetching } = useGetEvidenceById(selectedControlEvidence as string)
  const evidence = data?.evidence

  const { form } = useFormSchema()

  const handleCopyLink = () => {
    if (!selectedControlEvidence) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?controlEvidenceId=${selectedControlEvidence}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const handleSheetClose = () => {
    if (isEditing) {
      setIsDiscardDialogOpen(true)
      return
    }

    handleCloseParams()
  }

  const handleCloseParams = () => {
    setSelectedControlEvidence(null)
    setIsEditing(false)

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('controlEvidenceId')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const onSubmit = async (data: EditTaskFormData) => {}

  const handleTags = () => {
    return (
      <div className="flex flex-wrap gap-2">{evidence?.tags?.map((item: string | undefined, index: number) => <Fragment key={index}>{item && <Badge variant="outline">{item}</Badge>}</Fragment>)}</div>
    )
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <Sheet open={!!selectedControlEvidence} onOpenChange={handleSheetClose}>
      <SheetContent className="bg-card flex flex-col">
        {fetching ? (
          <Loading />
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <ArrowRight size={16} className="cursor-pointer" onClick={handleSheetClose} />
                <div className="flex justify-end gap-2">
                  <Button icon={<Link />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                    Copy link
                  </Button>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)} icon={<Check />} iconPosition="left">
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button icon={<Pencil />} iconPosition="left" variant="outline" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                  {evidence?.displayID && <DeleteTaskDialog taskName={evidence.displayID} />}
                </div>
              </div>
            </SheetHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <SheetTitle>
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <div className="flex items-center">
                            <FormLabel>Title</FormLabel>
                            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
                          </div>
                          <FormControl>
                            <Input variant="medium" {...field} className="w-full" />
                          </FormControl>
                          {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                        </FormItem>
                      )}
                    />
                  ) : (
                    evidence?.displayID
                  )}
                </SheetTitle>
              </form>
            </Form>
          </>
        )}
        <CancelDialog
          isOpen={isDiscardDialogOpen}
          onConfirm={() => {
            setIsDiscardDialogOpen(false)
            handleCloseParams()
          }}
          onCancel={() => setIsDiscardDialogOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

export default EvidenceDetailsSheet
