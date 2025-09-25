import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

const textareaStyles = cn(
  'flex min-h-[80px] w-full rounded-md border border-border-light dark:border-border-dark bg-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden  disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
)

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => {
  return <textarea className={cn(textareaStyles, className)} ref={ref} {...props} />
})

Textarea.displayName = 'Textarea'

type EditableTextareaProps = React.ComponentProps<'textarea'>

const EditableTextarea = React.forwardRef<HTMLTextAreaElement, EditableTextareaProps>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [editing, setEditing] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (editing && textareaRef?.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  if (editing) {
    return <textarea onBlur={() => setEditing(false)} className={cn(textareaStyles, className)} ref={textareaRef} {...props} />
  }

  return (
    <p onClick={() => setEditing(true)} className={` hover:cursor-pointer whitespace-pre-line ${!props.value && '!text-neutral-400'}`}>
      {props.value || props.placeholder}
    </p>
  )
})

EditableTextarea.displayName = 'EditableTextarea'

export { Textarea, EditableTextarea }
