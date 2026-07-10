'use client'

import React from 'react'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'

type VersionReadonlyProps = {
  value?: Value | null
  detailsHtml?: string | null
  cacheKey?: string
}

const VersionReadonly: React.FC<VersionReadonlyProps> = ({ value, detailsHtml, cacheKey }) => {
  const initialValue = value && value.length > 0 ? value : (detailsHtml ?? undefined)

  return <PlateEditor key={cacheKey} initialValue={initialValue} readonly variant="readonly" toolbarClassName="hidden" />
}

export default React.memo(VersionReadonly)
