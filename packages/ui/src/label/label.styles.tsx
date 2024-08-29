import { tv, type VariantProps } from 'tailwind-variants'

export const labelStyles = tv({
  slots: {
    label:
      'text-base font-sans leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  },
})

export type LabelVariants = VariantProps<typeof labelStyles>
