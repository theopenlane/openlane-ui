import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ControlImplementationDocumentStatus } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { DocumentStatusBadge } from '@/components/shared/enum-mapper/policy-enum'
import { isOneOf } from '@/utils/type-guards'
import { getVerifiedLabel } from '@/utils/control-implementation'
import { statusOptions } from '../table/table-config'
import { VerifiedIcon } from '../verified-label'

const VERIFIED_OPTIONS = [
  { value: 'true', label: getVerifiedLabel(true) },
  { value: 'false', label: getVerifiedLabel(false) },
]

const isStatus = isOneOf(Object.values(ControlImplementationDocumentStatus))

type TChipMenuProps = {
  label: string
  value: string
  options: { value: string; label: string }[]
  disabled: boolean
  onSelect: (value: string) => void
  children: React.ReactNode
}

const ChipMenu: React.FC<TChipMenuProps> = ({ label, value, options, disabled, onSelect, children }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="transparent" className="h-auto p-0" aria-label={label} disabled={disabled}>
        {children}
        <ChevronDown size={16} className="text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuRadioGroup
        value={value}
        onValueChange={(next) => {
          if (next !== value) onSelect(next)
        }}
      >
        {options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)

type TStatusChipProps = {
  status?: ControlImplementationDocumentStatus | null
  canEdit: boolean
  disabled: boolean
  onChange: (status: ControlImplementationDocumentStatus) => void
}

export const StatusChip: React.FC<TStatusChipProps> = ({ status, canEdit, disabled, onChange }) => {
  const chip = status ? <DocumentStatusBadge status={status} /> : <Badge variant="outline">No status</Badge>
  if (!canEdit) return chip

  return (
    <ChipMenu
      label={`Status: ${status ? getEnumLabel(status) : 'none'}. Change status`}
      value={status ?? ''}
      options={statusOptions}
      disabled={disabled}
      onSelect={(next) => {
        if (isStatus(next)) onChange(next)
      }}
    >
      {chip}
    </ChipMenu>
  )
}

type TVerifiedChipProps = {
  verified: boolean
  canEdit: boolean
  disabled: boolean
  onChange: (verified: boolean) => void
}

export const VerifiedChip: React.FC<TVerifiedChipProps> = ({ verified, canEdit, disabled, onChange }) => {
  const chip = (
    <Badge variant={verified ? 'green' : 'red'} className="gap-1.5">
      <VerifiedIcon verified={verified} />
      {getVerifiedLabel(verified)}
    </Badge>
  )
  if (!canEdit) return chip

  return (
    <ChipMenu label={`${getVerifiedLabel(verified)}. Change verification`} value={String(verified)} options={VERIFIED_OPTIONS} disabled={disabled} onSelect={(next) => onChange(next === 'true')}>
      {chip}
    </ChipMenu>
  )
}
