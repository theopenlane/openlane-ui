'use client'

import React, { useMemo } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

export const ReadOnlyRichText: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const { convertToReadOnly } = usePlateEditor()
  const content = useMemo(() => convertToReadOnly(value), [convertToReadOnly, value])

  return (
    <section aria-label={label} className="min-w-0 whitespace-pre-wrap break-words">
      {content}
    </section>
  )
}
