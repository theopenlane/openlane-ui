'use client';

import * as React from 'react';

import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import { cn, withCn, withRef, withVariants } from '@udecode/cn';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import { Separator } from './separator';
import { withTooltip } from './tooltip';

export const Toolbar = withCn(
  ToolbarPrimitive.Root,
  'relative flex select-none items-center'
);

export const ToolbarToggleGroup = withCn(
  ToolbarPrimitive.ToolbarToggleGroup,
  'flex items-center'
);

export const ToolbarLink = withCn(
  ToolbarPrimitive.Link,
  'font-medium underline underline-offset-4'
);

export const ToolbarSeparator = withCn(
  ToolbarPrimitive.Separator,
  'mx-2 my-1 w-px shrink-0 bg-oxford-blue-200 dark:bg-oxford-blue-800'
);

const toolbarButtonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-oxford-blue-950 ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxford-blue-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([data-icon])]:size-4 dark:text-oxford-blue-50 dark:ring-offset-oxford-blue-950 dark:focus-visible:ring-oxford-blue-300'
  ),
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-3',
        lg: 'h-11 px-5',
        sm: 'h-7 px-2',
      },
      variant: {
        default:
          'bg-transparent hover:bg-oxford-blue-100 hover:text-oxford-blue-500 aria-checked:bg-oxford-blue-100 aria-checked:text-oxford-blue-900 dark:hover:bg-oxford-blue-800 dark:hover:text-oxford-blue-400 dark:aria-checked:bg-oxford-blue-800 dark:aria-checked:text-oxford-blue-50',
        outline:
          'border border-oxford-blue-200 bg-transparent hover:bg-oxford-blue-100 hover:text-oxford-blue-900 dark:border-oxford-blue-800 dark:hover:bg-oxford-blue-800 dark:hover:text-oxford-blue-50',
      },
    },
  }
);

const ToolbarButton = withTooltip(
  // eslint-disable-next-line react/display-name
  React.forwardRef<
    React.ElementRef<typeof ToolbarToggleItem>,
    {
      isDropdown?: boolean;
      pressed?: boolean;
    } & Omit<
      React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>,
      'asChild' | 'value'
    > &
      VariantProps<typeof toolbarButtonVariants>
  >(
    (
      { children, className, isDropdown, pressed, size, variant, ...props },
      ref
    ) => {
      return typeof pressed === 'boolean' ? (
        <ToolbarToggleGroup
          disabled={props.disabled}
          value='single'
          type='single'
        >
          <ToolbarToggleItem
            ref={ref}
            className={cn(
              toolbarButtonVariants({
                size,
                variant,
              }),
              isDropdown && 'justify-between gap-1 pr-1',
              className
            )}
            value={pressed ? 'single' : ''}
            {...props}
          >
            {isDropdown ? (
              <>
                <div className='flex flex-1 items-center gap-2 whitespace-nowrap'>
                  {children}
                </div>
                <div>
                  <ChevronDown
                    className='size-3.5 text-oxford-blue-500 dark:text-oxford-blue-400'
                    data-icon
                  />
                </div>
              </>
            ) : (
              children
            )}
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
      ) : (
        <ToolbarPrimitive.Button
          ref={ref}
          className={cn(
            toolbarButtonVariants({
              size,
              variant,
            }),
            isDropdown && 'pr-1',
            className
          )}
          {...props}
        >
          {children}
        </ToolbarPrimitive.Button>
      );
    }
  )
);
ToolbarButton.displayName = 'ToolbarButton';

export { ToolbarButton };

export const ToolbarToggleItem = withVariants(
  ToolbarPrimitive.ToggleItem,
  toolbarButtonVariants,
  ['variant', 'size']
);

export const ToolbarGroup = withRef<'div'>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'group/toolbar-group',
        'relative hidden has-[button]:flex',
        className
      )}
    >
      <div className='flex items-center'>{children}</div>

      <div className='mx-1.5 py-0.5 group-last/toolbar-group:!hidden'>
        <Separator orientation='vertical' />
      </div>
    </div>
  );
});