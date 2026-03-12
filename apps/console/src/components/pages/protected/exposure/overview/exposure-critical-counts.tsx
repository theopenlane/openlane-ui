'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { AlertTriangle, Bug, FileSearch } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useRouter } from 'next/navigation'
import { saveFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage'

type Counts = {
  vulns: { critical: number; high: number }
  findings: { critical: number; high: number }
  risks: { critical: number; high: number }
}

type Props = {
  counts: Counts
  isLoading?: boolean
}

const TYPES = [
  {
    key: 'vulns' as const,
    label: 'Vulnerabilities',
    icon: Bug,
    href: '/exposure/vulnerabilities',
    tableKey: 'vulnerability',
    critFilter: { severityContainsFold: 'critical' } as TFilterState,
    highFilter: { severityContainsFold: 'high' } as TFilterState,
  },
  {
    key: 'findings' as const,
    label: 'Findings',
    icon: FileSearch,
    href: '/exposure/findings',
    tableKey: 'finding',
    critFilter: { severityContainsFold: 'critical' } as TFilterState,
    highFilter: { severityContainsFold: 'high' } as TFilterState,
  },
  {
    key: 'risks' as const,
    label: 'Risks',
    icon: AlertTriangle,
    href: '/exposure/risks',
    tableKey: 'risk',
    critFilter: { impactIn: ['CRITICAL'] } as TFilterState,
    highFilter: { impactIn: ['HIGH'] } as TFilterState,
  },
]

const ExposureCriticalCounts = ({ counts, isLoading }: Props) => {
  const router = useRouter()

  const handleClick = (tableKey: string, href: string, filter: TFilterState) => {
    saveFilters(tableKey, filter)
    router.push(href)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xl font-medium leading-7 mb-4">Critical Exposure</p>
        <div className="grid grid-cols-3 gap-4">
          {TYPES.map(({ key, label, icon: Icon, href, tableKey, critFilter, highFilter }) => {
            const data = counts[key]
            return (
              <div key={key} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton height={32} />
                    <Skeleton height={32} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      className="flex items-center justify-between w-full rounded-md px-2 py-1 -mx-2 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => handleClick(tableKey, href, critFilter)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-sm text-muted-foreground">Critical</span>
                      </div>
                      <span className="text-2xl font-bold text-destructive">{data.critical}</span>
                    </button>
                    <button
                      className="flex items-center justify-between w-full rounded-md px-2 py-1 -mx-2 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => handleClick(tableKey, href, highFilter)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm text-muted-foreground">High</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-500">{data.high}</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default ExposureCriticalCounts
