'use client'

import React, { useMemo } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'

export const ReadOnlyRichText: React.FC<{ value: string | null | undefined; label: string }> = ({ value, label }) => {
  const { convertToReadOnly } = usePlateEditor()
  const content = useMemo(() => (value && !isPlateValueEmpty(value) ? convertToReadOnly(value) : null), [convertToReadOnly, value])

  if (!content) return null

  return (
    <section aria-label={label} className="min-w-0 whitespace-pre-wrap break-words">
      {content}
    </section>
  )
}
