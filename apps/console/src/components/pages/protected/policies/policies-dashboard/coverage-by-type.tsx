'use client'

import React, { useMemo } from 'react'
import ProgressBar from './progress-bar'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/internal-policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'
import { isStringArray, loadFilters, saveFilters } from '@/components/shared/table-filter/filter-storage'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

export default function CoverageByType({ onTypeClick }: { onTypeClick: () => void }) {
  const saved = loadFilters(TableKeyEnum.INTERNAL_POLICY) || {}
  const validated = isStringArray(saved?.approverIDIn) ? saved?.approverIDIn : []
  const { policies } = useInternalPoliciesDashboard({
    where: {
      ...wherePoliciesDashboard,
      approverIDIn: validated,
    },
  })

  function handleTypeClick(type: string) {
    const newState = {
      approverIDIn: saved.approverIDIn || undefined,
      internalPolicyKindNameIn: type !== 'Unknown' ? [type] : undefined,
    }

    saveFilters(TableKeyEnum.INTERNAL_POLICY, newState)
  }

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.INTERNAL_POLICY),
      field: 'kind',
    },
  })

  const groupedData = useMemo(() => {
    if (!policies?.length) return []

    const groups: Record<string, { id: string; total: number; published: number; names: string[] }> = {}

    for (const policy of policies) {
      const type = policy.internalPolicyKindName || 'Unknown'
      if (!groups[type]) {
        groups[type] = { id: '', total: 0, published: 0, names: [] }
      }
      groups[type].total++
      groups[type].names.push(policy.name)

      groups[type].id = policy.id
      if (policy.status === InternalPolicyDocumentStatus.PUBLISHED) {
        groups[type].published++
      }
    }
    return Object.entries(groups)
      .map(([type, { id, total, published, names }]) => ({
        id,
        label: type,
        names,
        percentage: Math.round((published / total) * 100),
        ratio: `${published}/${total}`,
      }))
      .sort((a, b) => (a.label === 'Unknown' ? 1 : b.label === 'Unknown' ? -1 : a.label.localeCompare(b.label)))
  }, [policies])

  const renderRow = ({ label, percentage, ratio, names, id }: { label: string; percentage: number; ratio: string; names: string[]; id: string }) => {
    const showList = names.slice(0, 10)
    const hasMore = names.length > 10
    const policyLink = `/policies/${id}/view`

    return (
      <div key={label} className="flex items-center gap-4 w-full md:w-[calc(50%-1.5rem)] cursor-pointer" onClick={() => handleTypeClick(label)}>
        <Tooltip>
          <div className="min-w-36 shrink-0">
            <TooltipTrigger asChild>
              <CustomTypeEnumValue value={label || ''} options={enumOptions ?? []} />
            </TooltipTrigger>
          </div>

          <TooltipContent side="right" align="center" className="max-w-xs border p-3 rounded-md space-y-2">
            <p className="font-medium">{label} Policies</p>
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
                  handleTypeClick(label)
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
