'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { isIntegrationSourced } from '@/lib/integrations/utils'
import { EXTERNAL_REF_LOCKED_TOOLTIP } from '../../../exposure/detail/external-ref-lock'
import { ArrayTextField } from '../../create/form/fields/additional-fields'

const noopSetInternalEditing = () => undefined

const FindingDetailsEditCard: React.FC<{ finding: FindingDetailNode }> = ({ finding }) => {
  const { enumOptions: statusOptions, onCreateOption: createStatus } = useCreatableEnumOptions({ objectType: 'finding', field: 'status' })
  const isExternalRefLocked = isIntegrationSourced(finding)

  const fieldProps = {
    isEditing: true,
    isEditAllowed: true,
    data: finding,
    internalEditing: null,
    setInternalEditing: noopSetInternalEditing,
  }
  const externalRefProps = {
    ...fieldProps,
    isEditing: !isExternalRefLocked,
    isEditAllowed: !isExternalRefLocked,
    tooltipContent: isExternalRefLocked ? EXTERNAL_REF_LOCKED_TOOLTIP : undefined,
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base p-0">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="displayName" label="Display Name" {...fieldProps} />
          <TextField name="findingClass" label="Finding Class" {...fieldProps} />
          <SelectField name="findingStatusName" label="Status" options={statusOptions} onCreateOption={createStatus} {...fieldProps} />
          <TextField name="category" label="Category" {...fieldProps} />
          <TextField name="source" label="Source" {...fieldProps} />
          <TextField name="externalURI" label="External URI" type="link" {...externalRefProps} />
        </div>
        <TextField name="recommendedActions" label="Recommended Actions" multiline {...fieldProps} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField name="score" label="Score" type="text" {...fieldProps} />
          <TextField name="impact" label="Impact" type="text" {...fieldProps} />
          <TextField name="exploitability" label="Exploitability" type="text" {...fieldProps} />
        </div>
        <TextField name="vector" label="CVSS Vector" placeholder="CVSS:4.0/AV:N/AC:L/…" {...fieldProps} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField name="numericSeverity" label="Numeric Severity" type="text" {...fieldProps} />
          <TextField name="externalID" label="External ID" {...externalRefProps} />
          <TextField name="externalOwnerID" label="External Owner ID" {...externalRefProps} />
        </div>
        <ArrayTextField name="stepsToReproduce" label="Steps to Reproduce" {...fieldProps} />
        <ArrayTextField name="references" label="References" {...fieldProps} />
      </CardContent>
    </Card>
  )
}

export default FindingDetailsEditCard
