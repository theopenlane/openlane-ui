'use client'

import { useMemo } from 'react'
import { useEntity, useUpdateEntity, useDeleteEntity, useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { EntityEntityStatus, type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeFieldConfig } from '../types'

type Vendor = NonNullable<EntityQuery['entity']>

const statusOptions = Object.values(EntityEntityStatus).map((v) => ({ value: v, label: getEnumLabel(v) }))

const fields: MergeFieldConfig<Vendor>[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'displayName', label: 'Display name', type: 'text' },
  { key: 'description', label: 'Description', type: 'longText' },
  { key: 'status', label: 'Status', type: 'enum', enumOptions: statusOptions },
  { key: 'annualSpend', label: 'Annual spend', type: 'number' },
  { key: 'billingModel', label: 'Billing model', type: 'text' },
  { key: 'contractStartDate', label: 'Contract start', type: 'date' },
  { key: 'contractEndDate', label: 'Contract end', type: 'date' },
  { key: 'domains', label: 'Domains', type: 'tags' },
  { key: 'mfaEnforced', label: 'MFA enforced', type: 'boolean' },
  { key: 'mfaSupported', label: 'MFA supported', type: 'boolean' },
  { key: 'hasSoc2', label: 'Has SOC2', type: 'boolean' },
  { key: 'tags', label: 'Tags', type: 'tags' },
]

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
  fields,
  useFetchRecord: useFetchVendor,
  useUpdate: useUpdateVendor,
  useDelete: useDeleteVendor,
  useSearchRecords: useSearchVendors,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateEntityInput,
  invalidateKeys: [['entities']],
  getDisplayName: (record) => record.displayName ?? record.name ?? record.id,
}
