'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { deleteMenuAction, mergeMenuAction } from '@/components/shared/crud-base/slideout-header'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { AssetTypeIcon } from '@/components/shared/enum-mapper/asset-enum'
import { MergeRecordsSheet } from '@/components/shared/merge-records/merge-records-sheet'
import { assetMergeConfig } from '@/components/shared/merge-records/configs/asset-merge-config'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { getAssetKindLabel, getAssetTitle } from '../asset-display'
import { ASSET_INTERNAL_OWNER } from '../hooks/asset-update-fields'
import { type EnumCreateHandlers, type EnumOptions } from '../table/types'
import { assetFieldProps, type TAssetSectionProps } from './asset-field-props'

type TAssetDetailHeaderProps = TAssetSectionProps & {
  enumOpts: EnumOptions
  enumCreateHandlers: EnumCreateHandlers
  isSaving: boolean
  canDelete: boolean
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (event: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  onAskAI: () => void
}

const META_LABEL_CLASS = 'text-xs text-muted-foreground'

const AssetDetailHeader: React.FC<TAssetDetailHeaderProps> = ({ enumOpts, enumCreateHandlers, isSaving, canDelete, onEdit, onCancel, onDeleteClick, onAskAI, ...sectionProps }) => {
  const { asset, isEditing, canEdit } = sectionProps
  const [isMergeOpen, setIsMergeOpen] = useState(false)
  const title = getAssetTitle(asset)
  const kindLabel = getAssetKindLabel(asset)
  const fieldProps = { ...assetFieldProps(sectionProps), labelClassName: META_LABEL_CLASS }
  const color = `var(${ObjectAssociationMap.assets.color})`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-48 flex-1 items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
            style={{ color, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
          >
            <AssetTypeIcon assetType={asset.assetType} size={20} />
          </span>
          {isEditing ? (
            <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
              <TextField name="displayName" label="Display Name" {...fieldProps} />
              <TextField name="name" label="Name" required {...fieldProps} />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col items-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold break-words">{title}</h1>
                {kindLabel && <Badge variant="outline">{kindLabel}</Badge>}
              </div>
              {asset.name !== title && <CopyableText value={asset.name} variant="inline" className="max-w-full font-mono text-xs text-muted-foreground" aria-label="Copy asset name" />}
            </div>
          )}
        </div>
        <DetailHeaderActions
          isEditing={isEditing}
          isSaving={isSaving}
          onCancel={onCancel}
          onEdit={canEdit ? onEdit : undefined}
          editLabel="Edit asset"
          onAskAI={onAskAI}
          menuAnchor={elementAnchor('asset-actions-menu')}
          menuActions={[canEdit && mergeMenuAction(() => setIsMergeOpen(true)), canDelete && { ...deleteMenuAction(onDeleteClick), anchor: elementAnchor('asset-delete-button') }]}
        />
      </div>

      <div className={isEditing ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'flex flex-wrap gap-x-10 gap-y-3'}>
        <SelectField name="environmentName" label="Environment" options={enumOpts.environmentOptions} onCreateOption={enumCreateHandlers.environmentName} {...fieldProps} />
        <SelectField name="scopeName" label="Scope" options={enumOpts.scopeOptions} onCreateOption={enumCreateHandlers.scopeName} {...fieldProps} />
        <SelectField name="criticalityName" label="Criticality" options={enumOpts.criticalityOptions} onCreateOption={enumCreateHandlers.criticalityName} {...fieldProps} />
        <ResponsibilityField name="internalOwner" fieldBaseName={ASSET_INTERNAL_OWNER.fieldBaseName} label="Owner" {...fieldProps} handleUpdate={(input) => sectionProps.handleUpdate(input)} />
      </div>

      {canEdit && <MergeRecordsSheet open={isMergeOpen} onOpenChange={setIsMergeOpen} config={assetMergeConfig} primaryId={asset.id} />}
    </div>
  )
}

export default AssetDetailHeader
