'use client'

import { useMemo } from 'react'
import { useContact, useUpdateContact, useDeleteContact, useContactsWithFilter } from '@/lib/graphql-hooks/contact'
import { ContactUserStatus, type ContactQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeFieldConfig } from '../types'

type Contact = NonNullable<ContactQuery['contact']>

const statusOptions = Object.values(ContactUserStatus).map((v) => ({ value: v, label: getEnumLabel(v) }))

const fields: MergeFieldConfig<Contact>[] = [
  { key: 'fullName', label: 'Full name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'company', label: 'Company', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'phoneNumber', label: 'Phone number', type: 'text' },
  { key: 'address', label: 'Address', type: 'longText' },
  { key: 'status', label: 'Status', type: 'enum', enumOptions: statusOptions },
  { key: 'tags', label: 'Tags', type: 'tags' },
]

const useFetchContact = (id: string | null) => {
  const { data, isLoading, error } = useContact(id ?? undefined)
  return { data: (data?.contact ?? null) as Contact | null, isLoading, error }
}

const useUpdateContactMutation = () => {
  const base = useUpdateContact()
  return {
    isPending: base.isPending,
    mutateAsync: async ({ id, input }: { id: string; input: UpdateContactInput }) => base.mutateAsync({ updateContactId: id, input }),
  }
}

const useDeleteContactMutation = () => {
  const base = useDeleteContact()
  return {
    isPending: base.isPending,
    mutateAsync: async (id: string) => base.mutateAsync({ deleteContactId: id }),
  }
}

const useSearchContacts = (search: string, excludeId: string) => {
  const where = useMemo(() => {
    const base: Record<string, unknown> = { idNEQ: excludeId }
    const term = search.trim()
    if (term) {
      base.or = [{ fullNameContainsFold: term }, { emailContainsFold: term }]
    }
    return base
  }, [search, excludeId])

  const { contactsNodes, isLoading } = useContactsWithFilter({
    where: where as Parameters<typeof useContactsWithFilter>[0]['where'],
    pagination: { query: { first: 10 }, page: 1, pageSize: 10 },
  })

  const options = useMemo(
    () =>
      contactsNodes.map((n) => ({
        id: n.id,
        label: n.fullName ?? n.email ?? n.id,
        sublabel: n.email && n.fullName ? n.email : undefined,
      })),
    [contactsNodes],
  )

  return { options, isLoading }
}

export const contactMergeConfig: MergeConfig<Contact, UpdateContactInput> = {
  entityType: 'Contact',
  labelSingular: 'contact',
  labelPlural: 'contacts',
  fields,
  useFetchRecord: useFetchContact,
  useUpdate: useUpdateContactMutation,
  useDelete: useDeleteContactMutation,
  useSearchRecords: useSearchContacts,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateContactInput,
  invalidateKeys: [['contacts']],
  getDisplayName: (record) => record.fullName ?? record.email ?? record.id,
}
