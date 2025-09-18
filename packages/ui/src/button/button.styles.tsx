import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonStyles = tv({
  slots: {
    base:
      'relative group font-sans font-semibold inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md leading-none ' +
      'text-sm transition-all duration-500 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    iconOuter: 'relative h-4 w-4 overflow-hidden',
    iconInner: 'absolute transition-all duration-500',
    loadingWrapper: 'absolute top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2',
    loadingIcon: 'animate-spin !h-6 !w-6',
    childWrapper: 'tracking-normal',
  },
  variants: {
    variant: {
      filled: 'bg-button text-button-text ',
      light: 'bg-button-light text-text-dark ',
      outline: 'border-border text-text-paragraph border',
      outlineLight: 'border-border-dark text-text-dark border',
      outlineInput: 'border-border text-text-paragraph border ',
      outlineInputPadding: 'border-border text-paragraph mx-1 border ',
      redOutline: 'border-error text-error border  dark:border-red-500 dark:text-red-500',
      white: {},
      success: 'flex-row-reverse !bg-teal-600 text-button-text ',
      destructive: 'flex-row-reverse !bg-destructive text-destructive-foreground ',
      back: 'bg-button-back text-text-dark',
    },
    iconPosition: {
      left: 'flex-row-reverse',
      center: 'gap-0',
    },
    iconAnimated: {
      true: {
        iconInner: 'group-hover:-translate-y-4',
      },
    },
    size: {
      sm: 'h-auto rounded-md p-0 !bg-transparent font-sans text-sm',
      md: 'h-10 rounded-md px-5 text-sm',
      lg: 'h-16 rounded-lg px-8 text-lg',
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
      variant: 'filled',
      size: 'sm',
      class: 'text-default-900',
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
    variant: 'filled',
    size: 'md',
  },
})

//TODO: Important is needed here for backgrounds due to https://github.com/tailwindlabs/tailwindcss/issues/12734

export type ButtonVariants = VariantProps<typeof buttonStyles>

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  asChild?: boolean
  icon?: ReactNode
  loading?: boolean
  descriptiveTooltipText?: string
}
