'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { SquarePlus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { useEmailTemplatesWithFilter } from '@/lib/graphql-hooks/email-template'
import { type TPagination } from '@repo/ui/pagination-types'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface PreviewStepProps {
  form: UseFormReturn<CampaignFormData>
  onCreateTemplate: () => void
}

const selectPagination: TPagination = {
  page: 1,
  pageSize: 100,
  query: { first: 100 },
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ form, onCreateTemplate }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(form.getValues('templateID') || '')
  const { emailTemplatesNodes, isLoading } = useEmailTemplatesWithFilter({ where: {}, pagination: selectPagination })

  // Sync local state when templateID is set externally (e.g. via CreateTemplateSheet)
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'templateID' && values.templateID && values.templateID !== selectedTemplateId) {
        setSelectedTemplateId(values.templateID)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, selectedTemplateId])

  const templateOptions = useMemo(
    () =>
      emailTemplatesNodes?.map((t) => ({
        label: t.name,
        value: t.id,
      })) ?? [],
    [emailTemplatesNodes],
  )

  const handleTemplateChange = useCallback(
    (val: string) => {
      setSelectedTemplateId(val)
      form.setValue('templateID', val, { shouldDirty: true })
    },
    [form],
  )

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="templateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="pb-1 block">Campaign Template</FormLabel>
            <Select
              value={selectedTemplateId || undefined}
              onValueChange={(val) => {
                field.onChange(val)
                handleTemplateChange(val)
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading templates...</div>
                ) : templateOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                ) : (
                  templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Don&apos;t see a template?</span>
        <Button variant="secondary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreateTemplate} type="button">
          Create an email template
        </Button>
      </div>

      {selectedTemplateId && (
        <div className="rounded-md border border-border overflow-hidden bg-input">
          <div className="p-4">
            <h4 className="text-sm font-semibold">Campaign Preview</h4>
            <p className="text-xs text-muted-foreground">This is how your email will appear to recipients</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="rounded-md bg-card p-3 pb-1">
              <div className="text-sm pb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
