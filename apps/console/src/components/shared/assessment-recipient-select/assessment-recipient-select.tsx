'use client'

import { useMemo } from 'react'
import { Mail } from 'lucide-react'
import { SearchableItemSelect, type TSearchableItemSelectAriaProps } from '@/components/shared/searchable-item-select/searchable-item-select'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { emailOrFullNameSearchWhere, useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { type TAssessmentRecipient } from '@/lib/graphql-hooks/assessment-response'
import { isValidEmail, normalizeEmail } from '@/lib/validators'

export type TAssessmentRecipientOption = TAssessmentRecipient & { id: string; name: string }

type TAssessmentRecipientSelectProps = TSearchableItemSelectAriaProps & {
  value: TAssessmentRecipientOption[]
  onChange: (recipients: TAssessmentRecipientOption[]) => void
}

const MIN_SEARCH_LENGTH = 2
const RECIPIENT_RESULT_LIMIT = 10
const PERSONNEL_PAGINATION = { page: 1, pageSize: RECIPIENT_RESULT_LIMIT, query: { first: RECIPIENT_RESULT_LIMIT } }

const PersonnelIcon = ObjectAssociationMap.identityHolders.icon

const personnelIcon = <PersonnelIcon className="h-3.5 w-3.5" />
const emailIcon = <Mail className="h-3.5 w-3.5" />

const toRecipientOption = (email: string, fullName?: string | null, identityHolderID?: string): TAssessmentRecipientOption => ({
  id: normalizeEmail(email),
  name: fullName?.trim() || email,
  email,
  ...(identityHolderID && { identityHolderID }),
})

const firstById = (options: TAssessmentRecipientOption[]) => options.filter((option, index) => options.findIndex(({ id }) => id === option.id) === index)

export const AssessmentRecipientSelect = ({ value, onChange, ...ariaProps }: TAssessmentRecipientSelectProps) => {
  const { term, setSearchText, debouncedTerm, canQuery, getIsSearching } = useAsyncCommandSearch({ minLength: MIN_SEARCH_LENGTH })
  const where = emailOrFullNameSearchWhere(debouncedTerm)

  const { nodes: personnel, isFetching } = useIdentityHolderOptions({ where, pagination: PERSONNEL_PAGINATION, enabled: canQuery })
  const isSearching = getIsSearching(isFetching)

  const options = useMemo(() => {
    if (isSearching || !canQuery) return []
    return firstById([...personnel.map((person) => toRecipientOption(person.email, person.fullName, person.id)), ...(isValidEmail(term) ? [toRecipientOption(term)] : [])])
  }, [canQuery, isSearching, personnel, term])

  const handleSelectedIdsChange = (ids: string[]) => {
    const known = new Map([...value, ...options].map((option) => [option.id, option]))
    onChange(ids.flatMap((id) => known.get(id) ?? []))
  }

  return (
    <SearchableItemSelect
      {...ariaProps}
      selectedIds={value.map((option) => option.id)}
      onSelectedIdsChange={handleSelectedIdsChange}
      items={options}
      knownItems={value}
      isLoading={isSearching}
      icon={(option) => (option.identityHolderID ? personnelIcon : emailIcon)}
      placeholder="Search for personnel or enter email addresses..."
      searchPlaceholder="Search personnel, or type an email..."
      emptyMessage={term.length < MIN_SEARCH_LENGTH ? `Type at least ${MIN_SEARCH_LENGTH} characters to search.` : 'No matches. Type a full email address to add it.'}
      onSearchTextChange={setSearchText}
      renderItemEnd={(option) => option.name !== option.email && <span className="text-xs text-muted-foreground">{option.email}</span>}
    />
  )
}
