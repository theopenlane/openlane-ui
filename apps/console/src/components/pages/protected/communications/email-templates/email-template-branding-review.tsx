'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Checkbox } from '@repo/ui/checkbox'
import { ImageOff } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import type { TEmailBrandingReview, TEmailBrandingSuggestion } from './email-template-branding'

interface EmailTemplateBrandingReviewProps {
  review: TEmailBrandingReview
  onToggle: (field: string, selected: boolean) => void
}

const SuggestionPreview = ({ suggestion }: { suggestion: TEmailBrandingSuggestion }) => {
  const [imageFailed, setImageFailed] = useState(false)

  if (suggestion.kind === 'color') {
    return <span className="size-6 shrink-0 rounded-md border border-border" style={{ backgroundColor: suggestion.value }} aria-hidden />
  }

  return (
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white" aria-hidden>
      {imageFailed ? (
        <ImageOff size={14} className="text-muted-foreground" />
      ) : (
        <Image src={suggestion.value} alt="" width={24} height={24} unoptimized className="h-full w-full object-contain" onError={() => setImageFailed(true)} />
      )}
    </span>
  )
}

export const EmailTemplateBrandingReview: React.FC<EmailTemplateBrandingReviewProps> = ({ review, onToggle }) => {
  if (review.suggestions.length === 0) {
    return <Callout variant="warning">We found branding on {review.domain}, but none of it maps to a field in this template.</Callout>
  }

  return (
    <div className="flex flex-col gap-3">
      {review.isDarkPalette && (
        <Callout variant="info" compact>
          {review.domain} uses a dark theme. Background and text colors are not selected by default, because many email clients render dark emails poorly.
        </Callout>
      )}
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {review.suggestions.map((suggestion) => {
          const checkboxId = `email-branding-${suggestion.field}`
          return (
            <li key={suggestion.field} className="flex items-center gap-3 px-3 py-2">
              <Checkbox id={checkboxId} checked={suggestion.selected} onCheckedChange={(checked) => onToggle(suggestion.field, checked === true)} />
              <SuggestionPreview suggestion={suggestion} />
              <label htmlFor={checkboxId} className="flex min-w-0 flex-1 cursor-pointer flex-col">
                <span className="text-sm font-medium">{suggestion.label}</span>
                <span className="break-words text-xs text-muted-foreground">
                  {suggestion.source}
                  {suggestion.kind === 'color' && ` · ${suggestion.value}`}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
