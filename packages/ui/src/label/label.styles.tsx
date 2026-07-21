import { tv, type VariantProps } from 'tailwind-variants'

export const labelStyles = tv({
  slots: {
    label: 'text-base font-sans leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  },
  variants: {
    variant: {
      default: { label: '' },
      card: { label: 'flex min-h-[96px] w-full cursor-pointer items-start gap-3 rounded-md border p-4 font-normal leading-5 transition-colors' },
    },
    selected: {
      true: { label: '' },
      false: { label: '' },
    },
  },
  compoundVariants: [
    {
      variant: 'card',
      selected: true,
      class: { label: 'border-primary bg-primary/10 ring-1 ring-primary' },
    },
    {
      variant: 'card',
      selected: false,
      class: { label: 'border-border bg-background hover:bg-muted/20' },
    },
  ],
  defaultVariants: {
    variant: 'default',
    selected: false,
  },
})

export type LabelVariants = VariantProps<typeof labelStyles>
