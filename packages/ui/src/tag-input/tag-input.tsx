'use client'

import { forwardRef } from 'react'
import { TagInput as EmblorTagInput, type TagInputProps } from 'emblor'
import { tagInputStyles } from './tag-input.styles'

const TagInput = forwardRef<HTMLDivElement, TagInputProps>(
  ({ className, ...props }, ref) => {
    const { input, tag, tagClose, inlineTagsContainer } = tagInputStyles()
    return (
      <EmblorTagInput
        {...props}
        delimiterList={[' ', ',', 'Enter']}
        inputRef={ref}
        styleClasses={{
          tag: {
            body: tag(),
            closeButton: tagClose(),
          },
          input: input(),
          inlineTagsContainer: inlineTagsContainer(),
        }}
      />
    )
  },
)

TagInput.displayName = 'TagInput'

export { TagInput }
