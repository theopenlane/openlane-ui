import React from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { cn } from '@repo/ui/lib/utils'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { existingOrganizationsStyles } from './existing-organizations.styles'

const PLACEHOLDER_ROW_COUNT = 2

export const ExistingOrganizationsSkeleton: React.FC = () => {
  const { container, orgWrapper, orgInfo } = existingOrganizationsStyles()

  return (
    <div className={container()} role="status" aria-live="polite" aria-label="Loading organizations">
      <Panel>
        <PanelHeader heading={<Skeleton height={20} className="w-full max-w-[220px] rounded-md" />} />
        {Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
          <div key={index} className={cn(orgWrapper(), 'cursor-default')}>
            <Skeleton height={32} width={32} className="shrink-0 rounded-full" />
            <div className={cn(orgInfo(), 'min-w-0')}>
              <Skeleton height={14} className="w-full max-w-[160px] rounded-md" />
              <Skeleton height={20} className="w-16 rounded-md" />
            </div>
            <Skeleton height={32} className="w-[72px] shrink-0 rounded-md" />
          </div>
        ))}
      </Panel>
    </div>
  )
}
