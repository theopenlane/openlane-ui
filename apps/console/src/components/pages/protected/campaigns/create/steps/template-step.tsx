'use client'

import React from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { SquarePlus } from 'lucide-react'
import { useTemplateSelect } from '@/lib/graphql-hooks/template'
import { CampaignCampaignType } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface TemplateStepProps {
  form: UseFormReturn<CampaignFormData>
  onCreateTemplate: () => void
}

const campaignTypeOptions = enumToOptions(CampaignCampaignType)

export const TemplateStep: React.FC<TemplateStepProps> = ({ form, onCreateTemplate }) => {
  const { templateOptions, isLoading } = useTemplateSelect({ where: {} })
  const templateId = form.watch('templateID')

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter campaign name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="campaignType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Type</FormLabel>
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">{field.value ? campaignTypeOptions.find((o) => o.value === field.value)?.label ?? 'Select a type' : 'Select a type'}</SelectTrigger>
              </FormControl>
              <SelectContent>
                {campaignTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the purpose of this campaign" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="templateID"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign Template</FormLabel>
            <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val || undefined)}>
              <FormControl>
                <SelectTrigger className="w-full">{templateId ? templateOptions.find((t) => t.value === templateId)?.label ?? 'Select a template' : 'Select a template'}</SelectTrigger>
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
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm text-muted-foreground">Don&apos;t see a template?</span>
        <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreateTemplate} type="button">
          Create Template
        </Button>
      </div>
    </div>
  )
}
