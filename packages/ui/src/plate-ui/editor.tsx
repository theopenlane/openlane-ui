'use client';

import React from 'react';

import type { PlateContentProps } from '@udecode/plate-common/react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@udecode/cn';
import { PlateContent } from '@udecode/plate-common/react';
import { cva } from 'class-variance-authority';

const editorContainerVariants = cva(
  'relative flex cursor-text [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'w-full bg-oxford-blue-900 dark:bg-oxford-blue-950',
        demo: 'h-[650px] w-full overflow-y-auto',
      },
    },
  }
);

export const EditorContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> &
    VariantProps<typeof editorContainerVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'ignore-click-outside/toolbar',
        editorContainerVariants({ variant }),
        className
      )}
      role='button'
      {...props}
    />
  );
});

EditorContainer.displayName = 'EditorContainer';

const editorVariants = cva(
  cn(
    'group/editor',
    'relative w-full whitespace-pre-wrap break-words',
    'rounded-md ring-offset-white placeholder:text-oxford-blue-500/80 focus-visible:outline-none dark:ring-offset-oxford-blue-950 dark:placeholder:text-oxford-blue-400/80',
    '[&_[data-slate-placeholder]]:text-oxford-blue-500/80 [&_[data-slate-placeholder]]:!opacity-100 dark:[&_[data-slate-placeholder]]:text-oxford-blue-400/80',
    '[&_[data-slate-placeholder]]:top-[auto_!important]',
    '[&_strong]:font-bold',
    'bg-white dark:bg-oxford-blue-950',
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
        true: 'ring-2 ring-oxford-blue-950 ring-offset-2 dark:ring-oxford-blue-300',
      },
      variant: {
        ai: 'w-full px-0 text-sm',
        aiChat:
          'max-h-[min(70vh,320px)] w-full max-w-[700px] overflow-y-auto px-3 py-2 text-sm',
        default:
          'min-h-full w-full px-16 pb-72 pt-4 text-base sm:px-[max(64px,calc(50%-350px))]',
        demo: 'min-h-full w-full px-16 pb-72 pt-4 text-base sm:px-[max(64px,calc(50%-350px))]',
        fullWidth: 'min-h-full w-full px-16 pb-72 pt-4 text-base sm:px-24',
      },
    },
  }
);

export type EditorProps = PlateContentProps &
  VariantProps<typeof editorVariants>;

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  ({ className, disabled, focused, variant, ...props }, ref) => {
    return (
      <PlateContent
        ref={ref}
        className={cn(
          editorVariants({
            disabled,
            focused,
            variant,
          }),
          className
        )}
        disabled={disabled}
        disableDefaultStyles
        {...props}
      />
    );
  }
);

Editor.displayName = 'Editor';
