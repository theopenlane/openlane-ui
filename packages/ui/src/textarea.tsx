import * as React from 'react'

import { cn } from '@repo/ui/lib/utils'
import { on } from 'events'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

type EditableTextareaProps = React.ComponentProps<'textarea'>

const EditableTextarea = React.forwardRef<HTMLTextAreaElement, EditableTextareaProps>(
  ({ className, ...props }, ref) => {
    const textarea = React.useRef()
    const [editing, setEditing] = React.useState<boolean>(false)

    if (editing) {
      return (
        <textarea
          onBlur={(e) => {
            setEditing(false)
          }}
          className={cn(
            'flex min-h-[80px] w-full focus:rounded-md border border-oxford-blue-200 bg-white dark:bg-glaucous-900 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <p
        onClick={(e) => {
          setEditing(true)
        }}
        className={`hover:background hover:cursor-pointer whitespace-pre-line ${!props.value && '!text-neutral-400'}`}
      >
        {props.value || props.placeholder}
      </p>
    )
  },
)
EditableTextarea.displayName = 'EditableTextarea'

export { Textarea, EditableTextarea }
