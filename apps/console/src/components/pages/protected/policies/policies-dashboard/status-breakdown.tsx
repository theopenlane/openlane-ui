'use client'

import React, { useMemo } from 'react'
import { DonutChart } from '@repo/ui/donut-chart'
import { FileCheck2, FilePen, ScanEye, Stamp } from 'lucide-react'
import { wherePoliciesDashboard } from './dashboard-config'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'

export default function StatusBreakdown() {
  const { policies } = useInternalPoliciesDashboard({ where: wherePoliciesDashboard })

  const statusCounts = useMemo(() => {
    const counts: Record<InternalPolicyDocumentStatus, number> = {
      [InternalPolicyDocumentStatus.PUBLISHED]: 0,
      [InternalPolicyDocumentStatus.DRAFT]: 0,
      [InternalPolicyDocumentStatus.NEEDS_APPROVAL]: 0,
      [InternalPolicyDocumentStatus.APPROVED]: 0,
      [InternalPolicyDocumentStatus.ARCHIVED]: 0, //will be filtered
    }

    for (const p of policies) {
      if (p?.status && counts[p.status] !== undefined) {
        counts[p.status]++
      }
    }

    return counts
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

  return (
    <div className="flex flex-col">
      <h2 className="text-lg mb-7">Status Breakdown</h2>

      <div className="flex gap-5 rounded-2xl w-full lg:w-1/3">
        {/* Donut Chart */}
        <div className="flex">
          <DonutChart data={donutChartData} colors={donutChartColors} width={66} height={66} innerRadius={23} outerRadius={33} />
        </div>

        {/* Legend */}
        <ul className="space-y-4">
          {statusItems.map(({ label, key, color, icon: Icon }) => (
            <li key={label} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <Icon size={16} style={{ color }} />
                <span className="text-base font-medium">{label}</span>
              </div>
              <span className="ml-1.5 border w-7 h-7 flex items-center justify-center rounded-full text-sm">{statusCounts[key] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
