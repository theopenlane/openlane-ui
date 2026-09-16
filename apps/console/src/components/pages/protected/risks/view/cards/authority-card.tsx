'use client'

import React, { useState } from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'
import { type UpdateRiskInput } from '@repo/codegen/src/schema'
import { Stamp, CircleArrowRight } from 'lucide-react'
import { type EditRisksFormData } from '../hooks/use-form-schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'

type TAuthorityCardProps = {
  form: UseFormReturn<EditRisksFormData>
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
  inputClassName?: string
  activeField?: string | null
  setActiveField?: (field: string | null) => void
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ form, isEditing, isEditAllowed = true, handleUpdate, inputClassName, activeField, setActiveField }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    internalEditing: activeField !== undefined ? activeField : internalEditing,
    setInternalEditing: setActiveField ?? setInternalEditing,
    handleUpdate: async (input: UpdateRiskInput) => {
      await handleUpdate?.(input)
    },
    allowRawInput: false,
  }
  return (
    <FormProvider {...form}>
      <div>
        <h3 className="text-lg font-medium mb-2">Properties</h3>
        <div className={inputClassName}>
          <ResponsibilityField name="stakeholder" fieldBaseName="stakeholder" label="Stakeholder" icon={<Stamp size={16} className="text-brand" />} {...sharedFieldProps} />
          <ResponsibilityField name="delegate" fieldBaseName="delegate" label="Delegate" icon={<CircleArrowRight size={16} className="text-brand" />} {...sharedFieldProps} />
        </div>
      </div>
    </FormProvider>
  )
}

export default AuthorityCard
