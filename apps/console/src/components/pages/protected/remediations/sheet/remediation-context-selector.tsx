'use client'

import React, { useMemo, useState } from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { SearchableItemSelect, type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { REMEDIATION_CONTEXT_TYPES, type TRemediationContextType, useRemediationContextOptions } from '@/lib/graphql-hooks/remediation'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { type RemediationFormData } from '../hooks/use-form-schema'
import { remediationContextTypeLabel, type TRemediationContext } from './remediation-context'

type TRemediationContextSelectorProps = {
  form: UseFormReturn<RemediationFormData>
  selected?: TRemediationContext
}

const RemediationContextSelector: React.FC<TRemediationContextSelectorProps> = ({ form, selected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const contextType = useWatch({ control: form.control, name: 'contextType' })
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { data, isFetching } = useRemediationContextOptions({ type: contextType, searchTerm: debouncedTerm, enabled: isOpen })

  const isSearching = getIsSearching(isFetching)
  const items = useMemo<SearchableItem[]>(() => {
    if (isSearching) {
      return []
    }
    switch (contextType) {
      case ObjectAssociationNodeEnum.VULNERABILITY:
        return getNodes(data?.vulnerabilities).map((node) => ({ id: node.id, name: node.displayName || getVulnerabilityTitle(node) }))
      case ObjectAssociationNodeEnum.FINDING:
        return getNodes(data?.findings).map((node) => ({ id: node.id, name: node.displayName || node.displayID }))
      case ObjectAssociationNodeEnum.RISKS:
        return getNodes(data?.risks).map((node) => ({ id: node.id, name: node.name || node.displayID }))
      default:
        return []
    }
  }, [contextType, data, isSearching])

  const knownItems = useMemo<SearchableItem[]>(() => (selected ? [{ id: selected.id, name: selected.heading }] : []), [selected])
  const TypeIcon = contextType ? ObjectAssociationMap[contextType].icon : null

  const changeType = (type: TRemediationContextType) => {
    form.setValue('contextType', type, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
    form.setValue('contextId', undefined, { shouldDirty: true })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="contextType"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Issue type</FormLabel>
            <Select value={field.value ?? ''} onValueChange={(value) => changeType(value as TRemediationContextType)}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {REMEDIATION_CONTEXT_TYPES.map((type) => {
                  const Icon = ObjectAssociationMap[type].icon
                  return (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <Icon size={14} />
                        {remediationContextTypeLabel(type)}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contextId"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>Object</FormLabel>
            <FormControl>
              <SearchableItemSelect
                multiple={false}
                selectedIds={field.value ? [field.value] : []}
                onSelectedIdsChange={(ids) => field.onChange(ids[0])}
                items={items}
                knownItems={knownItems}
                isLoading={isSearching}
                icon={TypeIcon ? <TypeIcon size={14} /> : null}
                placeholder={contextType ? `Search for a ${remediationContextTypeLabel(contextType).toLowerCase()}` : 'Select an issue type first'}
                searchPlaceholder="Search for object"
                emptyMessage={contextType ? 'No results found.' : 'Select an issue type first.'}
                onSearchTextChange={setSearchText}
                onOpenChange={setIsOpen}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default RemediationContextSelector
