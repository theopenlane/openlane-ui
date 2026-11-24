'use client'

import React from 'react'
import { CalendarClock, Layers, Plug, ScanLine } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Link } from '@/components/shared/link/link'
import { ReadOnlyRow } from '@/components/pages/protected/exposure/detail/read-only-row'
import { type AssetRelationships } from '@/lib/graphql-hooks/asset-detail'
import { integrationDefinitionHref } from '@/lib/integrations/run-health'
import { useSourceIntegrationProvider } from '@/lib/query-hooks/integrations'
import { formatDateTime } from '@/utils/date'
import { type EnumOptions } from '../table/types'
import { assetRowFieldProps, type TAssetSectionProps } from './asset-field-props'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

const iconClass = 'h-4 w-4 text-muted-foreground'

type TAssetSourceCardProps = TAssetSectionProps & {
  enumOpts: EnumOptions
  relationships: AssetRelationships | undefined
}

const AssetSourceCard: React.FC<TAssetSourceCardProps> = ({ enumOpts, relationships, ...sectionProps }) => {
  const { asset, isEditing, canEdit, internalEditing } = sectionProps
  const provider = useSourceIntegrationProvider(asset.sourceDefinitionID)
  const fieldProps = assetRowFieldProps(sectionProps)
  const sourcePlatform = relationships?.sourcePlatform
  const sourceIdentifier = asset.sourceIdentifier?.trim()
  const isEditingIdentifier = isEditing || internalEditing === 'sourceIdentifier'

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Source</h3>
      <div className="flex flex-col gap-3">
        <SelectField
          name="sourceType"
          label="Source type"
          icon={<ScanLine className={iconClass} />}
          options={enumOpts.assetSourceTypeOptions}
          useCustomDisplay={false}
          renderValue={(value) => getEnumLabel(value)}
          {...fieldProps}
        />
        {sourcePlatform && (
          <ReadOnlyRow icon={<Layers className={iconClass} />} label="Source platform">
            <Link href={getHrefForObjectType('platforms', { id: sourcePlatform.id })} prefetch={false}>
              {sourcePlatform.name}
            </Link>
          </ReadOnlyRow>
        )}
        {provider && (
          <ReadOnlyRow icon={<Plug className={iconClass} />} label="Integration">
            <Link href={integrationDefinitionHref(provider.id)} prefetch={false}>
              {provider.displayName}
            </Link>
          </ReadOnlyRow>
        )}
        {asset.observedAt && (
          <ReadOnlyRow icon={<CalendarClock className={iconClass} />} label="Last observed">
            {formatDateTime(asset.observedAt)}
          </ReadOnlyRow>
        )}
        {(isEditingIdentifier || !sourceIdentifier) && canEdit ? (
          <TextField name="sourceIdentifier" label="Source identifier" {...fieldProps} layout="vertical" />
        ) : (
          sourceIdentifier && (
            <div className="space-y-1">
              <span className="text-base text-muted-foreground">Source identifier</span>
              <CopyableText value={sourceIdentifier} variant="inline" className="max-w-full font-mono text-xs" aria-label="Copy source identifier" />
            </div>
          )
        )}
      </div>
    </Card>
  )
}

export default AssetSourceCard
