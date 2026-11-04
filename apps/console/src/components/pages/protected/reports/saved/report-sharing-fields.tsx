'use client'

import React, { useId, useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { ReportReportVisibility } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Label } from '@repo/ui/label'
import { cn } from '@repo/ui/lib/utils'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { ResponsibilityTypeIcon } from '@/components/shared/crud-base/form-fields/responsibility-type-icon'
import { SearchableItemSelect, type TSearchableItemSelectAriaProps } from '@/components/shared/searchable-item-select/searchable-item-select'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { REPORT_VISIBILITY_META, REPORT_VISIBILITY_OPTIONS } from './report-visibility'
import type { TReportSharee, TReportSharingForm } from './use-report-sharing-form'

type TReportSharingFieldsProps = {
  excludedUserIds: string[]
}

const ReportShareePicker: React.FC<TReportSharingFieldsProps & TSearchableItemSelectAriaProps & { value: TReportSharee[]; onChange: (value: TReportSharee[]) => void }> = ({
  excludedUserIds,
  value,
  onChange,
  ...ariaProps
}) => {
  const [open, setOpen] = useState(false)
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()

  const { members, isFetching: isFetchingUsers } = useGetOrgMemberships({
    where: debouncedTerm ? { hasUserWith: [{ or: [{ displayNameContainsFold: debouncedTerm }, { emailContainsFold: debouncedTerm }] }] } : undefined,
    enabled: open,
  })
  const { groups, isFetching: isFetchingGroups } = useGetGroupNames({
    where: debouncedTerm ? { or: [{ displayNameContainsFold: debouncedTerm }, { nameContainsFold: debouncedTerm }] } : undefined,
    enabled: open,
  })

  const isSearching = getIsSearching(isFetchingUsers, isFetchingGroups)

  const items = useMemo<TReportSharee[]>(() => {
    if (isSearching) return []

    return [
      ...members
        .filter((member) => !excludedUserIds.includes(member.user.id))
        .map((member) => ({ id: member.user.id, name: member.user.displayName || member.user.email, email: member.user.email, kind: 'user' as const })),
      ...groups.map((group) => ({ id: group.id, name: group.displayName || group.name, kind: 'group' as const })),
    ]
  }, [excludedUserIds, groups, isSearching, members])

  const handleSelectedIdsChange = (ids: string[]) => {
    const known = new Map([...items, ...value].map((sharee) => [sharee.id, sharee]))
    onChange(ids.flatMap((id) => known.get(id) ?? []))
  }

  return (
    <SearchableItemSelect
      {...ariaProps}
      selectedIds={value.map((sharee) => sharee.id)}
      onSelectedIdsChange={handleSelectedIdsChange}
      items={items}
      knownItems={value}
      isLoading={isSearching}
      icon={(item) => <ResponsibilityTypeIcon type={item.kind} />}
      renderItemEnd={(item) => item.email && <span className="ml-auto truncate pl-2 text-xs text-muted-foreground">{item.email}</span>}
      placeholder="Select users or groups"
      searchPlaceholder="Search users or groups"
      onSearchTextChange={setSearchText}
      onOpenChange={setOpen}
    />
  )
}

const ReportSharingFields: React.FC<TReportSharingFieldsProps> = ({ excludedUserIds }) => {
  const { control } = useFormContext<TReportSharingForm>()
  const visibility = useWatch({ control, name: 'visibility' })
  const optionGroupId = useId()

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sharing</FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-col gap-2">
                {REPORT_VISIBILITY_OPTIONS.map((option) => {
                  const { optionLabel, description, icon: Icon } = REPORT_VISIBILITY_META[option]
                  const optionId = `${optionGroupId}-${option}`

                  return (
                    <Label
                      key={option}
                      htmlFor={optionId}
                      className={cn('flex items-start gap-3 rounded-md border p-3 font-normal cursor-pointer transition-colors hover:bg-muted/50', field.value === option && 'border-primary')}
                    >
                      <RadioGroupItem value={option} id={optionId} className="mt-0.5" />
                      <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm">{optionLabel}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {visibility === ReportReportVisibility.RESTRICTED && (
        <FormField
          control={control}
          name="sharees"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>People</FormLabel>
              <FormControl>
                <ReportShareePicker excludedUserIds={excludedUserIds} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}

export default ReportSharingFields
