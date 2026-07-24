'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Bug, ListChecks, Laptop, Building2, FileSearch, Settings2 } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useGetScanAssociations } from '@/lib/graphql-hooks/scan'

type Props = {
  scanId: string
}

const LINKED_TYPES = [
  { key: 'vulnerabilities' as const, label: 'Vulnerabilities', icon: Bug, href: '/exposure/vulnerabilities' },
  { key: 'findings' as const, label: 'Findings', icon: FileSearch, href: '/exposure/findings' },
  { key: 'tasks' as const, label: 'Tasks', icon: ListChecks, href: '/automation/tasks' },
  { key: 'assets' as const, label: 'Assets', icon: Laptop, href: '/registry/assets' },
  { key: 'entities' as const, label: 'Vendors', icon: Building2, href: '/registry/vendors' },
  { key: 'controls' as const, label: 'Controls', icon: Settings2, href: '/controls?tab=table' },
]

const LinkedObjectsSection: React.FC<Props> = ({ scanId }) => {
  const router = useRouter()
  const { data, isLoading } = useGetScanAssociations(scanId)

  const counts = {
    vulnerabilities: data?.scan?.vulnerabilities?.totalCount ?? 0,
    findings: data?.scan?.findings?.totalCount ?? 0,
    tasks: data?.scan?.tasks?.totalCount ?? 0,
    assets: data?.scan?.assets?.totalCount ?? 0,
    entities: data?.scan?.entities?.totalCount ?? 0,
    controls: data?.scan?.controls?.totalCount ?? 0,
  }

  const visibleTypes = LINKED_TYPES.filter(({ key }) => counts[key] > 0)

  if (!isLoading && visibleTypes.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-lg font-medium leading-7">Linked Objects</p>
        <p className="text-sm text-muted-foreground mb-4">Objects created or discovered by this scan</p>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {LINKED_TYPES.map(({ key }) => (
              <Skeleton key={key} height={56} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {visibleTypes.map(({ key, label, icon: Icon, href }) => (
              <button
                key={key}
                type="button"
                onClick={() => router.push(`${href}${href.includes('?') ? '&' : '?'}scanId=${scanId}`)}
                className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{label}</span>
                </div>
                <span className="text-lg font-bold shrink-0">{counts[key]}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LinkedObjectsSection
