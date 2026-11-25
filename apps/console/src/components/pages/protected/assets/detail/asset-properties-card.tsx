'use client'

import React from 'react'
import { Boxes, Tags, CalendarDays, Fingerprint, Globe, Layers, Monitor, Shapes } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Link } from '@/components/shared/link/link'
import { ReadOnlyRow } from '@/components/pages/protected/exposure/detail/read-only-row'
import AssetTagsRow from './asset-tags-row'
import { type EnumCreateHandlers, type EnumOptions } from '../table/types'
import { type AssetRelationships } from '@/lib/graphql-hooks/asset-detail'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { formatDate } from '@/utils/date'
import { ASSET_ROW_LABEL_CLASS, assetRowFieldProps, type TAssetSectionProps } from './asset-field-props'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

const iconClass = 'h-4 w-4 text-muted-foreground'

type TAssetPropertiesCardProps = TAssetSectionProps & {
  enumOpts: EnumOptions
  enumCreateHandlers: EnumCreateHandlers
  relationships: AssetRelationships | undefined
}

const LinkList: React.FC<{ links: { id: string; label: string; href: string }[] }> = ({ links }) => (
  <span className="flex flex-col items-end gap-1">
    {links.map(({ id, label, href }) => (
      <Link key={id} href={href} prefetch={false}>
        {label}
      </Link>
    ))}
  </span>
)

const AssetPropertiesCard: React.FC<TAssetPropertiesCardProps> = ({ enumOpts, enumCreateHandlers, relationships, ...sectionProps }) => {
  const { asset } = sectionProps
  const fieldProps = assetRowFieldProps(sectionProps)
  const platforms = getNodes(relationships?.platforms)
  const systems = getNodes(relationships?.systemDetails)

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Properties</h3>
      <div className="flex flex-col gap-3">
        <TextField name="identifier" label="Identifier" icon={<Fingerprint className={iconClass} />} {...fieldProps} />
        <SelectField
          name="assetType"
          label="Type"
          icon={<Shapes className={iconClass} />}
          options={enumOpts.assetTypeOptions}
          useCustomDisplay={false}
          renderValue={(value) => getEnumLabel(value)}
          {...fieldProps}
        />
        <SelectField
          name="assetSubtypeName"
          label="Subtype"
          icon={<Boxes className={iconClass} />}
          options={enumOpts.assetSubtypeOptions}
          onCreateOption={enumCreateHandlers.assetSubtypeName}
          {...fieldProps}
        />
        {platforms.length > 0 && (
          <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} icon={<Layers className={iconClass} />} label="Platform">
            <LinkList links={platforms.map(({ id, name }) => ({ id, label: name, href: getHrefForObjectType('platforms', { id }) }))} />
          </ReadOnlyRow>
        )}
        {systems.length > 0 && (
          <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} icon={<Monitor className={iconClass} />} label="System">
            <LinkList links={systems.map(({ id, systemName }) => ({ id, label: systemName, href: getHrefForObjectType('systemDetails', { id }) }))} />
          </ReadOnlyRow>
        )}
        {!!asset.categories?.length && (
          <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} icon={<Tags className={iconClass} />} label="Categories">
            {asset.categories.join(', ')}
          </ReadOnlyRow>
        )}
        <TextField name="website" label="Website" type="link" icon={<Globe className={iconClass} />} {...fieldProps} />
        <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} icon={<CalendarDays className={iconClass} />} label="Created">
          {formatDate(asset.createdAt)}
        </ReadOnlyRow>
        <ReadOnlyRow labelClassName={ASSET_ROW_LABEL_CLASS} icon={<CalendarDays className={iconClass} />} label="Updated">
          {formatDate(asset.updatedAt)}
        </ReadOnlyRow>
        <AssetTagsRow {...sectionProps} />
      </div>
    </Card>
  )
}

export default AssetPropertiesCard
