'use client'

import { useMemo } from 'react'
import { useIdentityHolder, useUpdateIdentityHolder, useDeleteIdentityHolder, useIdentityHoldersWithFilter, useGetIdentityHolderEdgesForMerge } from '@/lib/graphql-hooks/identity-holder'
import { IdentityHolderIdentityHolderType, IdentityHolderUserStatus, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeEdgeTransferCount, MergeFieldConfig, MergePreSaveExtrasResult } from '../types'

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

type EdgeConnection = { edges?: Array<{ node?: { id: string } | null } | null> | null }

type EdgeTransferSpec = {
  sourceKey: keyof NonNullable<NonNullable<ReturnType<typeof useGetIdentityHolderEdgesForMerge>['data']>['identityHolder']>
  addKey: keyof UpdateIdentityHolderInput
  label: string
}

const EDGE_TRANSFER_SPECS: EdgeTransferSpec[] = [
  { sourceKey: 'directoryAccounts', addKey: 'addDirectoryAccountIDs', label: 'Directory accounts' },
  { sourceKey: 'assessmentResponses', addKey: 'addAssessmentResponseIDs', label: 'Assessment responses' },
  { sourceKey: 'assets', addKey: 'addAssetIDs', label: 'Assets' },
  { sourceKey: 'entities', addKey: 'addEntityIDs', label: 'Entities' },
  { sourceKey: 'campaigns', addKey: 'addCampaignIDs', label: 'Campaigns' },
  { sourceKey: 'tasks', addKey: 'addTaskIDs', label: 'Tasks' },
  { sourceKey: 'controls', addKey: 'addControlIDs', label: 'Controls' },
  { sourceKey: 'internalPolicies', addKey: 'addInternalPolicyIDs', label: 'Internal policies' },
  { sourceKey: 'subcontrols', addKey: 'addSubcontrolIDs', label: 'Subcontrols' },
  { sourceKey: 'findings', addKey: 'addFindingIDs', label: 'Findings' },
  { sourceKey: 'files', addKey: 'addFileIDs', label: 'Files' },
]

const collectEdgeIds = (edges: EdgeConnection['edges']): string[] => (edges ?? []).map((e) => e?.node?.id).filter((id): id is string => typeof id === 'string')

const usePersonnelPreSaveExtras = ({
  secondaryId,
  primary,
}: {
  primaryId: string
  secondaryId: string | null
  primary: Personnel | null | undefined
}): MergePreSaveExtrasResult<UpdateIdentityHolderInput> => {
  const { data, isLoading } = useGetIdentityHolderEdgesForMerge(secondaryId)

  return useMemo(() => {
    if (!secondaryId || !data?.identityHolder) {
      return { data: null, counts: [], isLoading }
    }

    const holder = data.identityHolder
    const extras: Partial<UpdateIdentityHolderInput> = {}
    const counts: MergeEdgeTransferCount[] = []

    for (const spec of EDGE_TRANSFER_SPECS) {
      const connection = holder[spec.sourceKey] as EdgeConnection | null | undefined
      const ids = collectEdgeIds(connection?.edges)
      if (ids.length) {
        ;(extras as Record<string, unknown>)[spec.addKey] = ids
        counts.push({ label: spec.label, count: ids.length })
      }
    }

    const primaryUserID = primary?.userID ?? null
    if (!primaryUserID && holder.userID) {
      extras.userID = holder.userID
      counts.push({ label: 'User link', count: 1 })
    }

    return { data: extras, counts, isLoading }
  }, [data, isLoading, primary?.userID, secondaryId])
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
  emailAliasFold: {
    emailKey: 'email',
    aliasesKey: 'emailAliases',
    defaultOn: true,
    label: 'Add secondary email to aliases',
  },
  usePreSaveInputExtras: usePersonnelPreSaveExtras,
}
