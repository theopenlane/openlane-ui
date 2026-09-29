'use client'

import React from 'react'
import { LayoutList } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { SystemTooltip } from '@repo/ui/system-tooltip'
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
  tooltip?: string
}

const StatCard = ({ label, count, icon, isLoading, isActive, onSelect, tooltip }: TStatCardProps) => {
  const card = (
    <div className="flex-1 min-w-[150px] max-w-[260px] rounded-lg" {...activatable(onSelect)}>
      <Card className={cn('h-full cursor-pointer transition-colors hover:border-primary', isActive && 'border-primary ring-1 ring-primary')}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-homepage-card-item border-switch-bg-inactive">{icon}</div>
          <div className="min-w-0">
            {isLoading ? <Skeleton className="my-[3px] h-6 w-12 rounded-full" /> : <p className="text-2xl font-semibold leading-tight">{count}</p>}
            <p className="text-sm text-muted-foreground truncate">{label}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return tooltip ? <SystemTooltip icon={card} content={tooltip} /> : card
}

const ProgramWorkStats = ({ countsByType, totalCount, objectTypes, selectedObjectTypes, onSelectObjectType, isLoading }: TProgramWorkStatsProps) => (
  <div className="flex flex-wrap gap-4">
    <StatCard
      label="Total"
      count={totalCount}
      isLoading={isLoading}
      icon={<LayoutList size={20} className="text-muted-foreground" />}
      isActive={selectedObjectTypes.length === 0}
      onSelect={() => onSelectObjectType(null)}
      tooltip="Counts reflect the selected status"
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
