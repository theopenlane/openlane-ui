import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { HtmlOrText } from '@/components/shared/sanitized-html/sanitized-html'
import { type AssetSystemNode } from '@/lib/graphql-hooks/asset-detail'
import { formatDate } from '@/utils/date'
import { DetailRow } from '../../detail-row'
import { OpenObjectButton } from '../../open-object-button'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'

const SystemDetailsCard: React.FC<{ system: AssetSystemNode }> = ({ system }) => (
  <Card className="rounded-xl p-4">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-medium">System Details</h2>
        <p className="text-sm break-words text-muted-foreground">{system.systemName}</p>
      </div>
      <OpenObjectButton id={system.id} kind={ObjectAssociationNodeEnum.SYSTEM_DETAIL} label="Open system" />
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
