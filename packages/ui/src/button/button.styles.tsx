import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonStyles = tv({
  slots: {
    base: 'relative group font-sans font-semibold text-white inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md leading-none text-sm transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blackberry-300 disabled:pointer-events-none disabled:opacity-50',
    iconOuter: 'relative h-4 w-4 overflow-hidden',
    iconInner: 'absolute transition-all duration-500',
    loadingWrapper:
      'absolute top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2',
    loadingIcon: 'animate-spin !h-6 !w-6',
    loadingText: 'opacity-0',
    childWrapper: '',
  },
  variants: {
    variant: {
      sunglow: '!bg-sunglow-900 hover:!opacity-90',
      blackberry: '!bg-blackberry-900 hover:!opacity-90',
      outline:
        'border-blackberry-800 text-blackberry-800 border hover:!opacity-90',
      outlineLight:
        'border-blackberry-500 text-blackberry-800 border hover:!opacity-90',
      redOutline:
        'border-util-red-500 text-util-red-500 border bg-white hover:!opacity-90 dark:border-util-red-500 dark:text-util-red-500',
      white: {},
      success: 'flex-row-reverse !bg-util-green-500 hover:!opacity-90',
    },
    iconPosition: {
      left: 'flex-row-reverse',
    },
    iconAnimated: {
      true: {
        iconInner: 'group-hover:-translate-y-4',
      },
    },
    size: {
      sm: 'h-auto rounded-none p-0 !bg-transparent font-sans text-lg',
      md: 'h-12 rounded-md text-base px-5',
      lg: 'h-16 px-8 text-lg',
    },
    full: {
      true: {
        base: 'flex w-full',
      },
    },
    childFull: {
      true: {
        childWrapper: 'flex w-full',
      },
    },
  },
  compoundVariants: [
    {
      variant: 'sunglow',
      size: 'sm',
      class: 'text-sunglow-900',
    },
    {
      variant: 'blackberry',
      size: 'sm',
      class: 'text-blackberry-900',
    },
    {
      variant: 'white',
      size: 'sm',
      class: 'text-white',
    },
    {
      variant: 'success',
      size: 'sm',
      class: 'text-white',
    },
  ],
  defaultVariants: {
    variant: 'sunglow',
    size: 'md',
  },
})

//TODO: Important is needed here for backgrounds due to https://github.com/tailwindlabs/tailwindcss/issues/12734

export type ButtonVariants = VariantProps<typeof buttonStyles>

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean
  icon?: ReactNode
  loading?: boolean
}
