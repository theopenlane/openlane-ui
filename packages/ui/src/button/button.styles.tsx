import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

export const buttonStyles = tv({
  slots: {
    base: `flex h-10 py-[6px] px-[14px] items-center gap-2 transition-color duration-500 rounded-md inline-flex `,
    iconOuter: 'relative h-4 w-4 overflow-hidden',
    iconInner: 'absolute transition-all duration-500',
    loadingWrapper: 'absolute top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2',
    loadingIcon: 'animate-spin !h-6 !w-6',
    childWrapper: 'tracking-normal',
  },
  //.btn-secondary:hover {
  //     background-color: var(--color-btn-secondary-hover);
  //     border-color: var(--color-border);
  //   }
  //   .btn-secondary:disabled {
  //     color: var(--color-btn-secondary-text-disabled);
  //   }
  variants: {
    variant: {
      primary: `
        bg-btn-primary
        text-btn-primary-text
        ease-in-out
        hover:bg-btn-primary-hover
        hover:rounded-md
        disabled:cursor-not-allowed
        disabled:text-btn-primary-text-disabled
    `,
      secondary: `
      bg-btn-secondary
      text-btn-secondary-text
      btn-secondary
    `,
      secondaryOutline: `
      border-border text-text-paragraph border hover:bg-btn-secondary-hover
    `,
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
        [&.is-active]:text-text-paragraph`,
      filled: 'bg-button text-button-text ',
      light: 'bg-button-light text-text-dark ',
      outline: 'border-border text-text-paragraph border',
      outlineLight: 'border-border-dark text-text-dark border',
      outlineInput: 'border-border text-text-paragraph border ',
      outlineInputPadding: 'border-border text-paragraph mx-1 border ',
      redOutline: 'border-red-500 text-red-500 border  dark:border-red-500 dark:text-red-500',
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
