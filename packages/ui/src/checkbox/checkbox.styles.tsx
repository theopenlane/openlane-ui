import { tv, type VariantProps } from 'tailwind-variants'

export const checkboxStyles = tv({
  slots: {
    root: 'peer h-5 w-5 shrink-0 bg-btn-secondary rounded-md border border-border ring-offset-white text-primary',
    indicator: 'flex items-center justify-center text-current',
    checkIcon: 'h-4 w-4 text-brand-900',
  },
})

export type CheckboxVariants = VariantProps<typeof checkboxStyles>
