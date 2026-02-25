import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonStyles = tv({
  slots: {
    base: `flex h-9 py-[6px] px-[14px] items-center gap-2 transition-color duration-500 rounded-md inline-flex group justify-center whitespace-nowrap`,
    iconOuter: 'relative h-4 w-4 overflow-hidden',
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
      secondaryOutline: `border-border text-text-paragraph border hover:bg-btn-secondary-hover`,
      icon: 'text-muted-foreground hover:text-foreground',
      iconButton: `
        bg-transparent
        text-muted-foreground
        rounded-md
        hover:bg-nav
        hover:border-border
        hover:text-text-paragraph
        [&.is-active]:!bg-nav
        [&.is-active]:border-border
        [&.is-active]:text-text-paragraph
      `,
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
      transparent: `
        bg-transparent
        border
        border-transparent
        hover:bg-btn-secondary
        hover:border-border
        disabled:cursor-not-allowed
        disabled:text-btn-secondary-text-disabled
      `,
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
      filled: 'bg-button text-button-text ',
      light: 'bg-button-light text-text-dark ',
      outline: 'border-border text-text-paragraph border',
      outlineLight: 'border-border-dark text-text-dark border',
      outlineInput: 'border-border text-text-paragraph border ',
      outlineInputPadding: 'border-border text-paragraph mx-1 border ',
      redOutline: 'border-red-500 text-red-500 border dark:border-red-500 dark:text-red-500',
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
      sm: 'h-auto p-0 text-sm px-2',
      md: 'h-8 px-2 text-sm',
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
