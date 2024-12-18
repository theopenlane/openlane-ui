'use client'

import * as React from 'react'
import { clsx } from 'clsx'

export const TextInput = React.forwardRef<HTMLInputElement, any>(
  (props, ref) => {
    return (
      <input
        className={clsx(
          `w-full h-10 rounded-md pl-2 ring-teal-800 focus:outline-0 bg-teal50 border border-teal200`,
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
