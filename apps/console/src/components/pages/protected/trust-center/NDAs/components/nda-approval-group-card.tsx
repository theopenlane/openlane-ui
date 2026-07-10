'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Label } from '@repo/ui/label'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { type UpdateTrustCenterSettingInput } from '@repo/codegen/src/schema'

type NdaApproverGroup = { id: string; displayName: string; name: string }

type NdaApprovalGroupCardProps = {
  selectedGroup?: NdaApproverGroup | null
  canEdit: boolean
  disabled: boolean
  onSelect: (input: UpdateTrustCenterSettingInput) => void
}

export const NdaApprovalGroupCard = ({ selectedGroup, canEdit, disabled, onSelect }: NdaApprovalGroupCardProps) => {
  const { groups, isLoading } = useGetAllGroups({})

  const groupOptions = useMemo(() => {
    const opts = groups.map((group) => ({ value: group.id, label: group.displayName || group.name }))
    if (selectedGroup && !opts.some((opt) => opt.value === selectedGroup.id)) {
      opts.unshift({ value: selectedGroup.id, label: selectedGroup.displayName || selectedGroup.name })
    }
    return opts
  }, [groups, selectedGroup])

  const handleChange = (value: string) => {
    if (!value) {
      onSelect({ clearNdaApproverGroup: true })
      return
    }
    onSelect({ ndaApproverGroupID: value })
  }

  return (
    <Card className="mt-3">
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">
            Approval Group <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">If no group is selected, approval request emails will be sent to all Owners, Super Admins, and Admins in the organization.</p>
          <p className="text-sm text-muted-foreground">When a group is selected, only members of that group will receive approval request emails.</p>
        </div>
        <SearchableSingleSelect
          value={selectedGroup?.id ?? ''}
          options={groupOptions}
          onChange={handleChange}
          placeholder={isLoading ? 'Loading groups...' : 'No group selected'}
          clearable
          clearLabel="No group selected"
          disabled={!canEdit || disabled}
        />
      </CardContent>
    </Card>
  )
}
