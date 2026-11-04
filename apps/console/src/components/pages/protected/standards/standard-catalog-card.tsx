import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { CheckCircleIcon, Settings2, SettingsIcon } from 'lucide-react'
import { formatDateSince } from '@/utils/date'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { CustomFrameworkBadge } from './custom-framework/custom-framework-badge'

type TStandardCatalogCardProps = {
  shortName: string
  version?: string | null
  standardType?: string | null
  controlCount: number
  updatedAt?: string | null
  tags?: string[] | null
  description?: string | null
  isCustom: boolean
  logoSrc?: string | null
  isRecommended?: boolean
  footer?: React.ReactNode
}

export const StandardCatalogCard: React.FC<TStandardCatalogCardProps> = ({
  shortName,
  version,
  standardType,
  controlCount,
  updatedAt,
  tags,
  description,
  isCustom,
  logoSrc,
  isRecommended,
  footer,
}) => (
  <Card className="bg-card p-4 rounded-lg shadow flex flex-col h-full">
    <div className="flex flex-row justify-between gap-4 mb-3">
      <div className="flex min-w-0 flex-col">
        <div className="mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-base break-words">{shortName}</h3>
            {isCustom && <CustomFrameworkBadge />}
            {isRecommended && <Badge variant="green">Recommended</Badge>}
          </div>
          {version && <span className="text-xs">version: {version}</span>}
        </div>
        <div className="text-sm space-y-1">
          {standardType && (
            <p className="flex items-center gap-1">
              <SettingsIcon className="text-primary shrink-0" size={16} /> {standardType}
            </p>
          )}
          <p className="flex items-center gap-1">
            <Settings2 className="text-primary shrink-0" size={16} /> Controls: {controlCount}
          </p>
          {updatedAt && (
            <p className="flex items-center gap-1">
              <CheckCircleIcon className="text-primary shrink-0" size={16} /> Last updated: {formatDateSince(updatedAt)}
            </p>
          )}
        </div>
      </div>
      <StandardsIconMapper shortName={shortName} logoSrc={logoSrc} isCustom={isCustom} />
    </div>
    {!!tags?.length && (
      <div className="border-t pt-3 mb-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagChip tag={tag} key={tag} />
        ))}
      </div>
    )}
    {description && <p className="text-sm mb-4 line-clamp-4 overflow-hidden text-ellipsis flex-1">{description}</p>}
    {footer && <div className="mt-auto">{footer}</div>}
  </Card>
)
