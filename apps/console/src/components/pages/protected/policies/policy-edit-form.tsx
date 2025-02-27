'use client'

import React from 'react'
import { Info, InfoIcon } from 'lucide-react'
import { Textarea } from '@repo/ui/textarea'
import { Control, FieldValues, Path, ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { EditPolicyFormData } from './policy-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

type PolicyEditFormProps = {
  form: UseFormReturn<EditPolicyFormData>
}

export const PolicyEditForm = ({ form }: PolicyEditFormProps) => {
  return (
    <>
      <div className="flex flex-col gap-5">
        <PolicyHelpPanel />

        <Form {...form}>
          <PolicyFormField required form={form} name="name" label="Title" info="The title of the policy.">
            {(field) => <Input placeholder="Policy title" {...field} className="bg-background" />}
          </PolicyFormField>
          <PolicyFormField form={form} name="description" label="Description" info="The description of the policy.">
            {(field) => <Textarea rows={7} placeholder="Policy description" {...field} className="bg-background" />}
          </PolicyFormField>
          <PolicyFormField form={form} name="background" label="Background" info="The background of the policy.">
            {(field) => <Textarea rows={7} placeholder="Policy background" {...field} className="bg-background" />}
          </PolicyFormField>
          <PolicyFormField form={form} name="purposeAndScope" label="Purpose and Scope" info="The purpose and scope of the policy.">
            {(field) => <Textarea rows={7} placeholder="Policy purpose and scope" {...field} className="bg-background" />}
          </PolicyFormField>
        </Form>
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
  const {
    formState: { errors },
  } = form

  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex flex-row items-center">
            <span className="font-bold">
              {label} {required && <span className="text-red-500">*</span>}
            </span>
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
          </FormLabel>
          <FormControl>{typeof children === 'function' ? children(field) : children}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PolicyHelpPanel() {
  return (
    <div className="border rounded-lg p-3 flex flex-row gap-3 align-top mt-0">
      <div>
        <InfoIcon size="16" />
      </div>
      <div>
        <h1>Not sure what to write?</h1>
        <p>
          For template library and help docs, please refer to our{' '}
          <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
            documentation
          </a>
          .
        </p>
      </div>
    </div>
  )
}
