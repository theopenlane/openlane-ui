'use client'

import React, { useState, useEffect } from 'react'

import { Info, InfoIcon } from 'lucide-react'
import { FieldValues, Path, ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { EditPolicyFormData } from './policy-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { Value } from '@udecode/plate-common'
import { SystemTooltip } from '@repo/ui/system-tooltip'

type PolicyEditFormProps = {
  form: UseFormReturn<EditPolicyFormData>
}

export const PolicyEditForm = ({ form }: PolicyEditFormProps) => {
  const handleDocumentChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Not sure what to write?</AlertTitle>
          <AlertDescription>
            <p>
              For template library and help docs, please refer to our{' '}
              <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
                documentation
              </a>
              .
            </p>
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-1/3">
                <div className="flex items-center">
                  <FormLabel>Title</FormLabel>
                  <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The title of the policy.</p>} />
                </div>
                <FormControl>
                  <Input variant="medium" {...field} className="w-full" />
                </FormControl>
              </FormItem>
            )}
          />
        </Form>
        <div>
          <FormLabelContent label="Policy" info="The Policy document contents" />
          <PlateEditor onChange={handleDocumentChange} initialValue={form.getValues('details') as string} variant="basic" placeholder="Write your policy" />
        </div>
      </div>
    </>
  )
}

type PolicyFormFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  required?: boolean
  info?: string
  children: React.ReactNode | ((field: ControllerRenderProps<T, Path<T>>) => React.ReactNode) // Support function-as-child with correct field typing
}

function PolicyFormField<T extends FieldValues>({ form, name, label, children, required, info }: PolicyFormFieldProps<T>) {
  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <FormLabelContent {...{ label, info, required }} />
          </FormLabel>
          <FormControl>{typeof children === 'function' ? children(field) : children}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function FormLabelContent({ label, info, required }: { label: string; info?: string; required?: boolean }) {
  return (
    <div className="flex flex-row items-center">
      <div className="font-bold">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      {info && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size="14" className="ms-1 text-brand" />
            </TooltipTrigger>
            <TooltipContent>{info}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
