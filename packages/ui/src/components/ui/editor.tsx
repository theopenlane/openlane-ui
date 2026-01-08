'use client'

import * as React from 'react'

import type { VariantProps } from 'class-variance-authority'
import type { PlateContentProps, PlateViewProps } from 'platejs/react'

import { cva } from 'class-variance-authority'
import { PlateContainer, PlateContent, PlateView } from 'platejs/react'

import { cn } from '@repo/ui/lib/utils'

const editorContainerVariants = cva(
  'w-full cursor-text overflow-hidden caret-primary select-text bg-input selection:bg-brand/25 ' +
    'focus-visible:outline-hidden [&_.slate-selection-area]:z-50 ' +
    '[&_.slate-selection-area]:border [&_.slate-selection-area]:border/25 [&_.slate-selection-area]:bg-brand/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        comment: cn(
          'flex flex-wrap justify-between gap-1 px-1 py-0.5 text-sm',
          'rounded-md border-[1.5px] border-transparent bg-transparent',
          'has-aria-disabled:border-input has-aria-disabled:bg-muted',
        ),
        readonly: 'bg-unset!',
        default: 'min-h-[300px] h-auto border',
        demo: 'h-[650px]',
        select: cn(
          'group rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'has-data-readonly:w-fit has-data-readonly:cursor-default has-data-readonly:border-transparent has-data-readonly:focus-within:[box-shadow:none]',
        ),
      },
    },
  },
)

export type TPlateEditorStyleVariant = 'default' | 'comment' | 'select' | 'demo' | null | undefined

export function EditorContainer({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof editorContainerVariants>) {
  return <PlateContainer className={cn('ignore-click-outside/toolbar', editorContainerVariants({ variant }), className)} {...props} />
}

const editorVariants = cva(
  cn(
    'group/editor',
    'w-full cursor-text overflow-x-hidden break-words whitespace-pre-wrap select-text',
    'rounded-md ring-offset-background focus-visible:outline-hidden',
    'placeholder:text-muted-foreground/80 **:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
    '[&_strong]:font-bold',
    '[&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:overflow-wrap-break-word [&_pre]:overflow-x-auto',
    '[&_code]:break-words [&_code]:whitespace-pre-wrap [&_code]:overflow-x-auto',
    '[&_table]:table-fixed [&_td]:break-words [&_td]:whitespace-pre-wrap',
  ),
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-50',
      },
      focused: {
        true: 'ring-2 ring-ring ring-offset-2',
      },
      variant: {
        ai: 'w-full px-0 text-base md:text-sm',
        aiChat: 'max-h-[min(70vh,320px)] w-full max-w-[700px] overflow-y-auto px-3 py-2 text-base md:text-sm',
        comment: cn('rounded-none border-none bg-transparent text-sm'),
        default: 'size-full px-10 pt-0 text-base',
        readonly: 'size-full pl-0 pr-10 pt-0 text-base',
        demo: 'size-full px-5 pt-0 text-base',
        fullWidth: 'size-full px-5 pt-0 text-base sm:px-24',
        none: '',
        select: 'px-3 py-2 text-base data-readonly:w-fit',
      },
    },
  },
)

export type EditorProps = PlateContentProps & VariantProps<typeof editorVariants>

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(({ className, disabled, focused, variant, ...props }, ref) => {
  return (
    <PlateContent
      ref={ref}
      className={cn(
        editorVariants({
          disabled,
          focused,
          variant,
        }),
        className,
      )}
      disabled={disabled}
      disableDefaultStyles
      {...props}
    />
  )
})

Editor.displayName = 'Editor'

export function EditorView({ className, variant, ...props }: PlateViewProps & VariantProps<typeof editorVariants>) {
  return <PlateView {...props} className={cn(editorVariants({ variant }), className)} />
}

EditorView.displayName = 'EditorView'
