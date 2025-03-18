'use client'

import React, { useMemo, useState, useCallback } from 'react'
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
import MultipleSelector from '@repo/ui/multiple-selector'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteInternalPolicy } from '@/lib/graphql-hooks/policy'

type PolicyEditSidebarProps = {
  policy: InternalPolicyByIdFragment
  form: UseFormReturn<EditPolicyFormData>
  handleSave: () => void
}

export const PolicyEditSidebar = ({ policy, form, handleSave }: PolicyEditSidebarProps) => {
  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { mutateAsync: deletePolicy } = useDeleteInternalPolicy()

  if (!policy) return null

  const handleDelete = useCallback(async () => {
    try {
      await deletePolicy({ deleteInternalPolicyId: policy.id })
      successNotification({ title: 'Policy deleted' })
      router.push('/policies')
    } catch {
      errorNotification({ title: 'Error deleting policy' }) // gqlError: error TODO: pass graphql error
    }
  }, [deletePolicy, policy, router])

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: policy.status },
        { icon: ScrollText, label: 'Policy Type', value: <PolicyTypeField form={form} /> },
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
      <Button variant="redOutline" onClick={() => setShowDeleteConfirmation(true)}>
        Delete policy
      </Button>

      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        onConfirm={handleDelete}
        description="This action cannot be undone, this will permanently remove the policy from the organization."
      />
    </div>
  )
}

const TagsPanel = ({ form }: { form: UseFormReturn<EditPolicyFormData> }) => {
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
                <MultipleSelector
                  className="bg-background text-white p-2"
                  placeholder="Choose existing or add tag..."
                  creatable
                  value={field?.value?.map((tag) => ({ value: tag, label: tag }))}
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

function PolicyTypeField({ form }: { form: UseFormReturn<EditPolicyFormData> }) {
  return (
    <Form {...form}>
      <FormField
        name="policyType"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl className="w-full">
              <Input placeholder="Policy type" {...field} className="bg-background text-white w-full text-sm h-auto p-1" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}
