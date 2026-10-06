import { tv, type VariantProps } from 'tailwind-variants'

export const formStyles = tv({
  slots: {
    formItem: 'space-y-2',
    formLabelRequired: 'ml-0.5 text-destructive',
    formDescription: 'text-sm text-muted-foreground',
    formMessage: 'text-sm text-destructive',
  },
})

export type FormVariants = VariantProps<typeof formStyles>
