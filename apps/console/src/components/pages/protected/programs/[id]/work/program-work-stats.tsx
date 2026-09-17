'use client'

import React from 'react'
import { LayoutList } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { WORK_OBJECT_TYPE_ICON, WORK_OBJECT_TYPE_ICON_CLASS, WORK_OBJECT_TYPE_PLURAL_LABEL, type WorkObjectType } from './work-item'

type TProgramWorkStatsProps = {
  countsByType: Record<WorkObjectType, number>
  totalCount: number
  objectTypes: readonly WorkObjectType[]
  isLoading: boolean
}

type TStatCardProps = {
  label: string
  count: number
  icon: React.ReactNode
  isLoading: boolean
}

const StatCard = ({ label, count, icon, isLoading }: TStatCardProps) => (
  <Card className="flex-1 min-w-[150px] max-w-[260px]">
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-homepage-card-item border-switch-bg-inactive">{icon}</div>
      <div className="min-w-0">
        {isLoading ? <Skeleton className="h-7 w-10 rounded" /> : <p className="text-2xl font-semibold leading-tight">{count}</p>}
        <p className="text-sm text-muted-foreground truncate">{label}</p>
      </div>
    </CardContent>
  </Card>
)

const ProgramWorkStats = ({ countsByType, totalCount, objectTypes, isLoading }: TProgramWorkStatsProps) => (
  <div className="flex flex-wrap gap-4">
    <StatCard label="Total" count={totalCount} isLoading={isLoading} icon={<LayoutList size={20} className="text-muted-foreground" />} />
    {objectTypes.map((objectType) => {
      const Icon = WORK_OBJECT_TYPE_ICON[objectType]

      return (
        <StatCard
          key={objectType}
          label={WORK_OBJECT_TYPE_PLURAL_LABEL[objectType]}
          count={countsByType[objectType]}
          isLoading={isLoading}
          icon={<Icon size={20} className={cn(WORK_OBJECT_TYPE_ICON_CLASS[objectType])} />}
        />
      )
    })}
  </div>
)

export default ProgramWorkStats
