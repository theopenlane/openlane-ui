'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { CheckboxField } from '@/components/shared/crud-base/form-fields/checkbox-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { ReadOnlyRichText } from '@/components/pages/protected/exposure/detail/read-only-rich-text'
import { ReadOnlyRow } from '@/components/pages/protected/exposure/detail/read-only-row'
import DescriptionField from '../../../create/form/fields/description-field'
import { type EnumCreateHandlers, type EnumOptions } from '../../../table/types'
import { ASSET_ROW_LABEL_CLASS, assetRowFieldProps, type TAssetSectionProps } from '../../asset-field-props'
import AuditReadinessCard from './audit-readiness-card'
import { type TReadinessAction, type TReadinessCheck } from './readiness-checks'

type TAssetOverviewTabProps = TAssetSectionProps & {
  enumOpts: EnumOptions
  enumCreateHandlers: EnumCreateHandlers
  checks: TReadinessCheck[]
  isReadinessLoading: boolean
  availableActions: ReadonlySet<TReadinessAction>
  onReadinessAction: (action: TReadinessAction) => void
}

const AssetOverviewTab: React.FC<TAssetOverviewTabProps> = ({ enumOpts, enumCreateHandlers, checks, isReadinessLoading, availableActions, onReadinessAction, ...sectionProps }) => {
  const { asset, isEditing } = sectionProps
  const fieldProps = assetRowFieldProps(sectionProps)

  return (
    <div className="space-y-5">
      {isEditing ? (
        <DescriptionField key={`${asset.id}-description`} isEditing isCreate={false} initialValue={asset.description ?? ''} />
      ) : (
        <>
          <ReadOnlyRichText value={asset.description} label="Description" />
          <AuditReadinessCard checks={checks} isLoading={isReadinessLoading} availableActions={availableActions} onAction={onReadinessAction} />
        </>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-xl p-4">
          <h2 className="mb-3 text-lg font-medium">Security</h2>
          <div className="flex flex-col gap-2">
            <SelectField
              name="assetDataClassificationName"
              label="Data classification"
              options={enumOpts.assetDataClassificationOptions}
              onCreateOption={enumCreateHandlers.assetDataClassificationName}
              {...fieldProps}
            />
            <SelectField name="securityTierName" label="Security tier" options={enumOpts.securityTierOptions} onCreateOption={enumCreateHandlers.securityTierName} {...fieldProps} />
            <SelectField name="encryptionStatusName" label="Encryption status" options={enumOpts.encryptionStatusOptions} onCreateOption={enumCreateHandlers.encryptionStatusName} {...fieldProps} />
            <SelectField name="accessModelName" label="Access model" options={enumOpts.accessModelOptions} onCreateOption={enumCreateHandlers.accessModelName} {...fieldProps} />
            {isEditing ? (
              <CheckboxField name="containsPii" label="Contains PII" {...fieldProps} />
            ) : (
              <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} label="Contains PII">
                {asset.containsPii ? 'Yes' : 'No'}
              </ReadOnlyRow>
            )}
          </div>
        </Card>
        <Card className="rounded-xl p-4">
          <h2 className="mb-3 text-lg font-medium">Location and Cost</h2>
          <div className="flex flex-col gap-2">
            <TextField name="physicalLocation" label="Physical location" {...fieldProps} />
            <TextField name="region" label="Region" {...fieldProps} />
            <TextField name="estimatedMonthlyCost" label="Estimated monthly cost" type="currency" {...fieldProps} />
            <TextField name="costCenter" label="Cost center" {...fieldProps} />
            <TextField name="purchaseDate" label="Purchase date" type="date" {...fieldProps} />
            <TextField name="cpe" label="CPE" {...fieldProps} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AssetOverviewTab
