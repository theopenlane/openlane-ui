import React from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonStyles } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Card } from '@repo/ui/cardpanel'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { HtmlOrText } from '@/components/shared/sanitized-html/sanitized-html'
import { type AssetSystemNode } from '@/lib/graphql-hooks/asset-detail'
import { formatDate } from '@/utils/date'
import { DetailRow } from '../../detail-row'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

const SystemDetailsCard: React.FC<{ system: AssetSystemNode }> = ({ system }) => (
  <Card className="rounded-xl p-4">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-medium">System Details</h2>
        <p className="text-sm break-words text-muted-foreground">{system.systemName}</p>
      </div>
      <NextLink href={getHrefForObjectType('systemDetails', { id: system.id })} prefetch={false} className={cn(buttonStyles({ variant: 'secondary' }).base(), 'shrink-0')}>
        Open system
        <ArrowRight size={16} aria-hidden />
      </NextLink>
    </div>
    <dl>
      <DetailRow label="Version" value={system.version} />
      <DetailRow label="Sensitivity level" value={system.sensitivityLevel ? getEnumLabel(system.sensitivityLevel) : null} />
      <DetailRow label="Last reviewed" value={system.lastReviewed ? formatDate(system.lastReviewed) : null} />
      <DetailRow label="Authorization boundary" value={system.authorizationBoundary?.trim() ? <HtmlOrText value={system.authorizationBoundary} /> : null} />
    </dl>
  </Card>
)

export default SystemDetailsCard
