'use client'

import React, { useMemo } from 'react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { Info, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, CalendarClock } from 'lucide-react'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { EditPolicyFormData } from './policy-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'

type PolicyEditSidebarProps = {
  policy: InternalPolicyByIdFragment
  form: UseFormReturn<EditPolicyFormData>
  handleSave: () => void
}

// export const PolicyEditSidebar: React.FC<PolicyEditSidebarProps> = function ({ policy, form, handleSave }) {
export const PolicyEditSidebar = ({ policy, form, handleSave }: PolicyEditSidebarProps) => {
  if (!policy) return null

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: policy.status },
        { icon: FileStack, label: 'Version', value: policy.version },
        { icon: ScrollText, label: 'Policy Type', value: policy.policyType },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(policy.createdAt) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(policy.updatedAt) },
      ],
    }
  }, [policy])

  const submittabled = form.formState.isDirty && form.formState.isValid && !form.formState.disabled

  return (
    <div className="w-full flex flex-col gap-5">
      <Button onClick={handleSave} disabled={!submittabled}>
        Save policy
      </Button>
      <MetaPanel entries={sidebarItems.status} />
      <TagsPanel form={form} />
    </div>
  )
}

const TagsPanel = ({ form }: { form: UseFormReturn<EditPolicyFormData> }) => {
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
            <TooltipContent>Tags for the policy</TooltipContent>
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
                <Input placeholder="Choose existing or add tag..." {...field} className="bg-background text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </Panel>
  )
}
