import { tv, type VariantProps } from 'tailwind-variants'

export const copyableTextStyles = tv({
  slots: {
    trigger: 'group flex items-center gap-1.5 text-left hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    value: 'break-all',
    icon: 'text-muted-foreground shrink-0',
  },
  variants: {
    variant: {
      inline: {
        trigger: 'rounded-sm',
        icon: 'transition-opacity opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
      },
      chip: {
        trigger: 'rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-sm text-foreground',
      },
    },
  },
  defaultVariants: {
    variant: 'inline',
  },
})

export type CopyableTextVariants = VariantProps<typeof copyableTextStyles>
