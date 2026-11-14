'use client'

import React, { useState } from 'react'
import { BadgeCheck, CircleUser, Flag, Layers, Radio, ShieldOff, UserRoundCheck, UserRoundSearch } from 'lucide-react'
import { type FieldValues } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import { type UpdateFindingInput, type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { type ResponsibilityTarget } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { ReadOnlyRow } from './read-only-row'

const iconClass = 'h-4 w-4 text-muted-foreground'

type TExposureUpdateInput = UpdateFindingInput | UpdateVulnerabilityInput

type TExposurePropertiesCardProps<TInput extends TExposureUpdateInput> = {
  data: FieldValues & { priority?: string | null; validated?: boolean | null }
  responsibilities: Record<'owner' | 'assignee' | 'reviewer', ResponsibilityTarget<TInput>>
  blocking: { name: Extract<keyof TInput, 'blocking' | 'blocksProduction'>; value?: boolean | null }
  isEditing: boolean
  canEdit: boolean
  handleUpdate: (input: UpdateFindingInput & UpdateVulnerabilityInput, options?: TPersistOptions) => Promise<void>
}

export const ExposurePropertiesCard = <TInput extends TExposureUpdateInput>({ data, responsibilities, blocking, isEditing, canEdit, handleUpdate }: TExposurePropertiesCardProps<TInput>) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEdit,
    isCreate: false,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground w-30',
  }

  const showPriority = isEditing || internalEditing === 'priority' || !!data.priority?.trim()

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Properties</h3>
      <div className="flex flex-col gap-3">
        <ResponsibilityField
          name="internalOwner"
          fieldBaseName={responsibilities.owner.fieldBaseName}
          stringFieldName={responsibilities.owner.stringFieldName}
          allowPersonnel={responsibilities.owner.allowPersonnel}
          label="Owner"
          icon={<CircleUser className={iconClass} />}
          {...sharedFieldProps}
        />
        <ResponsibilityField
          name="assignedTo"
          fieldBaseName={responsibilities.assignee.fieldBaseName}
          stringFieldName={responsibilities.assignee.stringFieldName}
          allowPersonnel={responsibilities.assignee.allowPersonnel}
          label="Assigned to"
          icon={<UserRoundCheck className={iconClass} />}
          {...sharedFieldProps}
        />
        <ResponsibilityField
          name="reviewedBy"
          fieldBaseName={responsibilities.reviewer.fieldBaseName}
          stringFieldName={responsibilities.reviewer.stringFieldName}
          allowPersonnel={responsibilities.reviewer.allowPersonnel}
          label="Reviewed by"
          icon={<UserRoundSearch className={iconClass} />}
          {...sharedFieldProps}
        />
        <SelectField name="environmentName" label="Environment" icon={<Layers className={iconClass} />} options={environmentOptions} onCreateOption={createEnvironment} {...sharedFieldProps} />
        <SelectField name="scopeName" label="Scope" icon={<Radio className={iconClass} />} options={scopeOptions} onCreateOption={createScope} {...sharedFieldProps} />
        {showPriority && <TextField name="priority" label="Priority" icon={<Flag className={iconClass} />} {...sharedFieldProps} />}
        {isEditing ? (
          <div className="flex flex-col gap-3 pt-1">
            <CheckboxField name="validated" label="Validated" {...sharedFieldProps} />
            <CheckboxField name={blocking.name} label="Blocks production" {...sharedFieldProps} />
          </div>
        ) : (
          <>
            <ReadOnlyRow icon={<BadgeCheck className={iconClass} />} label="Validated">
              {data.validated ? 'Yes' : 'No'}
            </ReadOnlyRow>
            <ReadOnlyRow icon={<ShieldOff className={iconClass} />} label="Blocks production">
              {blocking.value ? 'Yes' : 'No'}
            </ReadOnlyRow>
          </>
        )}
      </div>
    </Card>
  )
}
