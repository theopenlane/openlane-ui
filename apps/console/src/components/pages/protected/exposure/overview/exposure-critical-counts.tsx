'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { AlertTriangle, Bug, FileSearch } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'

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
  { key: 'vulns', label: 'Vulnerabilities', icon: Bug, href: '/exposure/vulnerabilities' },
  { key: 'findings', label: 'Findings', icon: FileSearch, href: '/exposure/findings' },
  { key: 'risks', label: 'Risks', icon: AlertTriangle, href: '/exposure/risks' },
] as const

const ExposureCriticalCounts = ({ counts, isLoading }: Props) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xl font-medium leading-7 mb-4">Critical Exposure</p>
        <div className="grid grid-cols-3 gap-4">
          {TYPES.map(({ key, label, icon: Icon }) => {
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-sm text-muted-foreground">Critical</span>
                      </div>
                      <span className="text-2xl font-bold text-destructive">{data.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-sm text-muted-foreground">High</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-500">{data.high}</span>
                    </div>
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
