'use client'

import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { StandardCatalogCard } from '../standard-catalog-card'
import { type TCreateFrameworkFormData } from './hooks/use-custom-framework-form-schema'

export const CatalogPreview: React.FC<{ logoSrc: string | null }> = ({ logoSrc }) => {
  const { control } = useFormContext<TCreateFrameworkFormData>()
  const [shortName, version, standardType, tags, description] = useWatch({ control, name: ['shortName', 'version', 'standardType', 'tags', 'description'] })

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Catalog preview</p>
      <StandardCatalogCard shortName={shortName || 'Short name'} version={version} standardType={standardType} controlCount={0} tags={tags} description={description} logoSrc={logoSrc} isCustom />
      <p className="text-xs text-muted-foreground">Updates as you type. The badge is generated from the short name until you upload an icon in the next step.</p>
    </div>
  )
}
