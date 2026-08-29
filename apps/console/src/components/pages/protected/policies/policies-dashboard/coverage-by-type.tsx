'use client'

import React, { useMemo } from 'react'
import ProgressBar from './progress-bar'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/internal-policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'
import { isStringArray, loadFilters, saveFilters, type TFilterStateFor } from '@/components/shared/table-filter/filter-storage'
import { type TPolicyFilterKey } from '@/components/pages/protected/policies/table/table-config'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'
import { useOrganization } from '@/hooks/useOrganization'

const UNTYPED_LABEL = 'Type not defined'

const CoverageByType = ({ onTypeClick }: { onTypeClick: () => void }) => {
  const { currentOrgId } = useOrganization()
  const saved = loadFilters(TableKeyEnum.INTERNAL_POLICY, undefined, currentOrgId) || {}
  const validated = isStringArray(saved?.approverIDIn) ? saved?.approverIDIn : []
  const { policies } = useInternalPoliciesDashboard({
    where: {
      ...wherePoliciesDashboard,
      approverIDIn: validated,
    },
  })

  const handleTypeClick = (kind: string | null) => {
    const newState: TFilterStateFor<TPolicyFilterKey> = {
      approverIDIn: saved.approverIDIn || undefined,
      internalPolicyKindNameIn: kind === null ? { nullState: 'IsNil' } : [kind],
    }

    saveFilters(TableKeyEnum.INTERNAL_POLICY, newState, currentOrgId)
  }

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.INTERNAL_POLICY),
      field: 'kind',
    },
  })

  const groupedData = useMemo(() => {
    if (!policies?.length) return []

    const groups = new Map<string | null, { id: string; total: number; published: number; names: string[] }>()

    for (const policy of policies) {
      const kind = policy.internalPolicyKindName || null
      const group = groups.get(kind) ?? { id: '', total: 0, published: 0, names: [] }

      group.total++
      group.names.push(policy.name)
      group.id = policy.id
      if (policy.status === InternalPolicyDocumentStatus.PUBLISHED) {
        group.published++
      }
      groups.set(kind, group)
    }

    return [...groups.entries()]
      .map(([kind, { id, total, published, names }]) => ({
        id,
        kind,
        label: kind ?? UNTYPED_LABEL,
        names,
        percentage: Math.round((published / total) * 100),
        ratio: `${published}/${total}`,
      }))
      .sort((a, b) => (a.kind === null ? 1 : b.kind === null ? -1 : a.label.localeCompare(b.label)))
  }, [policies])

  const renderRow = ({ kind, label, percentage, ratio, names, id }: { kind: string | null; label: string; percentage: number; ratio: string; names: string[]; id: string }) => {
    const showList = names.slice(0, 10)
    const hasMore = names.length > 10
    const policyLink = `/policies/${id}/view`

    return (
      <div key={label} className="flex items-center gap-4 w-full md:w-[calc(50%-1.5rem)] cursor-pointer" onClick={() => handleTypeClick(kind)}>
        <Tooltip>
          <div className="min-w-36 shrink-0">
            <TooltipTrigger asChild>
              <CustomTypeEnumValue value={kind ?? ''} options={enumOptions ?? []} placeholder={UNTYPED_LABEL} />
            </TooltipTrigger>
          </div>

          <TooltipContent side="right" align="center" className="max-w-xs border p-3 rounded-md space-y-2">
            <p className="font-medium">{kind === null ? UNTYPED_LABEL : `${label} Policies`}</p>
            {showList.map((name, i) => (
              <Link href={policyLink} key={i}>
                <p className="text-sm text-muted-foreground truncate hover:underline">{name}</p>
              </Link>
            ))}
            {hasMore && (
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTypeClick(kind)
                }}
              >
                View all ({names.length})
              </Button>
            )}
          </TooltipContent>
        </Tooltip>
        <div className="grow">
          <ProgressBar percentage={percentage} />
        </div>
        <span className="text-sm text-text-informational w-10 text-right tabular-nums">{ratio}</span>
      </div>
    )
  }
  return (
    <div className="rounded-2xl py-6">
      <h2 className="text-lg font-medium mb-6">Coverage by Type</h2>

      <TooltipProvider>
        {groupedData.length === 0 ? (
          <p className="text-sm text-text-informational">No data available</p>
        ) : (
          <div className="flex flex-wrap gap-8" onClick={onTypeClick}>
            {groupedData.map(renderRow)}
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}

export default CoverageByType
