'use client'

import React, { useMemo } from 'react'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema'
import { Info, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, CalendarClock } from 'lucide-react'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { EditProcedureFormData } from './procedure-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import MultipleSelector from '@repo/ui/multiple-selector'

type ProcedureEditSidebarProps = {
  procedure: ProcedureByIdFragment
  form: UseFormReturn<EditProcedureFormData>
  handleSave: () => void
}

// export const ProcedureEditSidebar: React.FC<ProcedureEditSidebarProps> = function ({ procedure, form, handleSave }) {
export const ProcedureEditSidebar = ({ procedure, form, handleSave }: ProcedureEditSidebarProps) => {
  if (!procedure) return null

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: procedure.status },
        { icon: FileStack, label: 'Version', value: procedure.version },
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
