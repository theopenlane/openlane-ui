'use client'

import * as React from 'react'
import { clsx } from 'clsx'

export const TextInput = React.forwardRef<HTMLInputElement, any>(
  (props, ref) => {
    return (
      <input
        className={clsx(
          `w-full h-10 rounded-md pl-2 ring-java-800 focus:outline-0 bg-java-50 border border-java-200`,
          props.className,
        )}
        ref={ref}
        type="text"
        required={props.required}
        {...props}
      />
    )
  },
)

TextInput.displayName = 'TextInput'

export default TextInput
