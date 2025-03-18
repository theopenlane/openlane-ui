'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

import { Info } from 'lucide-react'
import { Textarea } from '@repo/ui/textarea'
import { FieldValues, Path, ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import { EditProcedureFormData } from './procedure-edit-form-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

type ProcedureEditFormProps = {
  document: string
  setDocument: React.Dispatch<React.SetStateAction<string>>
  form: UseFormReturn<EditProcedureFormData>
}

export const ProcedureEditForm = ({ form, document, setDocument }: ProcedureEditFormProps) => {
  const { setValue: setFormValue } = form
  const [updatedDocument, setUpdatedDocument] = useState<string>(document)

  useEffect(() => {
    if (!updatedDocument?.length) return
    setDocument((state) => {
      setFormValue('details', state, { shouldValidate: true })
      return state
    })
  }, [updatedDocument])

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
          <ProcedureFormField required form={form} name="name" label="Title" info="The title of the procedure.">
            {(field) => <Input placeholder="Procedure title" {...field} className="bg-background" />}
          </ProcedureFormField>
        </Form>
        <div>
          <FormLabelContent label="Procedure" info="The Procedure document contents" />
          <PlateEditor content={document} onChange={setUpdatedDocument as any} />
        </div>
      </div>
    </>
  )
}

type ProcedureFormFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  required?: boolean
  info?: string
  children: React.ReactNode | ((field: ControllerRenderProps<T, Path<T>>) => React.ReactNode) // Support function-as-child with correct field typing
}

function ProcedureFormField<T extends FieldValues>({ form, name, label, children, required, info }: ProcedureFormFieldProps<T>) {
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
