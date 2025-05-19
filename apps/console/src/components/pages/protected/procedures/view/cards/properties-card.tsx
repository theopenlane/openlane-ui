'use client'

import React from 'react'
import { ProcedureByIdFragment, ProcedureDocumentStatus } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, Calendar, FileStack, ScrollText, Stamp } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'
import { formatDate } from '@/utils/date'
import { DocumentIconMapper } from '@/components/shared/icon-enum/policy-enum.tsx'

type TPropertiesCardProps = {
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
  isEditing: boolean
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, isEditing, procedure }) => {
  const statusOptions = Object.values(ProcedureDocumentStatus).map((value) => ({
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    value,
  }))

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Properties</h3>
      <div className="flex flex-col gap-4">
        {/* Status Required */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <Binoculars size={16} className="text-brand" />
            <span>Status</span>
          </div>

          <div className="w-[200px]">
            {isEditing && (
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        value && field.onChange(value)
                      }}
                    >
                      <SelectTrigger className="w-full">{statusOptions.find((item) => item.value === field.value)?.label}</SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                  </div>
                )}
              />
            )}

            {!isEditing && (
              <div className="flex items-center space-x-2">
                {DocumentIconMapper[procedure.status as ProcedureDocumentStatus]}
                <p>{statusOptions.find((item) => item.value === procedure.status)?.label}</p>
              </div>
            )}
          </div>
        </div>

        {/* Version Required */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <FileStack size={16} className="text-brand" />
            <span>Version</span>
          </div>

          <div className="w-[200px]">
            <div className="flex gap-2">
              <span>{procedure?.revision ?? '0.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Procedure type */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <ScrollText size={16} className="text-brand" />
            <span>Procedure Type</span>
          </div>

          <div className="w-[200px]">
            {isEditing && (
              <FormField
                control={form.control}
                name="procedureType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input variant="medium" {...field} className="w-full" />
                    </FormControl>
                    {form.formState.errors.procedureType && <p className="text-red-500 text-sm">{form.formState.errors.procedureType.message}</p>}
                  </FormItem>
                )}
              />
            )}

            {!isEditing && (
              <div className="flex gap-2">
                <span>{procedure?.procedureType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Review date */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[200px] items-center">
            <Calendar size={16} className="text-brand" />
            <span>Review date</span>
          </div>

          <div className="w-[200px]">
            <span>{formatDate(procedure?.reviewDue)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PropertiesCard
