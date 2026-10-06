'use client'

import { useMemo } from 'react'
import { GalleryVerticalEndIcon, Mail } from 'lucide-react'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useContacts } from '@/lib/graphql-hooks/contact'
import { emailOrFullNameSearchWhere, useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { type TAssessmentRecipient } from '@/lib/graphql-hooks/assessment-response'
import { isValidEmail, normalizeEmail } from '@/lib/validators'

export type TAssessmentRecipientKind = 'personnel' | 'contact' | 'email'

export type TAssessmentRecipientOption = TAssessmentRecipient & { id: string; name: string; kind: TAssessmentRecipientKind }

type TAssessmentRecipientSelectProps = {
  value: TAssessmentRecipientOption[]
  onChange: (recipients: TAssessmentRecipientOption[]) => void
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

const MIN_SEARCH_LENGTH = 2
const RECIPIENT_RESULT_LIMIT = 10
const PERSONNEL_PAGINATION = { page: 1, pageSize: RECIPIENT_RESULT_LIMIT, query: { first: RECIPIENT_RESULT_LIMIT } }

const PersonnelIcon = ObjectAssociationMap.identityHolders.icon

const RECIPIENT_ICONS: Record<TAssessmentRecipientKind, React.ReactNode> = {
  personnel: <PersonnelIcon className="h-3.5 w-3.5" />,
  contact: <GalleryVerticalEndIcon className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
}

const toRecipientOption = (email: string, fullName: string | null | undefined, kind: TAssessmentRecipientKind, identityHolderID?: string): TAssessmentRecipientOption => ({
  id: normalizeEmail(email),
  name: fullName?.trim() || email,
  email,
  kind,
  ...(identityHolderID && { identityHolderID }),
})

const firstById = (options: TAssessmentRecipientOption[]) => options.filter((option, index) => options.findIndex(({ id }) => id === option.id) === index)

export const AssessmentRecipientSelect = ({ value, onChange, ...ariaProps }: TAssessmentRecipientSelectProps) => {
  const { term, setSearchText, debouncedTerm, canQuery, getIsSearching } = useAsyncCommandSearch({ minLength: MIN_SEARCH_LENGTH })
  const where = emailOrFullNameSearchWhere(debouncedTerm)

  const { nodes: personnel, isFetching: isFetchingPersonnel } = useIdentityHolderOptions({ where, pagination: PERSONNEL_PAGINATION, enabled: canQuery })
  const { contacts, isFetching: isFetchingContacts } = useContacts({ where, first: RECIPIENT_RESULT_LIMIT, enabled: canQuery })
  const isSearching = getIsSearching(isFetchingPersonnel, isFetchingContacts)

  const options = useMemo(() => {
    if (isSearching || !canQuery) return []
    return firstById([
      ...personnel.map((person) => toRecipientOption(person.email, person.fullName, 'personnel', person.id)),
      ...contacts.flatMap((contact) => (contact.email ? [toRecipientOption(contact.email, contact.fullName, 'contact')] : [])),
      ...(isValidEmail(term) ? [toRecipientOption(term, null, 'email')] : []),
    ])
  }, [canQuery, contacts, isSearching, personnel, term])

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
      icon={(option) => RECIPIENT_ICONS[option.kind]}
      placeholder="Search for people or enter email addresses..."
      searchPlaceholder="Search personnel and contacts, or type an email..."
      emptyMessage={term.length < MIN_SEARCH_LENGTH ? `Type at least ${MIN_SEARCH_LENGTH} characters to search.` : 'No matches. Type a full email address to add it.'}
      onSearchTextChange={setSearchText}
      renderItemEnd={(option) => option.name !== option.email && <span className="text-xs text-muted-foreground">{option.email}</span>}
    />
  )
}
