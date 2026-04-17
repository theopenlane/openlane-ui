'use client'

import { useMemo } from 'react'
import { useIdentityHolder, useUpdateIdentityHolder, useDeleteIdentityHolder, useIdentityHoldersWithFilter } from '@/lib/graphql-hooks/identity-holder'
import { IdentityHolderIdentityHolderType, IdentityHolderUserStatus, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeFieldConfig } from '../types'

type Personnel = NonNullable<IdentityHolderQuery['identityHolder']>

const statusOptions = Object.values(IdentityHolderUserStatus).map((v) => ({ value: v, label: getEnumLabel(v) }))
const typeOptions = Object.values(IdentityHolderIdentityHolderType).map((v) => ({ value: v, label: getEnumLabel(v) }))

const fields: MergeFieldConfig<Personnel>[] = [
  { key: 'fullName', label: 'Full name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'emailAliases', label: 'Email aliases', type: 'tags' },
  { key: 'identityHolderType', label: 'Type', type: 'enum', enumOptions: typeOptions },
  { key: 'status', label: 'Status', type: 'enum', enumOptions: statusOptions },
  { key: 'isActive', label: 'Active', type: 'boolean' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'team', label: 'Team', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'phoneNumber', label: 'Phone number', type: 'text' },
  { key: 'startDate', label: 'Start date', type: 'date' },
  { key: 'endDate', label: 'End date', type: 'date' },
  { key: 'externalReferenceID', label: 'External reference ID', type: 'text' },
  { key: 'externalUserID', label: 'External user ID', type: 'text' },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'metadata', label: 'Metadata', type: 'map' },
]

const useFetchPersonnel = (id: string | null) => {
  const { data, isLoading, error } = useIdentityHolder(id ?? undefined)
  return { data: (data?.identityHolder ?? null) as Personnel | null, isLoading, error }
}

const useUpdatePersonnel = () => {
  const base = useUpdateIdentityHolder()
  return {
    isPending: base.isPending,
    mutateAsync: async ({ id, input }: { id: string; input: UpdateIdentityHolderInput }) => base.mutateAsync({ updateIdentityHolderId: id, input }),
  }
}

const useDeletePersonnel = () => {
  const base = useDeleteIdentityHolder()
  return {
    isPending: base.isPending,
    mutateAsync: async (id: string) => base.mutateAsync({ deleteIdentityHolderId: id }),
  }
}

const useSearchPersonnel = (search: string, excludeId: string) => {
  const where = useMemo(() => {
    const base: Record<string, unknown> = { idNEQ: excludeId }
    const term = search.trim()
    if (term) {
      base.or = [{ fullNameContainsFold: term }, { emailContainsFold: term }]
    }
    return base
  }, [search, excludeId])

  const { identityHoldersNodes, isLoading } = useIdentityHoldersWithFilter({
    where: where as Parameters<typeof useIdentityHoldersWithFilter>[0]['where'],
    pagination: { query: { first: 10 }, page: 1, pageSize: 10 },
  })

  const options = useMemo(
    () =>
      identityHoldersNodes.map((n) => ({
        id: n.id,
        label: n.fullName ?? n.email ?? n.id,
        sublabel: n.email && n.fullName ? n.email : undefined,
      })),
    [identityHoldersNodes],
  )

  return { options, isLoading }
}

export const personnelMergeConfig: MergeConfig<Personnel, UpdateIdentityHolderInput> = {
  entityType: 'IdentityHolder',
  labelSingular: 'personnel record',
  labelPlural: 'personnel records',
  fields,
  useFetchRecord: useFetchPersonnel,
  useUpdate: useUpdatePersonnel,
  useDelete: useDeletePersonnel,
  useSearchRecords: useSearchPersonnel,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateIdentityHolderInput,
  invalidateKeys: [['identityHolders']],
  getDisplayName: (record) => record.fullName ?? record.email ?? record.id,
}
