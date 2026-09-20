'use client'

import React from 'react'
import { LayoutList } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { cn } from '@repo/ui/lib/utils'
import { activatable } from '@repo/ui/lib/a11y'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { workObjectTypePluralLabel, type TWorkObjectType } from './work-item'

type TProgramWorkStatsProps = {
  countsByType: Record<TWorkObjectType, number>
  totalCount: number
  objectTypes: readonly TWorkObjectType[]
  selectedObjectTypes: TWorkObjectType[]
  onSelectObjectType: (objectType: TWorkObjectType | null) => void
  isLoading: boolean
}

type TStatCardProps = {
  label: string
  count: number
  icon: React.ReactNode
  isLoading: boolean
  isActive: boolean
  onSelect: () => void
}

const StatCard = ({ label, count, icon, isLoading, isActive, onSelect }: TStatCardProps) => (
  <Card className={cn('flex-1 min-w-[150px] max-w-[260px] cursor-pointer transition-colors hover:border-primary', isActive && 'border-primary ring-1 ring-primary')} {...activatable(onSelect)}>
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-homepage-card-item border-switch-bg-inactive">{icon}</div>
      <div className="min-w-0">
        {isLoading ? <Skeleton className="h-7 w-10 rounded" /> : <p className="text-2xl font-semibold leading-tight">{count}</p>}
        <p className="text-sm text-muted-foreground truncate">{label}</p>
      </div>
    </CardContent>
  </Card>
)

const ProgramWorkStats = ({ countsByType, totalCount, objectTypes, selectedObjectTypes, onSelectObjectType, isLoading }: TProgramWorkStatsProps) => (
  <div className="flex flex-wrap gap-4">
    <StatCard
      label="Total"
      count={totalCount}
      isLoading={isLoading}
      icon={<LayoutList size={20} className="text-muted-foreground" />}
      isActive={selectedObjectTypes.length === 0}
      onSelect={() => onSelectObjectType(null)}
    />
    {objectTypes.map((objectType) => {
      const { icon: Icon, color } = ObjectAssociationMap[objectType]

      return (
        <StatCard
          key={objectType}
          label={workObjectTypePluralLabel(objectType)}
          count={countsByType[objectType]}
          isLoading={isLoading}
          icon={<Icon size={20} style={{ color: `var(${color})` }} />}
          isActive={selectedObjectTypes.includes(objectType)}
          onSelect={() => onSelectObjectType(objectType)}
        />
      )
    })}
  </div>
)

export default ProgramWorkStats
