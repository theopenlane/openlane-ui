'use client'

import { useMemo } from 'react'
import { useEntity, useUpdateEntity, useDeleteEntity, useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { EntityEntityStatus, type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeFieldOverrides } from '../types'

type Vendor = NonNullable<EntityQuery['entity']>

const statusOptions = Object.values(EntityEntityStatus).map((v) => ({ value: v, label: getEnumLabel(v) }))

const fieldOverrides: MergeFieldOverrides<Vendor> = {
  description: { label: 'Description', type: 'longText' },
  status: { label: 'Status', type: 'enum', enumOptions: statusOptions },
  contractStartDate: { label: 'Contract start', type: 'date' },
  contractEndDate: { label: 'Contract end', type: 'date' },
  mfaEnforced: { label: 'MFA enforced', type: 'boolean' },
  mfaSupported: { label: 'MFA supported', type: 'boolean' },
  hasSoc2: { label: 'Has SOC2', type: 'boolean' },
  ssoEnforced: { label: 'SSO enforced', type: 'boolean' },
  vendorMetadata: { label: 'Vendor metadata', type: 'map' },
}

const excludeFields = [
  'internalOwner',
  'internalOwnerGroup',
  'internalOwnerUser',
  'reviewedBy',
  'reviewedByGroup',
  'reviewedByUser',
  'logoFile',
  'logoFileID',
  'entityTypeID',
  'entityRelationshipStateID',
  'entitySecurityQuestionnaireStatusID',
  'entitySourceTypeID',
] as const satisfies ReadonlyArray<Extract<keyof Vendor, string>>

const useFetchVendor = (id: string | null) => {
  const { data, isLoading, error } = useEntity(id ?? undefined)
  return { data: (data?.entity ?? null) as Vendor | null, isLoading, error }
}

const useUpdateVendor = () => {
  const base = useUpdateEntity()
  return {
    isPending: base.isPending,
    mutateAsync: async ({ id, input }: { id: string; input: UpdateEntityInput }) => base.mutateAsync({ updateEntityId: id, input }),
  }
}

const useDeleteVendor = () => {
  const base = useDeleteEntity()
  return {
    isPending: base.isPending,
    mutateAsync: async (id: string) => base.mutateAsync({ deleteEntityId: id }),
  }
}

const useSearchVendors = (search: string, excludeId: string) => {
  const where = useMemo(() => {
    const base: Record<string, unknown> = { idNEQ: excludeId }
    const term = search.trim()
    if (term) {
      base.or = [{ nameContainsFold: term }, { displayNameContainsFold: term }]
    }
    return base
  }, [search, excludeId])

  const { vendorNodes, isLoading } = useVendorsWithFilter({
    where: where as NonNullable<Parameters<typeof useVendorsWithFilter>[0]>['where'],
    pagination: { query: { first: 10 }, page: 1, pageSize: 10 },
  })

  const options = useMemo(
    () =>
      vendorNodes.map((n) => ({
        id: n.id,
        label: n.displayName ?? n.name ?? n.id,
        sublabel: n.name && n.displayName && n.name !== n.displayName ? n.name : undefined,
      })),
    [vendorNodes],
  )

  return { options, isLoading }
}

export const vendorMergeConfig: MergeConfig<Vendor, UpdateEntityInput> = {
  entityType: 'Entity',
  labelSingular: 'vendor',
  labelPlural: 'vendors',
  fieldOverrides,
  excludeFields,
  useFetchRecord: useFetchVendor,
  useUpdate: useUpdateVendor,
  useDelete: useDeleteVendor,
  useSearchRecords: useSearchVendors,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateEntityInput,
  invalidateKeys: [['entities']],
  getDisplayName: (record) => record.displayName ?? record.name ?? record.id,
}
