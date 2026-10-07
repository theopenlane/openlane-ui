'use client'

import { useState } from 'react'
import { SearchableItemSelect, type TSearchableItemSelectAriaProps } from '@/components/shared/searchable-item-select/searchable-item-select'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { type TInternalPolicyDocument, useSearchInternalPolicyDocuments } from '@/lib/graphql-hooks/internal-policy'
import { MAX_ACKNOWLEDGEMENT_POLICIES, MAX_ACKNOWLEDGEMENT_POLICIES_MESSAGE } from './use-acknowledgement-request-form-schema'

const PolicyIcon = ObjectAssociationMap.policies.icon

type TAcknowledgementPolicySelectProps = TSearchableItemSelectAriaProps & {
  value: TInternalPolicyDocument[]
  onChange: (policies: TInternalPolicyDocument[]) => void
}

export const AcknowledgementPolicySelect = ({ value, onChange, ...ariaProps }: TAcknowledgementPolicySelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { policies, totalCount, isFetching, isError } = useSearchInternalPolicyDocuments({ search: debouncedTerm, enabled: isOpen })
  const isSearching = getIsSearching(isFetching)
  const isAtLimit = value.length >= MAX_ACKNOWLEDGEMENT_POLICIES

  const handleSelectedIdsChange = (ids: string[]) => {
    const known = new Map([...value, ...policies].map((policy) => [policy.id, policy]))
    onChange(ids.flatMap((id) => known.get(id) ?? []))
  }

  return (
    <SearchableItemSelect
      {...ariaProps}
      selectedIds={value.map((policy) => policy.id)}
      onSelectedIdsChange={handleSelectedIdsChange}
      onOpenChange={setIsOpen}
      items={isSearching ? [] : policies}
      knownItems={value}
      isLoading={isSearching}
      icon={<PolicyIcon className="h-4 w-4" />}
      placeholder="Add policies"
      searchPlaceholder={totalCount > policies.length ? `Showing ${policies.length} of ${totalCount} policies. Type to search...` : 'Search policies...'}
      emptyMessage={isError ? 'Could not load policies. Please try again later.' : 'No policies found.'}
      onSearchTextChange={setSearchText}
      disabledReason={(policy) => (isAtLimit && !value.some(({ id }) => id === policy.id) ? MAX_ACKNOWLEDGEMENT_POLICIES_MESSAGE : undefined)}
      renderItemEnd={(policy) => policy.revision && <span className="text-xs text-muted-foreground">{policy.revision}</span>}
    />
  )
}
