'use client'

import React, { useState } from 'react'
import { BadgeCheck, CircleUser, Flag, Layers, Radio, ShieldOff, UserRoundCheck, UserRoundSearch } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { ReadOnlyRow } from '../../exposure/detail/read-only-row'
import { FINDING_ASSIGNEE, FINDING_INTERNAL_OWNER, FINDING_REVIEWER } from '../finding-responsibility'

const iconClass = 'h-4 w-4 text-muted-foreground'

type TFindingPropertiesSidebarProps = {
  finding: FindingDetailNode
  isEditing: boolean
  canEdit: boolean
  handleUpdate: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const FindingPropertiesSidebar: React.FC<TFindingPropertiesSidebarProps> = ({ finding, isEditing, canEdit, handleUpdate }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEdit,
    isCreate: false,
    data: finding,
    internalEditing,
    setInternalEditing,
    handleUpdate,
    layout: 'horizontal' as const,
    labelClassName: 'text-muted-foreground w-30',
  }

  const showPriority = isEditing || internalEditing === 'priority' || !!finding.priority?.trim()

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Properties</h3>
      <div className="flex flex-col gap-3">
        <ResponsibilityField
          name="internalOwner"
          fieldBaseName={FINDING_INTERNAL_OWNER.fieldBaseName}
          stringFieldName={FINDING_INTERNAL_OWNER.stringFieldName}
          label="Owner"
          icon={<CircleUser className={iconClass} />}
          {...sharedFieldProps}
        />
        <ResponsibilityField
          name="assignedTo"
          fieldBaseName={FINDING_ASSIGNEE.fieldBaseName}
          stringFieldName={FINDING_ASSIGNEE.stringFieldName}
          label="Assigned to"
          icon={<UserRoundCheck className={iconClass} />}
          {...sharedFieldProps}
        />
        <ResponsibilityField
          name="reviewedBy"
          fieldBaseName={FINDING_REVIEWER.fieldBaseName}
          stringFieldName={FINDING_REVIEWER.stringFieldName}
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
            <CheckboxField name="blocksProduction" label="Blocks production" {...sharedFieldProps} />
          </div>
        ) : (
          <>
            <ReadOnlyRow icon={<BadgeCheck className={iconClass} />} label="Validated">
              {finding.validated ? 'Yes' : 'No'}
            </ReadOnlyRow>
            <ReadOnlyRow icon={<ShieldOff className={iconClass} />} label="Blocks production">
              {finding.blocksProduction ? 'Yes' : 'No'}
            </ReadOnlyRow>
          </>
        )}
      </div>
    </Card>
  )
}

export default FindingPropertiesSidebar
