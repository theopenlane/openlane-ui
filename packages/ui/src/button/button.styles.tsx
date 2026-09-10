import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonStyles = tv({
  slots: {
    base: `flex h-9 py-[6px] px-[14px] items-center gap-2 transition-colors duration-500 rounded-md inline-flex group justify-center whitespace-nowrap`,
    iconOuter: 'relative h-4 w-4 shrink-0 overflow-hidden',
    iconInner: 'absolute transition-all duration-500 group-hover:text-current',
    loadingWrapper: 'absolute top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2',
    loadingIcon: 'animate-spin !h-6 !w-6',
    childWrapper: 'tracking-normal',
  },
  variants: {
    variant: {
      primary: `
        btn-primary
        disabled:cursor-not-allowed
        disabled:text-btn-primary-text-disabled
        focus:shadow-[0_1px_1px_0.5px_rgba(9,21,29,0.32),_0_0_0_4px_rgba(44,203,171,0.25)]
        focus:bg-btn-primary
        focus-visible:shadow-[0_1px_1px_0.5px_rgba(9,21,29,0.32),_0_0_0_4px_rgba(44,203,171,0.25)]
        focus-visible:bg-btn-primary
        focus-visible:btn-primary-focus
      `,
      secondary: `
        btn-secondary
        disabled:cursor-not-allowed
        disabled:text-btn-secondary-text-disabled
        disabled:bg-btn-secondary-disabled
        focus:btn-secondary-focus
        focus:shadow-[0_0_0_4px_rgba(9,21,29,0.06),_0_1px_2px_0_rgba(9,21,29,0.04),_0_-1px_0_0_rgba(9,21,29,0.1)_inset]
        dark:focus:shadow-[0_0_0_4px_rgba(96,232,201,0.24),_0_1px_1px_0.5px_rgba(9,21,29,0.24)]
        focus-visible:btn-secondary-focus
        focus-visible:shadow-[0_0_0_4px_rgba(9,21,29,0.06),_0_1px_2px_0_rgba(9,21,29,0.04),_0_-1px_0_0_rgba(9,21,29,0.1)_inset]
        dark:focus-visible:shadow-[0_0_0_4px_rgba(96,232,201,0.24),_0_1px_1px_0.5px_rgba(9,21,29,0.24)]
      `,
      outline: 'border-border text-text-paragraph border',
      transparent: `
        bg-transparent
        border
        border-transparent
        hover:bg-btn-secondary
        hover:border-border
        disabled:cursor-not-allowed
        disabled:text-btn-secondary-text-disabled
      `,
      filled: 'bg-btn-primary text-btn-primary-text',
      tag: `
        border
        border-border
        rounded-lg
        text-muted-foreground
        hover:text-text-paragraph
        hover:border-text-paragraph
        [&.is-active]:border-active-filter-border
        [&.is-active]:bg-active-filter-background
        [&.is-active]:text-active-filter-text
      `,
      icon: 'text-muted-foreground hover:text-foreground',
      sidebar: `bg-transparent
        border border-transparent
        rounded-[6px]
        text-muted-foreground
        transition-all duration-500 ease-in-out
        hover:bg-nav
        hover:border-border
        hover:text-text-paragraph
        [&.is-active]:bg-nav
        [&.is-active]:border-border
        [&.is-active]:text-text-paragraph
      `,
      link: 'bg-transparent border-none font-medium hover:underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50',
      menuItem: 'justify-start bg-transparent rounded-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
      destructive: 'flex-row-reverse !bg-destructive text-destructive-foreground ',
      destructiveOutline: 'border-red-500 text-red-500 border dark:border-red-500 dark:text-red-500',
      success: 'flex-row-reverse !bg-teal-600 text-white',
      approve: 'border-teal-600 text-teal-600 border disabled:cursor-not-allowed disabled:opacity-50',
    },
    size: {
      sm: 'h-auto p-0 text-sm px-2',
      md: 'h-8 px-2 text-sm',
      lg: 'h-16 px-8 text-lg',
      xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
      icon: 'size-9 p-0 gap-0',
      'icon-xs': "size-6 p-0 gap-0 rounded-md [&_svg:not([class*='size-'])]:size-3",
      'icon-sm': 'size-8 p-0 gap-0',
      'icon-lg': 'size-10 p-0 gap-0',
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
    { variant: 'link', class: { base: 'h-auto p-0' } },
    { variant: 'menuItem', class: { base: 'h-auto py-0 px-1 text-base' } },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export type ButtonVariants = VariantProps<typeof buttonStyles>

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  asChild?: boolean
  icon?: ReactNode
  loading?: boolean
  descriptiveTooltipText?: string
}
