import React from 'react'
import { Badge } from '@repo/ui/badge'
import { type ControlImplementationDocumentStatus } from '@repo/codegen/src/schema'
import { ChipSelect } from '@/components/shared/chip-select/chip-select'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { DocumentStatusBadge, getDocumentStatusClassName } from '@/components/shared/enum-mapper/policy-enum'
import { getVerifiedLabel } from '@/utils/control-implementation'
import { statusOptions } from '../table/table-config'
import { VerifiedIcon } from '../verified-label'

const VERIFIED_OPTIONS = [
  { value: 'true', label: getVerifiedLabel(true) },
  { value: 'false', label: getVerifiedLabel(false) },
]

type TStatusChipProps = {
  status?: ControlImplementationDocumentStatus | null
  canEdit: boolean
  disabled: boolean
  onChange: (status: ControlImplementationDocumentStatus) => void
}

export const StatusChip: React.FC<TStatusChipProps> = ({ status, canEdit, disabled, onChange }) => {
  if (!canEdit) return status ? <DocumentStatusBadge status={status} /> : <Badge variant="outline">No status</Badge>

  const label = status ? getEnumLabel(status) : 'No status'

  return (
    <ChipSelect
      label={`Status: ${label}. Change status`}
      value={status}
      options={statusOptions}
      onChange={onChange}
      variant="outline"
      className={status ? getDocumentStatusClassName(status) : undefined}
      disabled={disabled}
    >
      {label}
    </ChipSelect>
  )
}

type TVerifiedChipProps = {
  verified: boolean
  canEdit: boolean
  disabled: boolean
  onChange: (verified: boolean) => void
}

export const VerifiedChip: React.FC<TVerifiedChipProps> = ({ verified, canEdit, disabled, onChange }) => {
  const variant = verified ? 'green' : 'red'
  const content = (
    <>
      <VerifiedIcon verified={verified} />
      {getVerifiedLabel(verified)}
    </>
  )

  if (!canEdit) {
    return (
      <Badge variant={variant} className="gap-1.5">
        {content}
      </Badge>
    )
  }

  return (
    <ChipSelect
      label={`${getVerifiedLabel(verified)}. Change verification`}
      value={String(verified)}
      options={VERIFIED_OPTIONS}
      onChange={(next) => onChange(next === 'true')}
      variant={variant}
      disabled={disabled}
    >
      <span className="inline-flex items-center gap-1.5">{content}</span>
    </ChipSelect>
  )
}
