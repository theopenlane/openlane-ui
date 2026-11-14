'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { pluralizeWithCount } from '@/utils/strings'
import { OverviewSection } from '../../../exposure/detail/overview-section'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { CardSectionHeader, TargetDetailsSection } from '../../target-details/target-details'
import { isPopulatedObject } from '@/utils/type-guards'

type TFindingTargetsCardProps = Pick<FindingDetailNode, 'targets' | 'targetDetails'>

export const FindingTargetsCard: React.FC<TFindingTargetsCardProps> = ({ targets, targetDetails }) => {
  const uniqueTargets = [...new Set(targets?.map((target) => target.trim()).filter(Boolean) ?? [])]
  const details = isPopulatedObject(targetDetails) ? targetDetails : null

  if (uniqueTargets.length === 0 && !details) return null

  return (
    <OverviewSection title="Targets">
      <Card>
        <CardContent className="space-y-6">
          {uniqueTargets.length > 0 && (
            <div className="space-y-4">
              <CardSectionHeader title="Targets" description="Resources identified by the source" action={<Badge variant="secondary">{pluralizeWithCount(uniqueTargets.length, 'target')}</Badge>} />
              <ul className="space-y-2">
                {uniqueTargets.map((target) => (
                  <li key={target}>
                    <CopyableText value={target} variant="row" aria-label={`Copy target ${target}`} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {uniqueTargets.length > 0 && details && <Separator />}
          {details && <TargetDetailsSection value={details} />}
        </CardContent>
      </Card>
    </OverviewSection>
  )
}
