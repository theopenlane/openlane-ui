'use client'

import React, { useMemo } from 'react'
import ProgressBar from './progress-bar'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { InternalPolicyDocumentStatus } from '@repo/codegen/src/schema'

export default function CoverageByType() {
  const { policies } = useInternalPoliciesDashboard({ where: wherePoliciesDashboard })

  const groupedData = useMemo(() => {
    if (!policies?.length) return []

    const groups: Record<string, { total: number; published: number }> = {}

    for (const policy of policies) {
      const type = policy.policyType || 'Unknown'
      if (!groups[type]) {
        groups[type] = { total: 0, published: 0 }
      }
      groups[type].total++
      if (policy.status === InternalPolicyDocumentStatus.PUBLISHED) {
        groups[type].published++
      }
    }

    return Object.entries(groups)
      .map(([type, { total, published }]) => ({
        label: type,
        percentage: Math.round((published / total) * 100),
        ratio: `${published}/${total}`,
      }))
      .sort((a, b) => (a.label === 'Unknown' ? 1 : b.label === 'Unknown' ? -1 : a.label.localeCompare(b.label)))
  }, [policies])

  const renderRow = ({ label, percentage, ratio }: { label: string; percentage: number; ratio: string }) => (
    <div key={label} className="flex items-center gap-3 w-full md:w-[calc(50%-1rem)]">
      <span className="w-24 text-sm truncate">{label}</span>
      <ProgressBar percentage={percentage} />
      <span className="text-sm text-text-informational w-12 text-right">{ratio}</span>
    </div>
  )

  return (
    <div className="rounded-2xl py-6">
      <h2 className="text-lg font-medium mb-6">Coverage by Type</h2>

      {groupedData.length === 0 ? <p className="text-sm text-text-informational">No data available</p> : <div className="flex flex-wrap gap-8">{groupedData.map(renderRow)}</div>}
    </div>
  )
}
