'use client'

import React from 'react'
import { CalendarClock, Eye, Factory, Gauge, LockOpen, Tag, Tags } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { formatDateTime } from '@/utils/date'
import { ReadOnlyRow } from '../../exposure/detail/read-only-row'

const iconClass = 'h-4 w-4 text-muted-foreground'
const noopSetInternalEditing = () => undefined

const FLAG_ROWS = [
  { name: 'open', label: 'Open', icon: LockOpen },
  { name: 'production', label: 'Affects production', icon: Factory },
  { name: 'public', label: 'Publicly disclosed', icon: Eye },
] as const

type TFindingAdditionalDetailsCardProps = {
  finding: FindingDetailNode
  isEditing: boolean
  canEdit: boolean
  handleUpdate: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const FindingAdditionalDetailsCard: React.FC<TFindingAdditionalDetailsCardProps> = ({ finding, isEditing, canEdit, handleUpdate }) => {
  const timestamps = [
    { label: 'Reported', value: finding.reportedAt },
    { label: 'Last observed', value: finding.eventTime },
    { label: 'Source updated', value: finding.sourceUpdatedAt },
  ].filter(({ value }) => !!value)

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Additional Details</h3>
      <div className="flex flex-col gap-3">
        {isEditing ? (
          FLAG_ROWS.map(({ name, label }) => (
            <CheckboxField
              key={name}
              name={name}
              label={label}
              isEditing
              isEditAllowed={canEdit}
              isCreate={false}
              data={finding}
              internalEditing={null}
              setInternalEditing={noopSetInternalEditing}
              handleUpdate={handleUpdate}
            />
          ))
        ) : (
          <>
            {finding.category?.trim() && (
              <ReadOnlyRow icon={<Tag className={iconClass} />} label="Category">
                {finding.category}
              </ReadOnlyRow>
            )}
            {finding.findingClass?.trim() && (
              <ReadOnlyRow icon={<Tags className={iconClass} />} label="Class">
                {getEnumLabel(finding.findingClass)}
              </ReadOnlyRow>
            )}
            {typeof finding.numericSeverity === 'number' && finding.numericSeverity > 0 && (
              <ReadOnlyRow icon={<Gauge className={iconClass} />} label="Numeric severity">
                {finding.numericSeverity}
              </ReadOnlyRow>
            )}
            {FLAG_ROWS.map(({ name, label, icon: Icon }) => (
              <ReadOnlyRow key={name} icon={<Icon className={iconClass} />} label={label}>
                {finding[name] ? 'Yes' : 'No'}
              </ReadOnlyRow>
            ))}
            {timestamps.map(({ label, value }) => (
              <ReadOnlyRow key={label} icon={<CalendarClock className={iconClass} />} label={label}>
                {formatDateTime(value)}
              </ReadOnlyRow>
            ))}
          </>
        )}
      </div>
    </Card>
  )
}

export default FindingAdditionalDetailsCard
