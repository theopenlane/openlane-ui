'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Info, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, CalendarClock } from 'lucide-react'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { EditProcedureFormData } from './procedure-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import MultipleSelector from '@repo/ui/multiple-selector'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useToast } from '@repo/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteProcedure } from '@/lib/graphql-hooks/procedures'
import { Procedure } from '@repo/codegen/src/schema'

type ProcedureEditSidebarProps = {
  procedure: Procedure
  form: UseFormReturn<EditProcedureFormData>
  handleSave: () => void
}

export const ProcedureEditSidebar = ({ procedure, form, handleSave }: ProcedureEditSidebarProps) => {
  const { toast } = useToast()
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { mutateAsync: deleteProcedure } = useDeleteProcedure()

  if (!procedure) return null

  const handleDelete = useCallback(async () => {
    try {
      await deleteProcedure({ deleteProcedureId: procedure.id })
      successNotification({ title: 'Procedure deleted' })
      router.push('/procedures')
    } catch (error) {
      errorNotification({ title: 'Error deleting procedure' }) // todo add gqlError: error to error
    }
  }, [deleteProcedure, procedure, router, toast])

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: procedure.status },
        { icon: ScrollText, label: 'Procedure Type', value: <ProcedureTypeField form={form} /> },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(procedure.createdAt) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(procedure.updatedAt) },
      ],
    }
  }, [procedure])

  const submittabled = form.formState.isDirty && form.formState.isValid && !form.formState.disabled

  return (
    <div className="w-full flex flex-col gap-5">
      <Button onClick={handleSave} disabled={!submittabled}>
        Save procedure
      </Button>
      <MetaPanel entries={sidebarItems.status} />
      <TagsPanel form={form} />
      <Button variant="redOutline" onClick={() => setShowDeleteConfirmation(true)}>
        Delete procedure
      </Button>

      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDelete}
        description="This action cannot be undone, this will permanently remove the procedure from the organization."
      />
    </div>
  )
}

const TagsPanel = ({ form }: { form: UseFormReturn<EditProcedureFormData> }) => {
  const { setValue } = form

  return (
    <Panel className="gap-3">
      <div className="flex flex-row items-center">
        <Tag size={16} className="text-brand" />
        <span className="font-bold ms-2 me-1">Tags</span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size="14" className="ms-1 text-brand" />
            </TooltipTrigger>
            <TooltipContent>Tags for the procedure</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Form {...form}>
        <FormField
          name="tags"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MultipleSelector
                  className="bg-background text-white p-2"
                  placeholder="Choose existing or add tag..."
                  creatable
                  value={field?.value?.map((tag: string) => ({ value: tag, label: tag }))}
                  onChange={(selected) =>
                    setValue(
                      'tags',
                      selected.map((s) => s.value),
                      { shouldValidate: true },
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </Panel>
  )
}

function ProcedureTypeField({ form }: { form: UseFormReturn<EditProcedureFormData> }) {
  return (
    <Form {...form}>
      <FormField
        name="procedureType"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl className="w-full">
              <Input placeholder="Procedure type" {...field} className="bg-background text-white w-full text-sm h-auto p-1" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}
