'use client'

import { useMemo } from 'react'
import { useIdentityHolder, useUpdateIdentityHolder, useDeleteIdentityHolder, useIdentityHoldersWithFilter } from '@/lib/graphql-hooks/identity-holder'
import { type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import type { MergeConfig, MergeEdgeTransferCount, MergeFieldOverrides, MergePreSaveExtrasResult } from '../types'

type Personnel = NonNullable<IdentityHolderQuery['identityHolder']>

const fieldOverrides: MergeFieldOverrides<Personnel> = {
  identityHolderType: { label: 'Type', type: 'enum' },
  isActive: { label: 'Active', type: 'boolean' },
  externalReferenceID: { label: 'External reference ID', type: 'text' },
  externalUserID: { label: 'External user ID', type: 'text' },
}

const excludeFields = [
  'internalOwner',
  'internalOwnerGroup',
  'internalOwnerUser',
  'userID',
  'employerEntityID',
  'hasPendingWorkflow',
  'hasWorkflowHistory',
  'workflowEligibleMarker',
  'avatarRemoteURL',
] as const satisfies ReadonlyArray<Extract<keyof Personnel, string>>

const schemaExcludeFields = ['internalOwnerGroupID', 'internalOwnerUserID'] as const

export const getPersonnelLabel = (record: Pick<Personnel, 'id' | 'fullName' | 'email'>) => record.fullName || record.email || record.id

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
        label: n.fullName || n.email || n.id,
        sublabel: n.email && n.fullName ? n.email : undefined,
      })),
    [identityHoldersNodes],
  )

  return { options, isLoading }
}

const personnelPreSaveExtras = ({ primary, secondary }: { primary: Personnel; secondary: Personnel }): MergePreSaveExtrasResult<UpdateIdentityHolderInput> => {
  const data: Partial<UpdateIdentityHolderInput> = {}
  const counts: MergeEdgeTransferCount[] = []

  if (!primary.userID && secondary.userID) {
    data.userID = secondary.userID
    counts.push({ key: 'userID', label: 'User link', count: 1 })
  }

  if (!primary.employerEntityID && secondary.employerEntityID) {
    data.employerID = secondary.employerEntityID
    counts.push({ key: 'employerID', label: 'Employer', count: 1 })
  }

  return { data, counts }
}

export const personnelMergeConfig: MergeConfig<Personnel, UpdateIdentityHolderInput, 'IdentityHolder'> = {
  entityType: 'IdentityHolder',
  labelSingular: 'personnel record',
  labelPlural: 'personnel records',
  fieldOverrides,
  excludeFields,
  schemaExcludeFields,
  useFetchRecord: useFetchPersonnel,
  useUpdate: useUpdatePersonnel,
  useDelete: useDeletePersonnel,
  useSearchRecords: useSearchPersonnel,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateIdentityHolderInput,
  invalidateKeys: [['identityHolders']],
  getDisplayName: getPersonnelLabel,
  emailAliasFold: {
    emailKey: 'email',
    aliasesKey: 'emailAliases',
    defaultOn: true,
    label: 'Add secondary email to aliases',
  },
  preSaveInputExtras: personnelPreSaveExtras,
  deleteSecondaryFirst: true,
}
