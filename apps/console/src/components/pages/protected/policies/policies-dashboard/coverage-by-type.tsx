'use client'

import React, { useMemo } from 'react'
import ProgressBar from './progress-bar'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'
import { isStringArray, loadFilters, saveFilters } from '@/components/shared/table-filter/filter-storage'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'

export default function CoverageByType({ onTypeClick }: { onTypeClick: () => void }) {
  const saved = loadFilters(TableFilterKeysEnum.POLICY) || {}
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
      policyTypeIsNil: type === 'Unknown' ? true : undefined,
      policyType: type !== 'Unknown' ? [type] : undefined,
    }

    saveFilters(TableFilterKeysEnum.POLICY, newState)
  }

  const groupedData = useMemo(() => {
    if (!policies?.length) return []

    const groups: Record<string, { total: number; published: number; names: string[] }> = {}

    for (const policy of policies) {
      const type = policy.policyType || 'Unknown'
      if (!groups[type]) {
        groups[type] = { total: 0, published: 0, names: [] }
      }
      groups[type].total++
      groups[type].names.push(policy.name)

      if (policy.status === InternalPolicyDocumentStatus.PUBLISHED) {
        groups[type].published++
      }
    }

    return Object.entries(groups)
      .map(([type, { total, published, names }]) => ({
        label: type,
        names,
        percentage: Math.round((published / total) * 100),
        ratio: `${published}/${total}`,
      }))
      .sort((a, b) => (a.label === 'Unknown' ? 1 : b.label === 'Unknown' ? -1 : a.label.localeCompare(b.label)))
  }, [policies])

  const renderRow = ({ label, percentage, ratio, names }: { label: string; percentage: number; ratio: string; names: string[] }) => {
    const showList = names.slice(0, 10)
    const hasMore = names.length > 10

    return (
      <Tooltip key={label}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 w-full md:w-[calc(50%-1rem)] cursor-pointer" onClick={() => handleTypeClick(label)}>
            <span className="w-24 text-sm truncate">{label}</span>
            <ProgressBar percentage={percentage} />
            <span className="text-sm text-text-informational w-12 text-right">{ratio}</span>
          </div>
        </TooltipTrigger>

        <TooltipContent side="right" className="max-w-xs border p-3 rounded-md space-y-2">
          <p className="font-medium">{label} Policies</p>

          {showList.map((name, i) => (
            <p key={i} className="text-sm text-muted-foreground truncate">
              {name}
            </p>
          ))}

          {hasMore && (
            <Button
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
