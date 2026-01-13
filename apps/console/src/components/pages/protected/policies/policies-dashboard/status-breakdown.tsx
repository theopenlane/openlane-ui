'use client'

import React, { useMemo } from 'react'
import { DonutChart } from '@repo/ui/donut-chart'
import { FileCheck2, FilePen, ScanEye, Stamp } from 'lucide-react'
import { wherePoliciesDashboard } from './dashboard-config'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'
import { isStringArray, loadFilters } from '@/components/shared/table-filter/filter-storage'
import { saveFilters } from '@/components/shared/table-filter/filter-storage'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Button } from '@repo/ui/button'
import Link from 'next/link'

interface Props {
  onStatusClick: () => void
}

export default function StatusBreakdown({ onStatusClick }: Props) {
  const saved = loadFilters(TableFilterKeysEnum.POLICY) || {}
  const validated = isStringArray(saved?.approverIDIn) ? saved?.approverIDIn : []
  const { policies } = useInternalPoliciesDashboard({
    where: { ...wherePoliciesDashboard, approverIDIn: validated },
  })

  const statusCounts = useMemo(() => {
    const counts: Record<InternalPolicyDocumentStatus, number> = {
      [InternalPolicyDocumentStatus.PUBLISHED]: 0,
      [InternalPolicyDocumentStatus.DRAFT]: 0,
      [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: 0,
      [InternalPolicyDocumentStatus.APPROVED]: 0,
      [InternalPolicyDocumentStatus.ARCHIVED]: 0,
    }

    for (const p of policies) {
      if (p?.status && counts[p.status] !== undefined) counts[p.status]++
    }
    return counts
  }, [policies])

  const policiesByStatus = useMemo(() => {
    const map: Record<InternalPolicyDocumentStatus, { id: string; name: string }[]> = {
      PUBLISHED: [],
      DRAFT: [],
      NEEDS_APPROVAL: [],
      APPROVED: [],
      ARCHIVED: [],
    }

    for (const p of policies) {
      if (p?.status) map[p.status].push({ id: p.id, name: p.name })
    }

    return map
  }, [policies])

  const donutChartData = [
    { name: 'Published', value: statusCounts[InternalPolicyDocumentStatus.PUBLISHED] },
    { name: 'Draft', value: statusCounts[InternalPolicyDocumentStatus.DRAFT] },
    { name: 'Review', value: statusCounts[InternalPolicyDocumentStatus.NEEDS_APPROVAL] },
    { name: 'Approved', value: statusCounts[InternalPolicyDocumentStatus.APPROVED] },
  ]

  const donutChartColors = ['#107565', '#EAB308', '#017BFE', '#4ADE80']

  const statusItems = [
    { label: 'Published', key: InternalPolicyDocumentStatus.PUBLISHED, color: '#107565', icon: FileCheck2 },
    { label: 'Draft', key: InternalPolicyDocumentStatus.DRAFT, color: '#EAB308', icon: FilePen },
    { label: 'Review', key: InternalPolicyDocumentStatus.NEEDS_APPROVAL, color: '#017BFE', icon: ScanEye },
    { label: 'Approved', key: InternalPolicyDocumentStatus.APPROVED, color: '#4ADE80', icon: Stamp },
  ]

  function handleStatusClick(status: InternalPolicyDocumentStatus) {
    onStatusClick()
    const newState = {
      approverIDIn: saved.approverIDIn || undefined,
      status: [status],
    }

    saveFilters(TableFilterKeysEnum.POLICY, newState)
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-lg mb-7">Status Breakdown</h2>

      <div className="flex gap-5 rounded-2xl w-full lg:w-1/3">
        {/* Donut Chart */}
        <div className="flex">
          <DonutChart data={donutChartData} colors={donutChartColors} width={66} height={66} innerRadius={23} outerRadius={33} />
        </div>

        {/* Legend */}
        <TooltipProvider>
          <ul className="space-y-4">
            {statusItems.map(({ label, key, color, icon: Icon }) => {
              const list = policiesByStatus[key]
              const showList = list.slice(0, 10)
              const hasMore = list.length > 10

              return (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <li className="flex items-center cursor-pointer" onClick={() => handleStatusClick(key)}>
                      <div className="flex items-center gap-1.5">
                        <Icon size={16} style={{ color }} />
                        <span className="text-base font-medium">{label}</span>
                      </div>
                      <span className="ml-1.5 border w-7 h-7 flex items-center justify-center rounded-full text-sm">{statusCounts[key] ?? 0}</span>
                    </li>
                  </TooltipTrigger>

                  <TooltipContent side="right" className="max-w-xs border p-3 rounded-md space-y-2">
                    <p className="font-medium">{label} Policies</p>

                    {showList.map((item, i) => {
                      const policyLink = `/policies/${item.id}/view`
                      return (
                        <Link href={policyLink} key={i}>
                          <p key={i} className="text-sm text-muted-foreground truncate">
                            {item.name}
                          </p>
                        </Link>
                      )
                    })}

                    {hasMore && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusClick(key)
                        }}
                      >
                        View all ({list.length})
                      </Button>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </ul>
        </TooltipProvider>
      </div>
    </div>
  )
}
